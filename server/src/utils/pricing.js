import Coupon from '../models/Coupon.js';
import { ApiError } from './ApiError.js';

export async function applyCoupon(couponCode, subtotal) {
  if (!couponCode) return { code: undefined, discount: 0 };
  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
  if (!coupon) throw new ApiError(400, 'Invalid coupon code');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, 'This coupon has expired');
  if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) throw new ApiError(400, 'This coupon has reached its usage limit');
  if (subtotal < coupon.minOrderValue) throw new ApiError(400, `Minimum order value for this coupon is ₹${coupon.minOrderValue}`);

  let discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal);
  return { code: coupon.code, discount, couponDoc: coupon };
}
