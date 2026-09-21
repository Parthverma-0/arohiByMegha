import { create } from 'zustand';

// Same in-memory-only pattern as the storefront's authStore, but fully
// separate: this token is signed with the admin secret/audience and the
// refresh cookie has its own name, so it is never interchangeable with a
// customer session even if both apps run in the same browser.
export const useAdminAuthStore = create((set) => ({
  admin: null,
  accessToken: null,
  isHydrating: true,
  setAuth: (admin, accessToken) => set({ admin, accessToken, isHydrating: false }),
  clearAuth: () => set({ admin: null, accessToken: null, isHydrating: false }),
}));
