import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await api.get('/cart')).data,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity = 1 }) => (await api.post('/cart/items', { productId, quantity })).data,
    onSuccess: (data) => qc.setQueryData(['cart'], data),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity }) => (await api.patch(`/cart/items/${productId}`, { quantity })).data,
    onSuccess: (data) => qc.setQueryData(['cart'], data),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId) => (await api.delete(`/cart/items/${productId}`)).data,
    onSuccess: (data) => qc.setQueryData(['cart'], data),
  });
}
