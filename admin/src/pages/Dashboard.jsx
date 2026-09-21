import { useDashboardStats } from '../api/misc.js';

function formatINR(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Dashboard</h1>
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

function StatCard({ label, value, tone }) {
  return (
    <div className={`card ${tone === 'warn' && value > 0 ? 'border-red-300 bg-red-50' : ''}`}>
      <p className="text-sm text-charcoal/60">{label}</p>
      <p className="text-2xl font-display mt-1">{value}</p>
    </div>
  );
}
