import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173, 
    open: true, 
    proxy: {
      '/api': {
        target: 'http://10.18.101.62:3000/',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})