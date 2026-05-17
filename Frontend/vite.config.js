import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite config para el Frontend React.
 * Proxy /api → backend en puerto 8080 para evitar CORS en desarrollo.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
