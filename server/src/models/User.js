import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    stateCode: String,
    country: { type: String, default: 'India' },
    countryCode: { type: String, default: 'IN' },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Customers sign in with Google only; phone is collected at checkout. passwordHash is
    // kept so older email/password accounts still load (they sign in via Google by email now).
    phone: { type: String, default: '', trim: true },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    marketingConsent: { type: Boolean, default: false },
    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const { _id, name, email, phone, marketingConsent, addresses, wishlist, createdAt } = this;
  return { id: _id, name, email, phone, marketingConsent, addresses, wishlist, createdAt };
};

export default mongoose.model('User', userSchema);
