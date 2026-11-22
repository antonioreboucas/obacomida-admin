import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api/v1': {
        target: 'https://web-oba-api.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    port: 3000,
    proxy: {
      '/api/v1': {
        target: 'https://web-oba-api.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})

