import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Deliberately a separate collection from User (customers) — keeps admin
// credentials and privilege isolated even at the data-modeling level.
const adminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['owner', 'manager', 'staff'], default: 'staff' },
    totpSecret: { type: String, default: null },
    totpEnabled: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

adminUserSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 12);
};

adminUserSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

adminUserSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockedUntil && this.lockedUntil.getTime() > Date.now());
};

adminUserSchema.methods.toSafeJSON = function toSafeJSON() {
  const { _id, name, email, role, totpEnabled, lastLoginAt } = this;
  return { id: _id, name, email, role, totpEnabled, lastLoginAt };
};

export default mongoose.model('AdminUser', adminUserSchema);
