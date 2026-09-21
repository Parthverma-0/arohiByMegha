import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

// One cart per identity. `owner` is either a logged-in user's id or a
// random guest id stored in a long-lived (non-httpOnly) cookie, so carts
// persist across a guest checkout without requiring an account.
const cartSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true, unique: true, index: true },
    ownerType: { type: String, enum: ['user', 'guest'], required: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Cart', cartSchema);
