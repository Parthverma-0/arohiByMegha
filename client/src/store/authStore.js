import { create } from 'zustand';

// Access token is kept in memory only (never localStorage) — the refresh
// token that can mint new ones lives in an httpOnly cookie the JS layer
// can't read at all, which is the point: an XSS bug here can't steal a
// long-lived credential, at worst it can use the current 15-minute token.
export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isHydrating: true,
  setAuth: (user, accessToken) => set({ user, accessToken, isHydrating: false }),
  clearAuth: () => set({ user: null, accessToken: null, isHydrating: false }),
}));
