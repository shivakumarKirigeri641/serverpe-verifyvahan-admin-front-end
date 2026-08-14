import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev proxies /admin/api to the local back-end by default so an admin never
// unknowingly reads/writes PRODUCTION data. In production the panel is built
// with VITE_API_BASE pointing at the live API origin.
const API = process.env.VITE_PROXY_TARGET || 'http://localhost:5007';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    proxy: { '/admin/api': { target: API, changeOrigin: true } },
  },
  build: { outDir: 'dist', sourcemap: false },
});
