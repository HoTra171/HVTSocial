import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  const API_URL = env.VITE_API_URL || 'http://localhost:5000'

  return {
    server: {
      host: true,
      port: 3000,
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: API_URL.replace('http://', 'ws://').replace('https://', 'wss://'),
          ws: true,
        },
      },
    },
    plugins: [react(), tailwindcss()],
  }
})
