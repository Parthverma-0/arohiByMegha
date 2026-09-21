import { Link } from 'react-router-dom';
import { useMyOrders } from '../../api/orders.js';
import { formatINR } from '../../components/ui/PriceTag.jsx';

const statusLabels = {
  placed: 'Placed', confirmed: 'Confirmed', packed: 'Packed', shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
};

export default function Orders() {
  const { data: orders = [], isLoading } = useMyOrders();

  if (isLoading) return <p>Loading...</p>;
  if (orders.length === 0) return <p className="text-charcoal/60">You haven't placed any orders yet.</p>;

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li key={order._id} className="border border-charcoal/10 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">#{order.orderNumber}</p>
              <p className="text-xs text-charcoal/50">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
            <span className="text-sm bg-blush px-3 py-1 rounded-full">{statusLabels[order.currentStatus]}</span>
          </div>
          <p className="text-sm text-charcoal/70 mt-2">{order.items.length} item(s) · {formatINR(order.total)}</p>
          <Link to={`/order-confirmation/${order._id}`} className="text-sm underline underline-offset-4 mt-2 inline-block">View details</Link>
        </li>
      ))}
    </ul>
  );
}
