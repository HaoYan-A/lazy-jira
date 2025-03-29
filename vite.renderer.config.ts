import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '.vite/renderer',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://jira.logisticsteam.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
