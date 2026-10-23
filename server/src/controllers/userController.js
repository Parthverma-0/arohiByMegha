import { z } from 'zod';
import User from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';

const addressFields = z.object({
  label: z.string().trim().max(30).optional().default('Home'),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\+?\d{10,14}$/, 'Please enter a valid phone number'),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  stateCode: z.string().trim().max(10).optional(),
  country: z.string().trim().min(2).max(100).optional().default('India'),
  countryCode: z.string().trim().length(2).optional().default('IN'),
  pincode: z.string().trim().min(4).max(10),
  isDefault: z.coerce.boolean().optional().default(false),
});

const validIndianPincode = (a) => a.countryCode !== 'IN' || a.pincode === undefined || /^\d{6}$/.test(a.pincode);
const pincodeMessage = { message: 'Please enter a valid 6-digit pincode', path: ['pincode'] };

export const addressInputSchema = addressFields.refine(validIndianPincode, pincodeMessage);
// No defaults on update, so a partial edit doesn't reset fields it didn't send.
export const addressUpdateSchema = addressFields
  .extend({ label: z.string().trim().max(30), country: z.string().trim().min(2).max(100), countryCode: z.string().trim().length(2), isDefault: z.coerce.boolean() })
  .partial()
  .refine(validIndianPincode, pincodeMessage);

function ensureOneDefault(user) {
  if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) user.addresses[0].isDefault = true;
}

export const listAddresses = catchAsync(async (req, res) => {
  res.json({ success: true, addresses: req.currentUser.addresses });
});

export const addAddress = catchAsync(async (req, res) => {
  const user = req.currentUser;
  if (user.addresses.length >= 20) throw new ApiError(400, 'You can save up to 20 addresses');
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  user.addresses.push(req.body);
  ensureOneDefault(user);
  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses, address: user.addresses[user.addresses.length - 1] });
});

export const updateAddress = catchAsync(async (req, res) => {
  const user = req.currentUser;
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found');
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  Object.assign(address, req.body);
  ensureOneDefault(user);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

export const deleteAddress = catchAsync(async (req, res) => {
  const user = req.currentUser;
  user.addresses = user.addresses.filter((a) => String(a._id) !== req.params.addressId);
  ensureOneDefault(user);
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
