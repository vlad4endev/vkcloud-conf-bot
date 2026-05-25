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
    target: ['es2018', 'chrome80', 'safari13'],
    cssTarget: 'chrome80',
  },
})
