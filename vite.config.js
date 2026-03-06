import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: true,
    proxy: {
      '/face-api': {
        target: 'http://192.168.100.104:8114',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/face-api/, '')
      }
    }
  }
})
