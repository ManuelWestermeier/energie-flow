// ---------------------------------------------------------------------------
//  auth.js – Authentifizierung über Benutzername + Passwort
//
//  Bewusste Architektur (laut Vorgabe):
//   • KEIN JWT, KEIN JWT_SECRET, KEINE Sessions, KEINE Tokens, KEIN OAuth.
//   • Passwörter werden mit bcrypt gehasht gespeichert (bcryptjs = reine
//     JS-Implementierung desselben Algorithmus, ohne nativen Build).
//   • Authentifizierung per HTTP Basic: Benutzername + Passwort werden bei
//     jeder Anfrage mitgesendet (Header  Authorization: Basic base64(user:pass))
//     und serverseitig gegen den bcrypt-Hash geprüft.
//
//  Sicherheitshinweis: Da bei diesem token-/session-losen Verfahren die
//  Zugangsdaten mit jeder Anfrage übertragen werden, MUSS im Produktivbetrieb
//  zwingend HTTPS/TLS verwendet werden.
// ---------------------------------------------------------------------------
import bcrypt from 'bcryptjs';
import { getUserByUsername } from './db.js';

const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

export const hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);

// Base64-„user:pass" dekodieren (UTF-8-sicher)
function decodeBasic(b64) {
  try {
    const raw = Buffer.from(String(b64), 'base64').toString('utf8');
    const i = raw.indexOf(':');
    if (i < 0) return null;
    return { username: raw.slice(0, i), password: raw.slice(i + 1) };
  } catch { return null; }
}

function fromAuthHeader(header) {
  if (!header || !header.startsWith('Basic ')) return null;
  return decodeBasic(header.slice(6));
}

// Zugangsdaten prüfen -> Nutzer oder null
export async function verifyCredentials(username, password) {
  if (!username || !password) return null;
  const user = getUserByUsername(username);
  if (!user) {
    // Konstante Arbeit, um Timing-Unterschiede (Nutzer existiert/nicht) zu glätten.
    await bcrypt.compare(password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
    return null;
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? user : null;
}

// REST-Middleware: erwartet  Authorization: Basic <base64(user:pass)>
export async function requireAuth(req, res, next) {
  const creds = fromAuthHeader(req.headers.authorization);
  if (!creds) return res.status(401).json({ error: 'Nicht angemeldet.' });
  const user = await verifyCredentials(creds.username, creds.password);
  if (!user) return res.status(401).json({ error: 'Benutzername oder Passwort falsch.' });
  req.user = user;
  next();
}

// Socket.IO-Middleware: Zugangsdaten kommen im Handshake (auth.basic).
export async function socketAuth(socket, next) {
  const a = socket.handshake.auth || {};
  const creds = a.basic ? decodeBasic(a.basic)
    : (a.username ? { username: a.username, password: a.password } : null);
  if (!creds) return next(new Error('unauthorized'));
  const user = await verifyCredentials(creds.username, creds.password);
  if (!user) return next(new Error('unauthorized'));
  socket.userId = user.id;
  next();
}
