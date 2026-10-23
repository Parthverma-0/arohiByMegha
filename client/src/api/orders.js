import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';

// Order total (with delivery) for the saved address selected at checkout.
export function useDeliveryQuote({ addressId, couponCode, cartSubtotal }) {
  return useQuery({
    queryKey: ['delivery-quote', addressId, couponCode, cartSubtotal],
    queryFn: async () => (await api.post('/orders/delivery-quote', { addressId, couponCode })).data,
    enabled: Boolean(addressId),
    staleTime: 5 * 60 * 1000,
    retry: false,
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
