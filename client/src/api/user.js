import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';

export function useWishlist() {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await api.get('/users/wishlist')).data.wishlist,
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId) => (await api.post(`/users/wishlist/${productId}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}

export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post('/users/addresses', payload)).data.addresses,
    onSuccess: (addresses) => qc.setQueryData(['me-addresses'], addresses),
  });
}
