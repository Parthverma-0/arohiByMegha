import { useMutation } from '@tanstack/react-query';
import { api } from './client.js';
import { useAdminAuthStore } from '../store/adminAuthStore.js';

export function useAdminLogin() {
  return useMutation({
    mutationFn: async (payload) => (await api.post('/admin/auth/login', payload)).data,
  });
}

export function useSetupTwoFactor() {
  return useMutation({
    mutationFn: async (tempToken) => (await api.post('/admin/auth/2fa/setup', { tempToken })).data,
  });
}

export function useEnableTwoFactor() {
  const setAuth = useAdminAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload) => (await api.post('/admin/auth/2fa/enable', payload)).data,
    onSuccess: (data) => setAuth(data.admin, data.accessToken),
  });
}

export function useVerifyTwoFactor() {
  const setAuth = useAdminAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload) => (await api.post('/admin/auth/2fa/verify', payload)).data,
    onSuccess: (data) => setAuth(data.admin, data.accessToken),
  });
}

export function useAdminLogout() {
  const clearAuth = useAdminAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: async () => (await api.post('/admin/auth/logout')).data,
    onSuccess: () => clearAuth(),
  });
}

export async function hydrateAdminSession(setAuth, clearAuth) {
  try {
    const { data } = await api.post('/admin/auth/refresh');
    setAuth(data.admin, data.accessToken);
  } catch {
    clearAuth();
  }
}
