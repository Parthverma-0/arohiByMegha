import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
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

// An OAuth client ID is public (Google's button ships it to every browser), so defaulting it here
// means the site works without extra deploy config; set GOOGLE_CLIENT_ID to override.
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || '507960590061-it20q31vq1nmutiorsngupqcpttp75vi.apps.googleusercontent.com';

const googleClient = new OAuth2Client();

export const googleSchema = z.object({ credential: z.string().min(1) });

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

export const googleConfig = (req, res) => {
  res.json({ success: true, clientId: GOOGLE_CLIENT_ID });
};

export const googleLogin = catchAsync(async (req, res) => {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, 'Google sign-in failed, please try again');
  }
  // Only a Google-verified email is trusted enough to link to an existing account.
  if (!payload?.email || !payload.email_verified) {
    throw new ApiError(401, 'Your Google account email is not verified');
  }

  const email = payload.email.toLowerCase();
  let user = await User.findOne({ googleId: payload.sub });
  if (!user) {
    user = await User.findOne({ email });
    if (user) {
      user.googleId = payload.sub;
      await user.save();
    } else {
      user = await User.create({ name: payload.name || email.split('@')[0], email, googleId: payload.sub });
    }
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
