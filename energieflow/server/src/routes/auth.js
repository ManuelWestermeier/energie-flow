// ---------------------------------------------------------------------------
//  routes/auth.js – Login / Registrierung / aktueller Benutzer
// ---------------------------------------------------------------------------
import { Router } from 'express';
import { createUser, authenticateUser } from '../db.js';
import { requireAuth, safeUser } from '../auth.js';

const router = Router();

function sanitizeInput(value) {
  return String(value || '').trim();
}

router.post('/auth/register', (req, res) => {
  try {
    const username = sanitizeInput(req.body?.username).toLowerCase();
    const password = String(req.body?.password || '');
    const name = sanitizeInput(req.body?.name);
    const email = sanitizeInput(req.body?.email) || null;

    const user = createUser({
      username,
      password,
      name: name || username,
      email,
      provider: 'password',
    });

    res.status(201).json({ user: safeUser(user) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen.';
    const status = /bereits vergeben/i.test(message) ? 409 : 400;
    res.status(status).json({ error: message });
  }
});

router.post('/auth/login', (req, res) => {
  const username = sanitizeInput(req.body?.username).toLowerCase();
  const password = String(req.body?.password || '');
  const user = authenticateUser(username, password);
  if (!user) return res.status(401).json({ error: 'Benutzername oder Passwort ungültig.' });
  res.json({ user: safeUser(user) });
});

router.get('/auth/me', requireAuth, (req, res) => {
  res.json(req.user);
});

router.post('/auth/refresh', requireAuth, (req, res) => {
  res.json(req.user);
});
export default router;
