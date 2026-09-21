import axios from 'axios';
import { useAdminAuthStore } from '../store/adminAuthStore.js';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAdminAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const isAuthRoute = config?.url?.includes('/admin/auth/');
    if (response?.status === 401 && !config._retried && !isAuthRoute) {
      config._retried = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/admin/auth/refresh').finally(() => {
            refreshPromise = null;
          });
        }
        const { data } = await refreshPromise;
        useAdminAuthStore.getState().setAuth(data.admin, data.accessToken);
        config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(config);
      } catch {
        useAdminAuthStore.getState().clearAuth();
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || fallback;
}
