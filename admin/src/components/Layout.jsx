import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { useAdminAuthStore } from '../store/adminAuthStore.js';

export default function Layout() {
  const { admin, isHydrating } = useAdminAuthStore();

  if (isHydrating) return null;
  if (!admin) return <Navigate to="/login" replace />;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}
