import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useLogout } from '../../api/auth.js';

const tabs = [
  { to: '/account/orders', label: 'My Orders' },
  { to: '/account/wishlist', label: 'Wishlist' },
  { to: '/account/addresses', label: 'Addresses' },
];

export default function AccountLayout() {
  const { user, isHydrating } = useAuthStore();
  const logout = useLogout();

  if (isHydrating) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <h1 className="section-heading mb-8">Hi, {user.name.split(' ')[0]}</h1>
      <div className="grid md:grid-cols-[200px_1fr] gap-10">
        <nav className="flex md:flex-col gap-4 md:gap-2 text-sm overflow-x-auto">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => `px-3 py-2 rounded-md whitespace-nowrap ${isActive ? 'bg-blush font-medium' : 'text-charcoal/70'}`}
            >
              {tab.label}
            </NavLink>
          ))}
          <button onClick={() => logout.mutate()} className="px-3 py-2 text-left text-charcoal/70">Logout</button>
        </nav>
        <div><Outlet /></div>
      </div>
    </div>
  );
}
