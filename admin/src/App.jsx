import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import ProductForm from './pages/ProductForm.jsx';
import Categories from './pages/Categories.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Customers from './pages/Customers.jsx';
import Coupons from './pages/Coupons.jsx';
import Reviews from './pages/Reviews.jsx';
import HomepageContent from './pages/HomepageContent.jsx';
import AuditLog from './pages/AuditLog.jsx';
import { useAdminAuthStore } from './store/adminAuthStore.js';
import { hydrateAdminSession } from './api/auth.js';

export default function App() {
  const setAuth = useAdminAuthStore((s) => s.setAuth);
  const clearAuth = useAdminAuthStore((s) => s.clearAuth);

  useEffect(() => {
    hydrateAdminSession(setAuth, clearAuth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { fontSize: '14px' } }} />
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="customers" element={<Customers />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="homepage" element={<HomepageContent />} />
          <Route path="audit-log" element={<AuditLog />} />
        </Route>
      </Routes>
    </>
  );
}
