import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/panel/',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../src/shared'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
    port: 5174,
    proxy: {
      '/admin': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
  build: {
    outDir: '../dist-adminpanel',
    emptyOutDir: true,
  },
});
