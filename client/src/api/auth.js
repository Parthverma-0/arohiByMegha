import { useMutation } from '@tanstack/react-query';
import { api } from './client.js';
import { useAuthStore } from '../store/authStore.js';

export function useSignup() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload) => (await api.post('/auth/signup', payload)).data,
    onSuccess: (data) => setAuth(data.user, data.accessToken),
  });
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload) => (await api.post('/auth/login', payload)).data,
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
