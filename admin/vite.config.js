import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base is '/' in dev (the admin dev server runs standalone at its own port)
// and '/admin/' in production (this build is served by the API under /admin
// so it shares a single host with the storefront — see server/src/app.js).
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/admin/' : '/',
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
}));
