// ---------------------------------------------------------------------------
//  index.js – Servereinstieg (EIN Port für alles)
//
//  Dieser Server stellt gleichzeitig bereit:
//    • die REST-API unter  /api/...
//    • die WebSocket-Verbindung (Socket.IO) für die Live-Synchronisation
//    • das gebaute Frontend aus  /dist  (inkl. SPA-Fallback auf index.html)
//
//  Es gibt KEINEN separaten Frontend-Port und KEINEN Proxy. Im Entwicklungs-
//  modus baut Vite das Frontend im Watch-Modus nach /dist; dieser Server liefert
//  es aus. Im Produktivbetrieb erzeugt  npm run build  das /dist-Bündel.
// ---------------------------------------------------------------------------
import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server as SocketServer } from 'socket.io';

import { socketAuth } from './auth.js';
import { getMember } from './db.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', '..', 'dist');
const indexHtml = path.join(distDir, 'index.html');

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json({ limit: '1mb' }));

// ---- API -------------------------------------------------------------------
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use(authRoutes);
app.use(apiRoutes);
// Unbekannte API-Pfade als JSON beantworten (nicht das Frontend ausliefern).
app.use('/api', (_req, res) => res.status(404).json({ error: 'Nicht gefunden.' }));

// ---- Frontend (statisch) + SPA-Fallback ------------------------------------
app.use(express.static(distDir, { index: false }));
app.get('*', (_req, res) => {
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  res
    .status(200)
    .type('html')
    .send('<!doctype html><meta charset="utf-8"><title>EnergieFlow</title>'
      + '<body style="font-family:system-ui;padding:2rem;color:#20261c">'
      + '<h1>EnergieFlow</h1><p>Das Frontend wird gerade gebaut. '
      + 'Bitte in ein paar Sekunden neu laden.</p>'
      + '<p style="color:#8a917f">(Im Entwicklungsmodus erzeugt Vite den Ordner <code>/dist</code>.)</p>');
});

// ---- WebSocket (gleicher Port, gleiche Herkunft) ---------------------------
const server = http.createServer(app);
const io = new SocketServer(server);
app.set('io', io);

io.use(socketAuth);
io.on('connection', (socket) => {
  socket.on('project:join', (projectId) => {
    if (typeof projectId !== 'string') return;
    if (getMember(projectId, socket.userId)) socket.join('project:' + projectId);
  });
  socket.on('project:leave', (projectId) => socket.leave('project:' + projectId));
});

server.listen(PORT, () => {
  const haveBuild = fs.existsSync(indexHtml);
  console.log(`\n  EnergieFlow läuft auf  http://localhost:${PORT}  (${isProd ? 'Produktion' : 'Entwicklung'})`);
  console.log(`  Anmeldung: Benutzername + Passwort (bcrypt, ohne Token/Session)`);
  if (!haveBuild) console.log(`  Hinweis: /dist noch nicht vorhanden – im Dev baut Vite gleich, sonst "npm run build".`);
  console.log('');
});
