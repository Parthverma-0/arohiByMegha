import jwt from 'jsonwebtoken';

const ISSUER = 'arohi-api';

const ACCESS_TTL = '15m';
const CUSTOMER_REFRESH_TTL = '30d';
const ADMIN_REFRESH_TTL = '12h';

function sign(payload, secret, audience, expiresIn) {
  return jwt.sign(payload, secret, { issuer: ISSUER, audience, expiresIn });
}

function verify(token, secret, audience) {
  return jwt.verify(token, secret, { issuer: ISSUER, audience });
}

// Customer tokens — audience "customer", signed with CUSTOMER_* secrets.
// Kept fully separate from admin tokens so a leaked customer token can never
// be replayed against an admin-only route (different secret AND audience).
export function signCustomerAccessToken(user) {
  return sign({ sub: String(user._id) }, process.env.CUSTOMER_ACCESS_SECRET, 'customer', ACCESS_TTL);
}
export function signCustomerRefreshToken(user) {
  return sign(
    { sub: String(user._id), tv: user.tokenVersion || 0 },
    process.env.CUSTOMER_REFRESH_SECRET,
    'customer',
    CUSTOMER_REFRESH_TTL
  );
}
export function verifyCustomerAccessToken(token) {
  return verify(token, process.env.CUSTOMER_ACCESS_SECRET, 'customer');
}
export function verifyCustomerRefreshToken(token) {
  return verify(token, process.env.CUSTOMER_REFRESH_SECRET, 'customer');
}

// Admin tokens — audience "admin", signed with ADMIN_* secrets, shorter-lived refresh.
export function signAdminAccessToken(admin) {
  return sign({ sub: String(admin._id), role: admin.role }, process.env.ADMIN_ACCESS_SECRET, 'admin', ACCESS_TTL);
}
export function signAdminRefreshToken(admin) {
  return sign(
    { sub: String(admin._id), tv: admin.tokenVersion || 0 },
    process.env.ADMIN_REFRESH_SECRET,
    'admin',
    ADMIN_REFRESH_TTL
  );
}
export function verifyAdminAccessToken(token) {
  return verify(token, process.env.ADMIN_ACCESS_SECRET, 'admin');
}
export function verifyAdminRefreshToken(token) {
  return verify(token, process.env.ADMIN_REFRESH_SECRET, 'admin');
}

// Short-lived token binding a password-verified admin login to the 2FA step
// that must follow it, before any real access/refresh token is issued.
export function signAdmin2FATempToken(admin) {
  return sign({ sub: String(admin._id) }, process.env.ADMIN_ACCESS_SECRET, 'admin_2fa', '5m');
}
export function verifyAdmin2FATempToken(token) {
  return verify(token, process.env.ADMIN_ACCESS_SECRET, 'admin_2fa');
}

export const cookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: maxAgeMs,
  path: '/',
});
