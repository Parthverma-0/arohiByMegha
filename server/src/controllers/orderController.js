import crypto from 'crypto';
import { z } from 'zod';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import PaymentAttempt from '../models/PaymentAttempt.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';
import { razorpay, isRazorpayConfigured, verifyPaymentSignature, verifyWebhookSignature } from '../utils/razorpay.js';
import { applyCoupon } from '../utils/pricing.js';
import { buildOrdersWorkbook } from '../utils/orderExcelLog.js';
import { ensureInvoiceNumber, buildInvoicePdf, invoiceFilename, emailInvoice } from '../utils/invoice.js';

const FLAT_SHIPPING_FEE = 0; // free shipping for now; make this pincode/weight based later if needed

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10).max(15),
  email: z.string().trim().email(), // required: the invoice is emailed here
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

const round2 = (n) => Math.round(n * 100) / 100;

function getGuestOrUserOwner(req) {
  if (req.userId) return { owner: String(req.userId), ownerType: 'user' };
  const guestId = req.cookies?.guest_cart_id;
  if (!guestId) throw new ApiError(400, 'Your cart is empty');
  return { owner: guestId, ownerType: 'guest' };
}

// Prices the shopper's current cart and applies the coupon. Returns a plain
// snapshot (no live documents) so it can be stored and turned into an order later.
async function priceCheckout(req, couponCode) {
  const { owner, ownerType } = getGuestOrUserOwner(req);
  const cart = await Cart.findOne({ owner, ownerType });
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Your cart is empty');

  const products = await Product.find({ _id: { $in: cart.items.map((i) => i.product) } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = [];
  for (const item of cart.items) {
    const product = byId.get(String(item.product));
    if (!product || !product.isActive) throw new ApiError(400, `A product in your cart is no longer available`);
    if (product.stock < item.quantity) throw new ApiError(400, `Not enough stock for ${product.name}`);
    items.push({ product: product._id, name: product.name, image: product.images?.[0]?.url, price: product.price, quantity: item.quantity });
  }
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const coupon = await applyCoupon(couponCode, subtotal);
  const discount = round2(coupon.discount);
  const total = round2(Math.max(0, subtotal + FLAT_SHIPPING_FEE - discount));
  return {
    cartOwner: owner,
    cartOwnerType: ownerType,
    items,
    subtotal,
    coupon: coupon.code ? { code: coupon.code, discount, couponId: coupon.couponDoc._id } : undefined,
    total,
  };
}

async function finalizeOrder({ orderNumber, userId, checkout, shippingAddress, paymentMethod, paymentStatus, razorpay: razorpayInfo }) {
  const discount = checkout.coupon?.discount || 0;
  const order = await Order.create({
    orderNumber: orderNumber || generateOrderNumber(),
    user: userId || null,
    items: checkout.items,
    shippingAddress,
    coupon: checkout.coupon?.code ? { code: checkout.coupon.code, discount } : undefined,
    subtotal: checkout.subtotal,
    shippingFee: FLAT_SHIPPING_FEE,
    discount,
    total: checkout.total,
    paymentMethod,
    paymentStatus,
    razorpay: razorpayInfo,
  });

  await Promise.all(checkout.items.map(({ product, quantity }) => Product.updateOne({ _id: product }, { $inc: { stock: -quantity } })));
  if (checkout.coupon?.couponId) await Coupon.updateOne({ _id: checkout.coupon.couponId }, { $inc: { timesUsed: 1 } });
  await Cart.updateOne({ owner: checkout.cartOwner, ownerType: checkout.cartOwnerType }, { $set: { items: [] } });

  return order;
}

// COD checkout — creates the order immediately.
export const createCodOrder = catchAsync(async (req, res) => {
  const { shippingAddress, couponCode } = req.body;
  const checkout = await priceCheckout(req, couponCode);
  const order = await finalizeOrder({ userId: req.userId, checkout, shippingAddress, paymentMethod: 'cod', paymentStatus: 'pending' });
  res.status(201).json({ success: true, order });
});

// ----- Razorpay online payment -----
//
// 1. /razorpay/initiate  prices the cart, creates a Razorpay order and
//                        snapshots everything as a PaymentAttempt.
// 2. The shopper pays in Razorpay's popup.
// 3. /razorpay/verify    (browser, with the popup's signed result) and
//                        /razorpay/webhook (Razorpay's server-to-server event)
//                        both end up in settleRazorpayPayment(), which checks
//                        the payment with Razorpay's API and creates the order
//                        exactly once. Whichever arrives first wins.

export const initiateRazorpayPayment = catchAsync(async (req, res) => {
  if (!isRazorpayConfigured) throw new ApiError(503, 'Online payment is not set up yet — please use Cash on Delivery');
  const { shippingAddress, couponCode } = req.body;
  const checkout = await priceCheckout(req, couponCode);
  if (checkout.total <= 0) throw new ApiError(400, 'Nothing to pay online for this order');

  const orderNumber = generateOrderNumber();
  const amountPaise = Math.round(checkout.total * 100);
  const rpOrder = await razorpay.orders.create({ amount: amountPaise, currency: 'INR', receipt: orderNumber, notes: { orderNumber } }).catch((err) => {
    throw new ApiError(502, `Razorpay: ${err?.error?.description || err.message || 'could not start payment'}`);
  });
  await PaymentAttempt.create({ razorpayOrderId: rpOrder.id, orderNumber, user: req.userId || null, shippingAddress, ...checkout });

  res.json({ success: true, razorpayOrderId: rpOrder.id, amount: rpOrder.amount, keyId: process.env.RAZORPAY_KEY_ID });
});

// Returns { state: 'paid', order } | { state: 'pending' } | { state: 'failed', reason }.
// Safe to call any number of times, concurrently, for the same payment.
async function settleRazorpayPayment(razorpayOrderId, paymentId) {
  const attempt = await PaymentAttempt.findOneAndUpdate(
    { razorpayOrderId, status: 'initiated' },
    { $set: { status: 'processing' } },
    { new: true }
  );
  if (!attempt) {
    const existing = await PaymentAttempt.findOne({ razorpayOrderId });
    if (!existing) return { state: 'failed', reason: 'Unknown payment' };
    if (existing.status === 'completed') return { state: 'paid', order: await Order.findById(existing.order) };
    if (existing.status === 'failed') return { state: 'failed', reason: existing.failureReason };
    return { state: 'pending' }; // another request is settling it right now
  }

  try {
    // Ask Razorpay directly rather than trusting the browser.
    let payment = await razorpay.payments.fetch(paymentId);
    if (payment.order_id !== razorpayOrderId) throw new ApiError(400, 'Payment does not belong to this order');
    const expectedPaise = Math.round(attempt.total * 100);
    if (Number(payment.amount) !== expectedPaise) {
      const reason = `Amount mismatch: paid ${payment.amount / 100}, expected ${attempt.total}`;
      await PaymentAttempt.updateOne({ _id: attempt._id }, { status: 'failed', failureReason: reason });
      console.error(`[razorpay] ${razorpayOrderId}: ${reason}`);
      return { state: 'failed', reason: 'Payment amount did not match the order — please contact us' };
    }
    // Accounts without auto-capture leave payments "authorized" until captured.
    if (payment.status === 'authorized') payment = await razorpay.payments.capture(paymentId, expectedPaise, 'INR');

    if (payment.status === 'captured') {
      const order = await finalizeOrder({
        orderNumber: attempt.orderNumber,
        userId: attempt.user,
        checkout: attempt,
        shippingAddress: attempt.shippingAddress,
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        razorpay: { orderId: razorpayOrderId, paymentId, method: payment.method },
      });
      await PaymentAttempt.updateOne({ _id: attempt._id }, { status: 'completed', order: order._id });
      // Paid now, so the invoice goes out now. Awaited (not fire-and-forget)
      // because on Vercel the function is frozen once the response is sent.
      // emailInvoice never throws, so a mail problem can't undo a paid order.
      await emailInvoice(order);
      return { state: 'paid', order: await Order.findById(order._id) };
    }

    if (payment.status === 'failed') {
      // The shopper can retry inside the same popup with another method, so
      // keep the attempt open for a later successful payment.
      await PaymentAttempt.updateOne({ _id: attempt._id }, { status: 'initiated' });
      return { state: 'failed', reason: payment.error_description || 'Payment failed' };
    }

    await PaymentAttempt.updateOne({ _id: attempt._id }, { status: 'initiated' });
    return { state: 'pending' };
  } catch (err) {
    await PaymentAttempt.updateOne({ _id: attempt._id, status: 'processing' }, { status: 'initiated' });
    throw err;
  }
}

export const verifyRazorpaySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

// Called by the browser with the signed result from Razorpay's popup.
export const verifyRazorpayPayment = catchAsync(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!verifyPaymentSignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature })) {
    throw new ApiError(400, 'Payment verification failed');
  }
  const result = await settleRazorpayPayment(razorpayOrderId, razorpayPaymentId);
  if (result.state === 'paid') return res.status(201).json({ success: true, order: result.order });
  if (result.state === 'pending') {
    return res.status(202).json({
      success: true,
      pending: true,
      message: 'Your payment is still being confirmed. We will email you as soon as it goes through.',
    });
  }
  throw new ApiError(400, result.reason || 'Payment failed');
});

