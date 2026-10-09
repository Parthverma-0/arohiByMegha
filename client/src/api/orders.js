import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';

// Resolves with { order, whatsappUrl }.
export function usePlaceWhatsappOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/orders/whatsapp', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

// Delivery charge for the address being typed in. Only runs once there's
// enough of an address to price (a full pincode, or a non-India country).
export function useDeliveryQuote({ address, couponCode, cartSubtotal }) {
  const { pincode, city, stateCode, countryCode } = address;
  const ready = countryCode !== 'IN' ? Boolean(countryCode) : /^\d{6}$/.test(pincode.trim());
  return useQuery({
    queryKey: ['delivery-quote', countryCode, stateCode, city, pincode.trim(), couponCode, cartSubtotal],
    queryFn: async () => (await api.post('/orders/delivery-quote', { shippingAddress: { pincode, city, stateCode, countryCode }, couponCode })).data,
    enabled: ready,
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

// Resolves with { order, whatsappUrl } (whatsappUrl only while awaiting payment).
export function useMyOrder(id) {
  return useQuery({
    queryKey: ['my-order', id],
    queryFn: async () => (await api.get(`/orders/mine/${id}`)).data,
    enabled: Boolean(id),
  });
}
