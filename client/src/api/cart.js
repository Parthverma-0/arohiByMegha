import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';
import { useAuthStore } from '../store/authStore.js';

// The server keeps a separate cart per identity (guest cookie vs logged-in
// user), so the cache key has to follow the identity too. Waiting for session
// hydration stops the first page load from fetching (and caching) the guest
// cart for a shopper who is actually logged in.
function useCartKey() {
  const userId = useAuthStore((s) => s.user?._id || s.user?.id || null);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  return { key: ['cart', userId || 'guest'], ready: !isHydrating };
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
