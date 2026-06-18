// ---------------------------------------------------------------------------
//  index.js – Servereinstieg
//  Express-API + Socket.IO. Das Backend serviert den gebauten Client direkt
//  auf demselben Port.
// ---------------------------------------------------------------------------
import 'dotenv/config';
import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketServer } from 'socket.io';

import { socketAuth } from './auth.js';
import { getMember } from './db.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');
const clientDir = path.join(projectRoot, 'client');
const clientIndex = path.join(clientDir, 'dist', 'index.html');
const clientDist = path.join(clientDir, 'dist');

const PORT = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === 'production';
const app = express();

app.use(express.json({ limit: '1mb' }));
app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(authRoutes);
app.use(apiRoutes);

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

app.use(express.static(clientDist, { index: false, maxAge: isProduction ? '1h' : 0 }));

app.use((req, res, next) => {
  const url = req.originalUrl || req.url || '/';
  if (url.startsWith('/api') || url.startsWith('/auth') || url.startsWith('/socket.io')) return next();
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  if (!fs.existsSync(clientIndex)) {
    return res.status(503).send('Frontend-Build fehlt. Bitte zuerst "npm run build" ausführen.');
  }
  return res.sendFile(clientIndex);
});

server.listen(PORT, () => {
  console.log(`\n  EnergieFlow läuft auf http://localhost:${PORT}`);
  console.log(`  Modus: ${isProduction ? 'production' : 'development'} · Frontend + Backend auf einem Port`);
  console.log(`  Auth: Username/Passwort mit bcrypt · keine Sessions · keine JWTs · kein OAuth\n`);
});
