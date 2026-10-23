import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from './client.js';
import { useAuthStore } from '../store/authStore.js';

export function useGoogleConfig() {
  return useQuery({
    queryKey: ['google-config'],
    queryFn: async () => (await api.get('/auth/google/config')).data,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useGoogleLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (credential) => (await api.post('/auth/google', { credential })).data,
    onSuccess: (data) => setAuth(data.user, data.accessToken),
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: async () => (await api.post('/auth/logout')).data,
    onSuccess: () => clearAuth(),
  });
}

export async function hydrateSession(setAuth, clearAuth) {
  try {
    const { data } = await api.post('/auth/refresh');
    setAuth(data.user, data.accessToken);
  } catch {
    clearAuth();
  }
}
