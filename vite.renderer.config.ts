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
  }
});
