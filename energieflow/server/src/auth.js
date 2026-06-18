// ---------------------------------------------------------------------------
//  auth.js – klassische Username/Passwort-Authentifizierung
//  Stateless: keine Sessions, keine JWTs, keine OAuth-Komponenten.
// ---------------------------------------------------------------------------
import { authenticateUser } from './db.js';

function parseBasicAuth(header) {
  if (!header || !header.startsWith('Basic ')) return null;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    if (idx < 0) return null;
    return {
      username: decoded.slice(0, idx),
      password: decoded.slice(idx + 1),
    };
  } catch {
    return null;
  }
}

export function safeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    picture: user.picture,
  };
}

export function credentialsFromRequest(req) {
  return parseBasicAuth(req.headers.authorization || '');
}

export function credentialsFromSocket(socket) {
  const auth = socket.handshake?.auth || {};
  if (typeof auth.username !== 'string' || typeof auth.password !== 'string') return null;
  return { username: auth.username, password: auth.password };
}

export function requireAuth(req, res, next) {
  const creds = credentialsFromRequest(req);
  if (!creds) {
    res.set('WWW-Authenticate', 'Basic realm="EnergieFlow", charset="UTF-8"');
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }

  const user = authenticateUser(creds.username, creds.password);
  if (!user) {
    res.set('WWW-Authenticate', 'Basic realm="EnergieFlow", charset="UTF-8"');
    return res.status(401).json({ error: 'Benutzername oder Passwort ungültig.' });
  }

  req.user = safeUser(user);
  next();
}

export function socketAuth(socket, next) {
  const creds = credentialsFromSocket(socket);
  if (!creds) return next(new Error('unauthorized'));
  const user = authenticateUser(creds.username, creds.password);
  if (!user) return next(new Error('unauthorized'));
  socket.userId = user.id;
  socket.user = safeUser(user);
  next();
}
