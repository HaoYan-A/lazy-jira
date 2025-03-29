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
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          // 在最后一刻设置头部
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 先移除可能存在的旧值
            proxyReq.removeHeader('User-Agent');
            // 然后设置新值
            proxyReq.setHeader('User-Agent', 'xx');
            // 记录所有请求头以便调试
          });
        }
        
      }
    }
  }
});
