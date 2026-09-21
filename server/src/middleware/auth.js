import { verifyCustomerAccessToken, verifyAdminAccessToken } from '../utils/tokens.js';
import { ApiError } from '../utils/ApiError.js';
import User from '../models/User.js';
import AdminUser from '../models/AdminUser.js';

function extractBearer(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

// Requires a valid customer access token. Populates req.user (Mongoose doc, minus passwordHash).
export function requireCustomerAuth(req, res, next) {
  const token = extractBearer(req);
  if (!token) return next(new ApiError(401, 'Login required'));
  try {
    const payload = verifyCustomerAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    next(new ApiError(401, 'Session expired, please log in again'));
  }
}

// Same as above but does not fail the request when no/invalid token is present —
// used on routes that behave differently for guests vs logged-in customers (e.g. cart merge).
export async function attachCustomerIfPresent(req, res, next) {
  const token = extractBearer(req);
  if (!token) return next();
  try {
    const payload = verifyCustomerAccessToken(token);
    req.userId = payload.sub;
  } catch {
    // ignore invalid/expired token for optional auth
  }
  next();
}

export function requireAdminAuth(...allowedRoles) {
  return async (req, res, next) => {
    const token = extractBearer(req);
    if (!token) return next(new ApiError(401, 'Admin login required'));
    try {
      const payload = verifyAdminAccessToken(token);
      const admin = await AdminUser.findById(payload.sub);
      if (!admin) return next(new ApiError(401, 'Admin account not found'));
      if (allowedRoles.length && !allowedRoles.includes(admin.role)) {
        return next(new ApiError(403, 'Insufficient permissions'));
      }
      req.admin = admin;
      next();
    } catch {
      next(new ApiError(401, 'Admin session expired, please log in again'));
    }
  };
}

export async function loadUser(req, res, next) {
  if (!req.userId) return next(new ApiError(401, 'Login required'));
  const user = await User.findById(req.userId);
  if (!user) return next(new ApiError(401, 'Account not found'));
  req.currentUser = user;
  next();
}
