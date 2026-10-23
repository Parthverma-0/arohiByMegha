import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';
import { useAuthStore } from '../store/authStore.js';

// Only logged-in shoppers have a cart, so the cache is keyed by user and the
// query stays off for visitors (and while the session is still being restored).
function useCartKey() {
  const userId = useAuthStore((s) => s.user?.id || null);
  return { key: ['cart', userId], ready: Boolean(userId) };
}

export function useCart() {
  const { key, ready } = useCartKey();
  return useQuery({
    queryKey: key,
    queryFn: async () => (await api.get('/cart')).data,
    enabled: ready,
  });
}

function useCartMutation(mutationFn) {
  const qc = useQueryClient();
  const { key } = useCartKey();
  return useMutation({
    mutationFn,
    onSuccess: (data) => qc.setQueryData(key, data),
    // On failure, resync with the server so the UI never shows a stale cart.
    onError: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useAddToCart() {
  return useCartMutation(async ({ productId, quantity = 1 }) => (await api.post('/cart/items', { productId, quantity })).data);
}

export function useUpdateCartItem() {
  return useCartMutation(async ({ productId, quantity }) => (await api.patch(`/cart/items/${productId}`, { quantity })).data);
}

export function useRemoveCartItem() {
  return useCartMutation(async (productId) => (await api.delete(`/cart/items/${productId}`)).data);
}
