// ---------------------------------------------------------------------------
//  auth.js – Authentifizierung
//  Login-Token (JWT) für REST und WebSocket. Google-OAuth via passport.
//  Zusätzlich ein Entwickler-Login ohne Google (ALLOW_DEV_LOGIN=true).
// ---------------------------------------------------------------------------
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { upsertUser, getUser } from './db.js';

const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: '30d' });
}
export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

// REST-Middleware: erwartet  Authorization: Bearer <token>
export function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Nicht angemeldet.' });
  const user = getUser(payload.sub);
  if (!user) return res.status(401).json({ error: 'Unbekannter Nutzer.' });
  req.user = user;
  next();
}

// Socket.IO-Middleware
export function socketAuth(socket, next) {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  const payload = token && verifyToken(token);
  if (!payload) return next(new Error('unauthorized'));
  socket.userId = payload.sub;
  next();
}

// Google-OAuth nur konfigurieren, wenn Zugangsdaten vorhanden sind.
export const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export function setupPassport() {
  if (!googleConfigured) return;
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback'
  }, (accessToken, refreshToken, profile, done) => {
    const user = upsertUser({
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value,
      provider: 'google'
    });
    done(null, user);
  }));
}
