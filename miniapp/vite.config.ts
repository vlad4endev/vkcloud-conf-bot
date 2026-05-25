import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: '../dist-miniapp',
    target: ['es2020', 'chrome87', 'safari14'],
    cssTarget: 'chrome87',
  },
})
