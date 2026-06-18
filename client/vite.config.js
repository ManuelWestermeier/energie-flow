import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Backend-Port (Express). Im Dev werden /api, /auth und /socket.io dorthin geleitet.
const API = 'http://localhost:4000';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-mark.jpeg', 'logo-wide.jpeg'],
      manifest: {
        name: 'EnergieFlow – Solarstrom für Mieter:innen',
        short_name: 'EnergieFlow',
        description: 'Gemeinsam eine Solaranlage aufs Mietshaus bringen – per gemeinschaftlicher Gebäudeversorgung (GGV).',
        theme_color: '#2f6e2a',
        background_color: '#faf8f1',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'logo-mark.jpeg', sizes: '192x192', type: 'image/jpeg', purpose: 'any' },
          { src: 'logo-mark.jpeg', sizes: '512x512', type: 'image/jpeg', purpose: 'any maskable' }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API, changeOrigin: true },
      '/auth': { target: API, changeOrigin: true },
      '/socket.io': { target: API, ws: true, changeOrigin: true }
    }
  }
});
