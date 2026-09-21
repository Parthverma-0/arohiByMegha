import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => (await api.get('/admin/dashboard/stats')).data.stats,
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => (await api.get('/admin/audit-logs')).data.logs,
  });
}

export function useAdminOrders(params) {
  return useQuery({
    queryKey: ['admin-orders', params],
    queryFn: async () => (await api.get('/admin/orders', { params })).data,
  });
}

export function useAdminOrder(id) {
  return useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => (await api.get(`/admin/orders/${id}`)).data.order,
    enabled: Boolean(id),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, note }) => (await api.put(`/admin/orders/${id}/status`, { status, note })).data.order,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-order'] });
    },
  });
}

export function useExportOrdersExcel() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.get('/admin/orders/export/excel', { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'arohi-orders.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    },
  });
}

export function useAdminCustomers() {
  return useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => (await api.get('/admin/customers')).data,
  });
}

export function useAdminCoupons() {
  return useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => (await api.get('/admin/coupons')).data.coupons,
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/admin/coupons', payload)).data.coupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => (await api.put(`/admin/coupons/${id}`, payload)).data.coupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/coupons/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}

export function useAdminReviews(status) {
  return useQuery({
    queryKey: ['admin-reviews', status],
    queryFn: async () => (await api.get('/admin/reviews', { params: { status } })).data.reviews,
  });
}

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => (await api.put(`/admin/reviews/${id}/moderate`, { status })).data.review,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });
}

export function useHomepageContent() {
  return useQuery({
    queryKey: ['admin-homepage-content'],
    queryFn: async () => (await api.get('/site-content/homepage')).data.content,
  });
}

export function useUpdateHomepageContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.put('/admin/homepage-content', payload)).data.content,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-homepage-content'] }),
  });
}
