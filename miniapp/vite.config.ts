import tailwindcss from '@tailwindcss/vite';
import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ['iOS >= 12', 'Android >= 6', 'defaults'],
      modernPolyfills: true,
    }),
  ],
  base: '/',
  build: {
    outDir: '../dist-miniapp',
    emptyOutDir: true,
    modulePreload: false,
    target: 'es2015',
    cssTarget: 'chrome61',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
