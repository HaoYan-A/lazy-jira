import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '.vite/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: './index.html',
      },
      output: {
        dir: '.vite/renderer',
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://jira.logisticsteam.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('User-Agent', 'Lazy-Jira');
          });
        }
      }
    }
  }
});
