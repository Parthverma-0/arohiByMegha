import crypto from 'crypto';
import { z } from 'zod';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';
import { razorpay, isRazorpayConfigured, verifyPaymentSignature } from '../utils/razorpay.js';
import { applyCoupon } from '../utils/pricing.js';
import { logOrderToExcel, rebuildOrdersWorkbook, ordersWorkbookExists, WORKBOOK_PATH } from '../utils/orderExcelLog.js';

const FLAT_SHIPPING_FEE = 0; // free shipping for now; make this pincode/weight based later if needed

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4).max(10),
});

export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  couponCode: z.string().optional(),
});

function generateOrderNumber() {
  return `AM${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function getGuestOrUserOwner(req) {
  if (req.userId) return { owner: String(req.userId), ownerType: 'user' };
  const guestId = req.cookies?.guest_cart_id;
  if (!guestId) throw new ApiError(400, 'Your cart is empty');
  return { owner: guestId, ownerType: 'guest' };
}

async function loadPricedCart(req) {
  const { owner, ownerType } = getGuestOrUserOwner(req);
  const cart = await Cart.findOne({ owner, ownerType });
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Your cart is empty');

  const products = await Product.find({ _id: { $in: cart.items.map((i) => i.product) } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lineItems = [];
  for (const item of cart.items) {
    const product = byId.get(String(item.product));
    if (!product || !product.isActive) throw new ApiError(400, `A product in your cart is no longer available`);
    if (product.stock < item.quantity) throw new ApiError(400, `Not enough stock for ${product.name}`);
    lineItems.push({ product, quantity: item.quantity });
  }
  const subtotal = lineItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  return { cart, lineItems, subtotal };
}

async function finalizeOrder({ req, lineItems, subtotal, shippingAddress, coupon, paymentMethod, paymentStatus, razorpayInfo, cart }) {
  const total = Math.max(0, subtotal + FLAT_SHIPPING_FEE - coupon.discount);

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.userId || null,
    items: lineItems.map(({ product, quantity }) => ({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url,
      price: product.price,
      quantity,
    })),
    shippingAddress,
    coupon: coupon.code ? { code: coupon.code, discount: coupon.discount } : undefined,
    subtotal,
    shippingFee: FLAT_SHIPPING_FEE,
    discount: coupon.discount,
    total,
    paymentMethod,
    paymentStatus,
    razorpay: razorpayInfo,
  });

  await Promise.all(
    lineItems.map(({ product, quantity }) => Product.updateOne({ _id: product._id }, { $inc: { stock: -quantity } }))
  );
  if (coupon.couponDoc) await Coupon.updateOne({ _id: coupon.couponDoc._id }, { $inc: { timesUsed: 1 } });

  cart.items = [];
  await cart.save();

  try {
    await logOrderToExcel(order);
  } catch (err) {
    // Excel export is a convenience, not the source of truth (Mongo is) — never fail
    // checkout over it. Admins can regenerate the sheet from the DB at any time.
    console.error('[orderExcelLog] failed to log order to Excel:', err);
  }

  return order;
}

// COD checkout — creates the order immediately.
export const createCodOrder = catchAsync(async (req, res) => {
  const { shippingAddress, couponCode } = req.body;
  const { lineItems, subtotal, cart } = await loadPricedCart(req);
  const coupon = await applyCoupon(couponCode, subtotal);

  const order = await finalizeOrder({
    req,
    lineItems,
    subtotal,
    shippingAddress,
    coupon,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    cart,
  });

  res.status(201).json({ success: true, order });
});

// Step 1 of online payment — create a Razorpay order for the current cart total.
export const createRazorpayOrder = catchAsync(async (req, res) => {
  if (!isRazorpayConfigured) throw new ApiError(503, 'Online payment is not configured yet — please use Cash on Delivery');
  const { couponCode } = req.body;
  const { subtotal } = await loadPricedCart(req);
  const coupon = await applyCoupon(couponCode, subtotal);
  const total = Math.max(0, subtotal + FLAT_SHIPPING_FEE - coupon.discount);

  const rpOrder = await razorpay.orders.create({
    amount: Math.round(total * 100),
    currency: 'INR',
    receipt: generateOrderNumber(),
  });

  res.json({ success: true, razorpayOrderId: rpOrder.id, amount: rpOrder.amount, keyId: process.env.RAZORPAY_KEY_ID });
});

export const verifyRazorpaySchema = z.object({
  shippingAddress: addressSchema,
  couponCode: z.string().optional(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

// Step 2 — verify the payment signature, then create the order.
export const verifyRazorpayOrder = catchAsync(async (req, res) => {
  const { shippingAddress, couponCode, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const valid = verifyPaymentSignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature });
  if (!valid) throw new ApiError(400, 'Payment verification failed');

  const { lineItems, subtotal, cart } = await loadPricedCart(req);
  const coupon = await applyCoupon(couponCode, subtotal);

  const order = await finalizeOrder({
    req,
    lineItems,
    subtotal,
    shippingAddress,
    coupon,
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    razorpayInfo: { orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature },
    cart,
  });

  res.status(201).json({ success: true, order });
});

export const myOrders = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

export const getMyOrder = catchAsync(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, order });
});

// ----- Admin -----

export const adminListOrders = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
  const filter = {};
  if (req.query.status) filter.currentStatus = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
});

export const adminGetOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, order });
});

export const updateStatusSchema = z.object({
  status: z.enum(['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded']),
  note: z.string().optional(),
});

export const adminUpdateOrderStatus = catchAsync(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  order.currentStatus = status;
  order.statusHistory.push({ status, note });
  if (status === 'delivered' && order.paymentMethod === 'cod') order.paymentStatus = 'paid';
  if (status === 'refunded') order.paymentStatus = 'refunded';
  await order.save();

  res.json({ success: true, order });
});

// Downloads the running orders.xlsx (rebuilding it from Mongo first if it's missing —
// e.g. after a redeploy on a host with ephemeral disk).
export const adminExportOrdersExcel = catchAsync(async (req, res) => {
  if (!ordersWorkbookExists()) await rebuildOrdersWorkbook();
  res.download(WORKBOOK_PATH, 'arohi-orders.xlsx');
});

// Regenerates orders.xlsx from Mongo (source of truth) and downloads it — use when the
// sheet looks out of sync with order statuses, or after restoring from a fresh deploy.
export const adminRebuildOrdersExcel = catchAsync(async (req, res) => {
  await rebuildOrdersWorkbook();
  res.download(WORKBOOK_PATH, 'arohi-orders.xlsx');
});
