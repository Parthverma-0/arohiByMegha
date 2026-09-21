import { z } from 'zod';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import AdminUser from '../models/AdminUser.js';
import AuditLog from '../models/AuditLog.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';
import {
  signAdminAccessToken,
  signAdminRefreshToken,
  verifyAdminRefreshToken,
  signAdmin2FATempToken,
  verifyAdmin2FATempToken,
  cookieOptions,
} from '../utils/tokens.js';

const REFRESH_COOKIE = 'admin_refresh';
const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const codeSchema = z.object({
  tempToken: z.string().min(1),
  code: z.string().min(6).max(6),
});

function getTempAdmin(tempToken) {
  let payload;
  try {
    payload = verifyAdmin2FATempToken(tempToken);
  } catch {
    throw new ApiError(401, 'This login step has expired, please log in again');
  }
  return payload.sub;
}

async function logAction(admin, action, meta, req) {
  await AuditLog.create({
    admin: admin._id,
    adminEmail: admin.email,
    action,
    ip: req.ip,
    meta,
  });
}

function issueFullSession(res, admin) {
  const accessToken = signAdminAccessToken(admin);
  const refreshToken = signAdminRefreshToken(admin);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(12 * 60 * 60 * 1000));
  res.json({ success: true, accessToken, admin: admin.toSafeJSON() });
}

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const admin = await AdminUser.findOne({ email });

  // Constant-shape response whether or not the account exists, to avoid
  // leaking which admin emails are valid.
  if (!admin) throw new ApiError(401, 'Invalid email or password');

  if (admin.isLocked()) {
    throw new ApiError(423, 'Account temporarily locked due to repeated failed logins. Try again later.');
  }

  const validPassword = await admin.comparePassword(password);
  if (!validPassword) {
    admin.failedLoginAttempts += 1;
    if (admin.failedLoginAttempts >= LOCK_THRESHOLD) {
      admin.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      admin.failedLoginAttempts = 0;
    }
    await admin.save();
    throw new ApiError(401, 'Invalid email or password');
  }

  admin.failedLoginAttempts = 0;
  admin.lockedUntil = null;
  await admin.save();

  const tempToken = signAdmin2FATempToken(admin);
  res.json({ success: true, tempToken, totpEnabled: admin.totpEnabled });
});

// Step 2a: first-ever login — generate a TOTP secret and a scannable QR code.
export const setupTwoFactor = catchAsync(async (req, res) => {
  const { tempToken } = req.body;
  const adminId = getTempAdmin(tempToken);
  const admin = await AdminUser.findById(adminId);
  if (!admin) throw new ApiError(401, 'Admin not found');
  if (admin.totpEnabled) throw new ApiError(400, 'Two-factor authentication is already enabled');

  const secret = authenticator.generateSecret();
  admin.totpSecret = secret;
  await admin.save();

  const otpauth = authenticator.keyuri(admin.email, 'Arohi by Megha Admin', secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);
  res.json({ success: true, qrDataUrl, secret });
});

// Step 2b: confirm the 6-digit code from the authenticator app, enabling 2FA and completing login.
export const enableTwoFactor = catchAsync(async (req, res) => {
  const { tempToken, code } = req.body;
  const adminId = getTempAdmin(tempToken);
  const admin = await AdminUser.findById(adminId);
  if (!admin || !admin.totpSecret) throw new ApiError(400, 'Run two-factor setup first');

  const valid = authenticator.check(code, admin.totpSecret);
  if (!valid) throw new ApiError(401, 'Invalid code');

  admin.totpEnabled = true;
  admin.lastLoginAt = new Date();
  await admin.save();
  await logAction(admin, 'two_factor_enabled', {}, req);
  issueFullSession(res, admin);
});

// Step 2c: normal login — verify the 6-digit code, complete login.
export const verifyTwoFactor = catchAsync(async (req, res) => {
  const { tempToken, code } = req.body;
  const adminId = getTempAdmin(tempToken);
  const admin = await AdminUser.findById(adminId);
  if (!admin || !admin.totpEnabled) throw new ApiError(400, 'Two-factor authentication is not set up');

  const valid = authenticator.check(code, admin.totpSecret);
  if (!valid) throw new ApiError(401, 'Invalid code');

  admin.lastLoginAt = new Date();
  await admin.save();
  await logAction(admin, 'login', {}, req);
  issueFullSession(res, admin);
});

export const refresh = catchAsync(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new ApiError(401, 'Not logged in');
  let payload;
  try {
    payload = verifyAdminRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Session expired, please log in again');
  }
  const admin = await AdminUser.findById(payload.sub);
  if (!admin || admin.tokenVersion !== payload.tv) {
    throw new ApiError(401, 'Session expired, please log in again');
  }
  const accessToken = signAdminAccessToken(admin);
  res.json({ success: true, accessToken, admin: admin.toSafeJSON() });
});

export const logout = catchAsync(async (req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
  res.json({ success: true });
});

export const me = catchAsync(async (req, res) => {
  res.json({ success: true, admin: req.admin.toSafeJSON() });
});
