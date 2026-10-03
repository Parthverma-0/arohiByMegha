import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';

export function usePlaceCodOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/orders/cod', payload)).data.order,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useInitiateRazorpayPayment() {
  return useMutation({
    mutationFn: async (payload) => (await api.post('/orders/razorpay/initiate', payload)).data,
  });
}

// Resolves with { order } once paid, or { pending: true, message } if the
// payment hasn't been confirmed yet.
export function useVerifyRazorpayPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/orders/razorpay/verify', payload)).data,
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
