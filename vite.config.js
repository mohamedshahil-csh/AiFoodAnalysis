import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      basicSsl()
    ],
    server: {
      https: true,
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/face-api': {
          target: 'http://192.168.100.104:8114/',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/face-api/, '')
        },
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true
        }
      }
    }
  };
})

