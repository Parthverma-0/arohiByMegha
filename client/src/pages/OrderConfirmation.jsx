import { useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '../store/authStore.js';
import { useMyOrder } from '../api/orders.js';
import { formatINR } from '../components/ui/PriceTag.jsx';

// Each order auto-opens WhatsApp once; coming back (browser back button)
// shows the page with a button instead of bouncing straight out again.
function claimAutoRedirect(orderId) {
  try {
    const key = `wa-opened-${orderId}`;
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}

export default function OrderConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const stateOrder = location.state?.order;
  const { data: fetched } = useMyOrder(!stateOrder && user ? id : undefined);
  const order = stateOrder || fetched?.order;
  const whatsappUrl = location.state?.whatsappUrl || fetched?.whatsappUrl;
  const awaitingPayment = order?.paymentMethod === 'manual_upi' && order.paymentStatus === 'pending' && order.currentStatus !== 'cancelled';

  useEffect(() => {
    if (!awaitingPayment || !whatsappUrl || !claimAutoRedirect(id)) return undefined;
    const timer = setTimeout(() => window.location.assign(whatsappUrl), 1500);
    return () => clearTimeout(timer);
  }, [awaitingPayment, whatsappUrl, id]);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-charcoal/60">We couldn't find that order. If you just placed it, check "My Orders" from your account.</p>
        <Link to="/" className="btn-primary mt-6">Back to Home</Link>
      </div>
    );
  }

  const paymentLabel = { cod: 'Cash on Delivery', razorpay: 'Online Payment', manual_upi: 'UPI QR code (via WhatsApp)' }[order.paymentMethod];

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-14 text-center">
      <Helmet><title>Order Placed | Arohi by Megha</title></Helmet>
      <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="section-heading mt-6">{awaitingPayment ? 'Almost done!' : 'Thank you for your order!'}</h1>
      <p className="text-charcoal/60 mt-2">Order #{order.orderNumber}</p>

      {awaitingPayment && (
        <div className="mt-6">
          <p className="text-charcoal/80">
            Send us your order on WhatsApp and we'll reply with the QR code for payment. Your order is confirmed once the payment reaches us.
          </p>
          {whatsappUrl && (
            <a href={whatsappUrl} className="btn-primary mt-5 !bg-[#1f7a4d] hover:!bg-[#17603c]">
              Continue on WhatsApp
            </a>
          )}
        </div>
      )}

      <div className="text-left bg-blush rounded-lg p-6 mt-8">
        <ul className="divide-y divide-charcoal/10">
          {order.items.map((item) => (
            <li key={item.product} className="py-3 flex justify-between text-sm">
              <span>{item.name} × {item.quantity}</span>
              <span>{formatINR(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between text-sm border-t border-charcoal/15 pt-3 mt-3">
          <span>Delivery</span>
          <span>{order.delivery?.feePending ? 'To be confirmed' : order.shippingFee > 0 ? formatINR(order.shippingFee) : 'Free'}</span>
        </div>
        <div className="flex justify-between font-medium pt-2">
          <span>Total</span>
          <span>{formatINR(order.total)}{order.delivery?.feePending ? ' + delivery' : ''}</span>
        </div>
        <p className="text-sm text-charcoal/60 mt-3">
          Paying via {paymentLabel} · Shipping to {order.shippingAddress.city}, {order.shippingAddress.state}
        </p>
        {order.shippingAddress.email && (
          <p className="text-sm text-charcoal/60 mt-1">
            {order.invoice?.emailedAt
              ? `Your invoice has been emailed to ${order.invoice.emailedTo}.`
              : order.paymentMethod === 'cod'
                ? `Your invoice will be emailed to ${order.shippingAddress.email} once payment is received on delivery.`
                : `Your invoice will be emailed to ${order.shippingAddress.email} once payment is confirmed.`}
          </p>
        )}
      </div>

      <Link to="/shop" className="btn-outline mt-8">Continue Shopping</Link>
    </div>
  );
}
