import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Ein Port, ein Server: Vite baut das Frontend nach  ../dist  und das Backend
// liefert diesen Ordner aus. Es gibt im Betrieb KEINEN separaten Frontend-Port
// und keinen Proxy mehr – API und Frontend laufen über dieselbe Adresse.
export default defineConfig({
  root: 'client',
  base: '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
  },
  plugins: [react()],
});
