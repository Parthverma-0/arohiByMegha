import { z } from 'zod';
import User from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';

export const addressInputSchema = z.object({
  label: z.string().optional().default('Home'),
  fullName: z.string().min(2),
  phone: z.string().min(10).max(15),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4).max(10),
  isDefault: z.coerce.boolean().optional().default(false),
});

export const addAddress = catchAsync(async (req, res) => {
  const user = req.currentUser;
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
});

export const updateAddress = catchAsync(async (req, res) => {
  const user = req.currentUser;
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found');
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  Object.assign(address, req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

export const deleteAddress = catchAsync(async (req, res) => {
  const user = req.currentUser;
  user.addresses = user.addresses.filter((a) => String(a._id) !== req.params.addressId);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

export const toggleWishlist = catchAsync(async (req, res) => {
  const user = req.currentUser;
  const productId = req.params.productId;
  const idx = user.wishlist.findIndex((id) => String(id) === productId);
  if (idx >= 0) user.wishlist.splice(idx, 1);
  else user.wishlist.push(productId);
  await user.save();
  res.json({ success: true, wishlist: user.wishlist });
});

export const getWishlist = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId).populate('wishlist');
  res.json({ success: true, wishlist: user.wishlist });
});

// ----- Admin -----

export const adminListCustomers = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 100);
  const [customers, total] = await Promise.all([
    User.find({}).select('-passwordHash').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments({}),
  ]);
  res.json({ success: true, customers, total, page, pages: Math.ceil(total / limit) });
});
