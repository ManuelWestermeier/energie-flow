import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend-Port (Express). Im klassischen Client-Dev-Modus werden /api und /auth dorthin geleitet.
const API = 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API, changeOrigin: true },
      '/auth': { target: API, changeOrigin: true },
      '/socket.io': { target: API, ws: true, changeOrigin: true }
    }
  }
});
