import { z } from 'zod';
import Coupon from '../models/Coupon.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';
import { applyCoupon } from '../utils/pricing.js';

// Public — lets the cart/checkout page preview a coupon's discount before placing the order.
export const previewCoupon = catchAsync(async (req, res) => {
  const { code } = req.body;
  const owner = req.userId ? String(req.userId) : req.cookies?.guest_cart_id;
  const ownerType = req.userId ? 'user' : 'guest';
  if (!owner) throw new ApiError(400, 'Your cart is empty');

  const cart = await Cart.findOne({ owner, ownerType });
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Your cart is empty');

  const products = await Product.find({ _id: { $in: cart.items.map((i) => i.product) } });
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const subtotal = cart.items.reduce((sum, i) => {
    const p = byId.get(String(i.product));
    return sum + (p ? p.price * i.quantity : 0);
  }, 0);

  const result = await applyCoupon(code, subtotal);
  res.json({ success: true, code: result.code, discount: result.discount, subtotal });
});

export const couponInputSchema = z.object({
  code: z.string().min(3).max(30),
  type: z.enum(['percent', 'flat']),
  value: z.coerce.number().min(0),
  minOrderValue: z.coerce.number().min(0).optional().default(0),
  maxDiscount: z.coerce.number().min(0).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  usageLimit: z.coerce.number().int().min(1).nullable().optional(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const adminListCoupons = catchAsync(async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

export const createCoupon = catchAsync(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, code: req.body.code.toUpperCase() });
  res.status(201).json({ success: true, coupon });
});

export const updateCoupon = catchAsync(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    { ...req.body, ...(req.body.code ? { code: req.body.code.toUpperCase() } : {}) },
    { new: true, runValidators: true }
  );
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ success: true, coupon });
});

export const deleteCoupon = catchAsync(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ success: true });
});
