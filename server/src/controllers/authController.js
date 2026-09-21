import { z } from 'zod';
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';
import {
  signCustomerAccessToken,
  signCustomerRefreshToken,
  verifyCustomerRefreshToken,
  cookieOptions,
} from '../utils/tokens.js';

const REFRESH_COOKIE = 'customer_refresh';

export const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  password: z.string().min(8).max(100),
  marketingConsent: z.boolean().optional().default(false),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function mergeGuestCartIntoUser(req, userId) {
  const guestId = req.cookies?.guest_cart_id;
  if (!guestId) return;
  const guestCart = await Cart.findOne({ owner: guestId, ownerType: 'guest' });
  if (!guestCart || guestCart.items.length === 0) return;
  let userCart = await Cart.findOne({ owner: String(userId), ownerType: 'user' });
  if (!userCart) {
    userCart = new Cart({ owner: String(userId), ownerType: 'user', items: [] });
  }
  for (const item of guestCart.items) {
    const existing = userCart.items.find((i) => String(i.product) === String(item.product));
    if (existing) existing.quantity += item.quantity;
    else userCart.items.push(item);
  }
  await userCart.save();
  await guestCart.deleteOne();
}

function sendAuthResponse(res, user) {
  const accessToken = signCustomerAccessToken(user);
  const refreshToken = signCustomerRefreshToken(user);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(30 * 24 * 60 * 60 * 1000));
  res.json({ success: true, accessToken, user: user.toSafeJSON() });
}

export const signup = catchAsync(async (req, res) => {
  const { name, email, phone, password, marketingConsent } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = new User({ name, email, phone, marketingConsent });
  await user.setPassword(password);
  await user.save();
  await mergeGuestCartIntoUser(req, user._id);
  sendAuthResponse(res, user);
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  await mergeGuestCartIntoUser(req, user._id);
  sendAuthResponse(res, user);
});

export const refresh = catchAsync(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new ApiError(401, 'Not logged in');
  let payload;
  try {
    payload = verifyCustomerRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Session expired, please log in again');
  }
  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tv) {
    throw new ApiError(401, 'Session expired, please log in again');
  }
  const accessToken = signCustomerAccessToken(user);
  res.json({ success: true, accessToken, user: user.toSafeJSON() });
});

export const logout = catchAsync(async (req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
  res.json({ success: true });
});

export const me = catchAsync(async (req, res) => {
  res.json({ success: true, user: req.currentUser.toSafeJSON() });
});
