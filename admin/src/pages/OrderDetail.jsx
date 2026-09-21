import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminOrder, useUpdateOrderStatus } from '../api/misc.js';
import { apiErrorMessage } from '../api/client.js';

function formatINR(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

const statusFlow = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];

export default function OrderDetail() {
  const { id } = useParams();
  const { data: order, isLoading } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const [note, setNote] = useState('');

  if (isLoading || !order) return <p>Loading...</p>;

  async function changeStatus(status) {
    try {
      await updateStatus.mutateAsync({ id, status, note });
      setNote('');
      toast.success('Status updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="max-w-3xl">
      <Link to="/orders" className="text-sm underline">← Back to Orders</Link>
      <h1 className="font-display text-3xl mt-2 mb-6">Order #{order.orderNumber}</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="font-medium mb-2">Shipping Address</h2>
          <p className="text-sm">{order.shippingAddress.fullName} · {order.shippingAddress.phone}</p>
          <p className="text-sm text-charcoal/70">
            {order.shippingAddress.line1}, {order.shippingAddress.line2 ? `${order.shippingAddress.line2}, ` : ''}
            {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
          </p>
        </div>
        <div className="card">
          <h2 className="font-medium mb-2">Payment</h2>
          <p className="text-sm">{order.paymentMethod.toUpperCase()} · {order.paymentStatus}</p>
          <p className="text-sm text-charcoal/70">Total: {formatINR(order.total)} (Subtotal {formatINR(order.subtotal)}, Discount {formatINR(order.discount)})</p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="font-medium mb-3">Items</h2>
        <table className="table-base">
          <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.product}><td>{item.name}</td><td>{item.quantity}</td><td>{formatINR(item.price)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mb-6">
        <h2 className="font-medium mb-3">Update Status</h2>
        <p className="text-sm text-charcoal/60 mb-3">Current: <span className="font-medium capitalize">{order.currentStatus.replace('_', ' ')}</span></p>
        <input placeholder="Optional note" className="input-field mb-3" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {statusFlow.map((s) => (
            <button
              key={s}
              className={`btn-outline !py-1.5 !px-3 text-xs capitalize ${order.currentStatus === s ? '!bg-gold !text-charcoal !border-gold' : ''}`}
              onClick={() => changeStatus(s)}
              disabled={updateStatus.isPending}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-medium mb-3">Status History</h2>
        <ul className="space-y-2 text-sm">
          {order.statusHistory.map((h, i) => (
            <li key={i} className="flex justify-between text-charcoal/70">
              <span className="capitalize">{h.status.replace('_', ' ')} {h.note ? `— ${h.note}` : ''}</span>
              <span>{new Date(h.at).toLocaleString('en-IN')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
