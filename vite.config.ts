import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/anime': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/video': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})