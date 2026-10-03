import { Link } from 'react-router-dom';
import { useAdminOrders } from '../api/misc.js';
import InvoiceActions, { InvoiceEmailStatus } from '../components/InvoiceActions.jsx';

function formatINR(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

// Every paid order has an invoice. Online payments are invoiced and emailed
// the moment they're paid; Cash on Delivery orders when marked Delivered.
export default function Invoices() {
  const { data, isLoading } = useAdminOrders({ paymentStatus: 'paid', limit: 100 });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Invoices</h1>
        <p className="text-sm text-charcoal/60 mt-1">
          Invoices for paid orders. They're emailed to the customer automatically; download or resend any of them here.
        </p>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : data?.orders.length === 0 ? (
        <p className="text-charcoal/60">No paid orders yet.</p>
      ) : (
        <table className="table-base">
          <thead>
            <tr><th>Invoice No.</th><th>Order #</th><th>Order Date</th><th>Customer</th><th>Total</th><th>Email</th><th></th></tr>
          </thead>
          <tbody>
            {data?.orders.map((o) => (
              <tr key={o._id}>
                <td className="font-medium whitespace-nowrap">{o.invoice?.number || <span className="text-charcoal/50">—</span>}</td>
                <td><Link to={`/orders/${o._id}`} className="underline">{o.orderNumber}</Link></td>
                <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  {o.shippingAddress.fullName}
                  <div className="text-xs text-charcoal/60">{o.shippingAddress.email || 'no email'}</div>
                </td>
                <td>{formatINR(o.total)}</td>
                <td className="max-w-[220px]"><InvoiceEmailStatus order={o} /></td>
                <td><InvoiceActions order={o} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
