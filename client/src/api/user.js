import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';
import { useAuthStore } from '../store/authStore.js';

export function useWishlist({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await api.get('/users/wishlist')).data.wishlist,
    enabled,
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId) => (await api.post(`/users/wishlist/${productId}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}

const ADDRESSES_KEY = ['addresses'];

export function useAddresses() {
  const userId = useAuthStore((s) => s.user?.id || null);
  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: async () => (await api.get('/users/addresses')).data.addresses,
    enabled: Boolean(userId),
  });
}

function useAddressMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => qc.setQueryData(ADDRESSES_KEY, data.addresses),
  });
}

// Resolves with { addresses, address } — `address` is the one just saved.
export function useAddAddress() {
  return useAddressMutation(async (payload) => (await api.post('/users/addresses', payload)).data);
}

export function useUpdateAddress() {
  return useAddressMutation(async ({ id, payload }) => (await api.patch(`/users/addresses/${id}`, payload)).data);
}

export function useDeleteAddress() {
  return useAddressMutation(async (id) => (await api.delete(`/users/addresses/${id}`)).data);
}
