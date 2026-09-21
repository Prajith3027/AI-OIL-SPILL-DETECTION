import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Proxy /api calls to the FastAPI backend during development
      '/api': {
        target: 'https://oil-spill-detection-9601.onrender.com',
        changeOrigin: true,
      },
      '/health': {
        target: 'https://oil-spill-detection-9601.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
