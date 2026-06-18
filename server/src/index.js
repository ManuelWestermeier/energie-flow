// ---------------------------------------------------------------------------
//  index.js – Servereinstieg
//  Express-API + Socket.IO (Live-Sync). Mitglieder treten dem Raum
//  project:<id> bei und erhalten dort jede Aktualisierung.
// ---------------------------------------------------------------------------
import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import passport from 'passport';
import { Server as SocketServer } from 'socket.io';

import { setupPassport, socketAuth } from './auth.js';
import { getMember } from './db.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';

const PORT = process.env.PORT || 4000;
const CLIENT = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT, credentials: true }));
app.use(express.json({ limit: '1mb' }));
setupPassport();
app.use(passport.initialize());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(authRoutes);
app.use(apiRoutes);

const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: CLIENT, credentials: true } });
app.set('io', io);

io.use(socketAuth);
io.on('connection', (socket) => {
  // Einem Projektraum beitreten – nur, wenn der Nutzer Mitglied ist.
  socket.on('project:join', (projectId) => {
    if (typeof projectId !== 'string') return;
    if (getMember(projectId, socket.userId)) socket.join('project:' + projectId);
  });
  socket.on('project:leave', (projectId) => socket.leave('project:' + projectId));
});

server.listen(PORT, () => {
  console.log(`\n  EnergieFlow-Server läuft auf  http://localhost:${PORT}`);
  console.log(`  Frontend erwartet unter        ${CLIENT}`);
  console.log(`  Google-Login: ${process.env.GOOGLE_CLIENT_ID ? 'aktiv' : 'nicht konfiguriert'} · `
    + `Dev-Login: ${process.env.ALLOW_DEV_LOGIN === 'true' ? 'aktiv' : 'aus'}\n`);
});
