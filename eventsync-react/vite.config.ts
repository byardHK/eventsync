import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../eventsync-backend/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, '../eventsync-backend/server.crt')), // Use backend's cert
    },
    proxy: {
      '/api': {
        target: 'https://10.18.101.62:3000', // Ensure backend is running HTTPS
        changeOrigin: true,
        secure: false,  // Ignore SSL issues in dev mode
      },
    },
  },
});
