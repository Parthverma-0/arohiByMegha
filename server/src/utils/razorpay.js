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

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Signature Razorpay's checkout hands the browser after a successful payment.
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqual(expected, signature);
}

// Signature on webhook calls (X-Razorpay-Signature), computed over the raw
// request body with the webhook secret set in the Razorpay dashboard.
export const isWebhookConfigured = Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);
export function verifyWebhookSignature(rawBody, signature) {
  if (!isWebhookConfigured || !rawBody || !signature) return false;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}
