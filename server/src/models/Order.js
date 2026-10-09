import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    image: String,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    stateCode: String,
    country: { type: String, default: 'India' },
    countryCode: { type: String, default: 'IN' },
    pincode: { type: String, required: true },
  },
  { _id: false }
);

const statusEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
      required: true,
    },
    note: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = guest checkout
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    coupon: {
      code: String,
      discount: { type: Number, default: 0 },
    },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    // 'cod' and 'razorpay' are kept for older orders; new orders are 'manual_upi'
    // (customer pays by QR code over WhatsApp, admin approves the payment).
    paymentMethod: { type: String, enum: ['cod', 'razorpay', 'manual_upi'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    razorpay: {
      orderId: String,
      paymentId: String,
      method: String, // upi, card, netbanking, wallet…
    },
    manualPayment: {
      reference: String, // UPI transaction / UTR number, entered by the admin
      reviewedAt: Date,
      reviewedBy: String, // admin email
      note: String,
    },
    delivery: {
      distanceKm: Number,
      note: String,
      feePending: { type: Boolean, default: false }, // fee to be agreed on WhatsApp (e.g. international)
    },
    stockRestored: { type: Boolean, default: false }, // stock put back after cancellation
    currentStatus: {
      type: String,
      enum: ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
      default: 'placed',
    },
    statusHistory: { type: [statusEventSchema], default: () => [{ status: 'placed' }] },
    invoice: {
      number: { type: String, unique: true, sparse: true }, // e.g. ABM-K7Q2M-0007
      issuedAt: Date,
      emailedAt: Date,
      emailedTo: String,
      emailError: String, // last send failure, cleared on success
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
