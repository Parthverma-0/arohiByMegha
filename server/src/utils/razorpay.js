import Razorpay from 'razorpay';
import crypto from 'crypto';

const configured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export const isRazorpayConfigured = configured;

export const razorpay = configured
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

if (!configured) {
  console.warn('[razorpay] Keys not set — online payment will be unavailable, COD will still work, until you add keys to server/.env');
}

export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}
