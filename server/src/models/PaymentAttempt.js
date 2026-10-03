import mongoose from 'mongoose';

// One online-payment attempt. Everything needed to create the order is
// snapshotted when the payment starts, so the order can be created from
// Razorpay's confirmation alone — even if the shopper's browser never comes
// back (closed tab, flaky network) and only the webhook arrives.
const paymentAttemptSchema = new mongoose.Schema(
  {
    razorpayOrderId: { type: String, required: true, unique: true },
    orderNumber: { type: String, required: true }, // our order number, shown to the customer
    cartOwner: { type: String, required: true },
    cartOwnerType: { type: String, enum: ['user', 'guest'], required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        image: String,
        price: Number,
        quantity: Number,
      },
    ],
    shippingAddress: { type: Object, required: true },
    coupon: { code: String, discount: Number, couponId: mongoose.Schema.Types.ObjectId },
    subtotal: Number,
    total: Number,
    // initiated → processing (claimed by one request) → completed | failed
    status: { type: String, enum: ['initiated', 'processing', 'completed', 'failed'], default: 'initiated' },
    failureReason: String,
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

export default mongoose.model('PaymentAttempt', paymentAttemptSchema);