// Razorpay webhook (dashboard → Settings → Webhooks, events "payment.captured"
// and "order.paid", secret = RAZORPAY_WEBHOOK_SECRET). Catches payments whose
// shopper never made it back to the site.
export const razorpayWebhook = catchAsync(async (req, res) => {
  if (!verifyWebhookSignature(req.rawBody, req.get('x-razorpay-signature'))) {
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }
  const payment = req.body?.payload?.payment?.entity;
  if (['payment.captured', 'payment.authorized', 'order.paid'].includes(req.body?.event) && payment?.order_id) {
    await settleRazorpayPayment(payment.order_id, payment.id);
  }
  res.json({ success: true });
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
  if (req.query.paymentStatus) filter.paymentStatus = String(req.query.paymentStatus);

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

  // Cash on Delivery is paid on delivery — that's when its invoice goes out.
  if (order.paymentStatus === 'paid' && !order.invoice?.emailedAt) await emailInvoice(order);

  res.json({ success: true, order: await Order.findById(order._id) });
});

async function sendInvoicePdf(res, order) {
  const numbered = await ensureInvoiceNumber(order);
  const pdf = await buildInvoicePdf(numbered);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoiceFilename(numbered)}"`);
  res.send(pdf);
}

export const adminDownloadInvoice = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  await sendInvoicePdf(res, order);
});

export const adminEmailInvoice = catchAsync(async (req, res) => {
  const result = await emailInvoice(req.params.id);
  if (!result.ok) throw new ApiError(502, `Invoice email failed: ${result.error}`);
  res.json({ success: true, order: await Order.findById(req.params.id), sentTo: result.to });
});

export const downloadMyInvoice = catchAsync(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.paymentStatus !== 'paid') throw new ApiError(400, 'The invoice is available once the order is paid');
  await sendInvoicePdf(res, order);
});

// Streams a fresh orders.xlsx built from Mongo — no local file involved, so
// this works the same on a persistent host and a serverless one (Vercel).
export const adminExportOrdersExcel = catchAsync(async (req, res) => {
  const workbook = await buildOrdersWorkbook();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="arohi-orders.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});
