import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Lokale Schriften (per npm, kein CDN). Archivo = Display, Public Sans = Text.
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';

import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Leichter Service Worker (PWA) – nur außerhalb von localhost.
if ('serviceWorker' in navigator) {
  const host = location.hostname;
  const local = host === 'localhost' || host === '127.0.0.1' || host === '';
  if (!local) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
