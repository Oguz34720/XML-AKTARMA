import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const PORT = process.env.PORT || 3000;

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: parseInt(process.env.FRONTEND_PORT || '5173'),
    proxy: {
      '^/api/.*': {
        target: `http://localhost:${PORT}`,
        changeOrigin: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
