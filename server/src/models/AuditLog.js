import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    adminEmail: String,
    action: { type: String, required: true },
    targetType: String,
    targetId: String,
    meta: mongoose.Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
