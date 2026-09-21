import { useLocation, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '../store/authStore.js';
import { useMyOrder } from '../api/orders.js';
import { formatINR } from '../components/ui/PriceTag.jsx';

export default function OrderConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const stateOrder = location.state?.order;
  const { data: fetchedOrder } = useMyOrder(!stateOrder && user ? id : undefined);
  const order = stateOrder || fetchedOrder;

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-charcoal/60">We couldn't find that order. If you just placed it, check "My Orders" from your account.</p>
        <Link to="/" className="btn-primary mt-6">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-14 text-center">
      <Helmet><title>Order Confirmed | Arohi by Megha</title></Helmet>
      <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="section-heading mt-6">Thank you for your order!</h1>
      <p className="text-charcoal/60 mt-2">Order #{order.orderNumber}</p>

      <div className="text-left bg-blush rounded-lg p-6 mt-8">
        <ul className="divide-y divide-charcoal/10">
          {order.items.map((item) => (
            <li key={item.product} className="py-3 flex justify-between text-sm">
              <span>{item.name} × {item.quantity}</span>
              <span>{formatINR(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between font-medium border-t border-charcoal/15 pt-3 mt-3">
          <span>Total</span>
          <span>{formatINR(order.total)}</span>
        </div>
        <p className="text-sm text-charcoal/60 mt-3">
          Paying via {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'} · Shipping to {order.shippingAddress.city}, {order.shippingAddress.state}
        </p>
      </div>

      <Link to="/shop" className="btn-primary mt-8">Continue Shopping</Link>
    </div>
  );
}
