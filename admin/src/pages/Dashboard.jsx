import { Link } from 'react-router-dom';
import { useDashboardStats, useAdminOrders } from '../api/misc.js';
import PaymentReview from '../components/PaymentReview.jsx';

function formatINR(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Dashboard</h1>
      <AwaitingPayments count={stats.awaitingPayment} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders" value={stats.totalOrders} />
        <StatCard label="Orders (30 days)" value={stats.recentOrders} />
        <StatCard label="Total Revenue" value={formatINR(stats.revenue)} />
        <StatCard label="Avg Order Value" value={formatINR(stats.avgOrderValue)} />
        <StatCard label="Total Customers" value={stats.totalCustomers} />
        <StatCard label="Active Products" value={stats.totalProducts} />
        <StatCard label="Low Stock (≤5)" value={stats.lowStock} tone={stats.lowStock > 0 ? 'warn' : undefined} />
      </div>

      <div className="card">
        <h2 className="font-medium mb-4">Top Selling Products</h2>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-charcoal/60">No sales yet.</p>
        ) : (
          <table className="table-base">
            <thead><tr><th>Product</th><th>Units Sold</th></tr></thead>
            <tbody>
              {stats.topProducts.map((p) => (
                <tr key={p._id}><td>{p.name}</td><td>{p.unitsSold}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Orders placed via WhatsApp whose QR code payment hasn't been checked yet.
function AwaitingPayments({ count }) {
  const { data } = useAdminOrders({ awaitingPayment: 1, limit: 50 });
  const orders = data?.orders || [];

  return (
    <div className={`card mb-8 ${count > 0 ? 'border-amber-300 bg-amber-50' : ''}`}>
      <h2 className="font-medium mb-1">Payments to approve {count > 0 && <span className="text-amber-700">({count})</span>}</h2>
      <p className="text-sm text-charcoal/60 mb-4">
        Approve once the UPI payment shows in your account — the order is confirmed and the invoice emailed. Reject to cancel it and put the stock back.
      </p>
      {orders.length === 0 ? (
        <p className="text-sm text-charcoal/60">Nothing waiting.</p>
      ) : (
        <ul className="divide-y divide-charcoal/10">
          {orders.map((o) => (
            <li key={o._id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <Link to={`/orders/${o._id}`} className="font-medium underline">#{o.orderNumber}</Link>
                <span className="text-charcoal/70"> · {o.shippingAddress.fullName} · {o.shippingAddress.phone}</span>
                <p className="text-charcoal/60">
                  {formatINR(o.total)}{o.delivery?.feePending ? ' + delivery' : ''} · {o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')} · {new Date(o.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <PaymentReview order={o} compact />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className={`card ${tone === 'warn' && value > 0 ? 'border-red-300 bg-red-50' : ''}`}>
      <p className="text-sm text-charcoal/60">{label}</p>
      <p className="text-2xl font-display mt-1">{value}</p>
    </div>
  );
}
