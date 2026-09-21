import AuditLog from '../models/AuditLog.js';

// Fires an AuditLog entry for admin routes that mutate data, but only once
// the response has actually succeeded (2xx) — failed writes aren't logged as actions.
export function audit(action, targetType) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.admin) {
        AuditLog.create({
          admin: req.admin._id,
          adminEmail: req.admin.email,
          action,
          targetType,
          targetId: req.params.id || req.params.productId || undefined,
          meta: { method: req.method, path: req.originalUrl },
          ip: req.ip,
        }).catch((err) => console.error('[audit] failed to write log:', err.message));
      }
    });
    next();
  };
}
