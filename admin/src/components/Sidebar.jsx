import { NavLink } from 'react-router-dom';
import { useAdminAuthStore } from '../store/adminAuthStore.js';
import { useAdminLogout } from '../api/auth.js';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/products', label: 'Products' },
  { to: '/categories', label: 'Categories' },
  { to: '/orders', label: 'Orders' },
  { to: '/customers', label: 'Customers' },
  { to: '/coupons', label: 'Coupons' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/homepage', label: 'Homepage Content' },
  { to: '/audit-log', label: 'Audit Log' },
];

export default function Sidebar() {
  const admin = useAdminAuthStore((s) => s.admin);
  const logout = useAdminLogout();

  return (
    <aside className="w-64 shrink-0 bg-charcoal text-ivory flex flex-col min-h-screen">
      <div className="p-6 border-b border-ivory/10">
        <p className="font-display text-xl">AROHI</p>
        <p className="text-xs text-ivory/50 tracking-wide">ADMIN DASHBOARD</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-md text-sm transition-colors ${isActive ? 'bg-gold text-charcoal font-medium' : 'text-ivory/80 hover:bg-ivory/10'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-ivory/10">
        <p className="text-sm">{admin?.name}</p>
        <p className="text-xs text-ivory/50">{admin?.role}</p>
        <button onClick={() => logout.mutate()} className="mt-3 text-sm text-ivory/70 hover:text-ivory underline">
          Logout
        </button>
      </div>
    </aside>
  );
}
