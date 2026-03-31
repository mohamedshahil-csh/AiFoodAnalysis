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
      host: '0.0.0.0',
      port: 5173,
      https: true,
      proxy: {
        '/face-api': {
          target: env.VITE_FACE_VITAL_API_URL || 'https://services-api.a2zhealth.in/v1/face-vital',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/face-api/, '')
        }
      }
    }
  };
})
