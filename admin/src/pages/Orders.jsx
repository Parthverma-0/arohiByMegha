import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminOrders, useExportOrdersExcel } from '../api/misc.js';

function formatINR(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

const statuses = ['', 'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];

export default function Orders() {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useAdminOrders({ status: status || undefined, limit: 100 });
  const exportExcel = useExportOrdersExcel();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl">Orders</h1>
        <div className="flex items-center gap-3">
          <button
            className="btn-outline !w-auto !px-4 !py-2 text-sm"
            disabled={exportExcel.isPending}
            onClick={() => exportExcel.mutate()}
            title="Download the running orders spreadsheet"
          >
            {exportExcel.isPending ? 'Preparing…' : 'Download Excel'}
          </button>
          <select className="input-field !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((s) => <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table className="table-base">
          <thead><tr><th>Order #</th><th>Date</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data?.orders.map((o) => (
              <tr key={o._id}>
                <td>{o.orderNumber}</td>
                <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                <td>{o.shippingAddress.fullName}</td>
                <td>{formatINR(o.total)}</td>
                <td>{o.paymentMethod.toUpperCase()} · {o.paymentStatus}</td>
                <td className="capitalize">{o.currentStatus.replace('_', ' ')}</td>
                <td><Link to={`/orders/${o._id}`} className="text-sm underline">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
