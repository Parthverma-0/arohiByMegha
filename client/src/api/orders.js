import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';

export function usePlaceCodOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/orders/cod', payload)).data.order,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useCreateRazorpayOrder() {
  return useMutation({
    mutationFn: async (payload) => (await api.post('/orders/razorpay/create', payload)).data,
  });
}

export function useVerifyRazorpayOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/orders/razorpay/verify', payload)).data.order,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function usePreviewCoupon() {
  return useMutation({
    mutationFn: async (code) => (await api.post('/coupons/preview', { code })).data,
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => (await api.get('/orders/mine')).data.orders,
  });
}

export function useMyOrder(id) {
  return useQuery({
    queryKey: ['my-order', id],
    queryFn: async () => (await api.get(`/orders/mine/${id}`)).data.order,
    enabled: Boolean(id),
  });
}
