// ---------------------------------------------------------------------------
//  routes/auth.js – Registrierung & Anmeldung (Benutzername + Passwort)
//  Keine Tokens, keine Sessions: Login prüft nur die Zugangsdaten; die
//  Anwendung sendet sie anschließend bei jeder Anfrage per HTTP Basic mit.
// ---------------------------------------------------------------------------
import { Router } from 'express';
import { requireAuth, hashPassword } from '../auth.js';
import { getUserByUsername, createUser } from '../db.js';

const router = Router();
const profile = (u) => ({ id: u.id, username: u.username, name: u.name });

const USERNAME_RE = /^[A-Za-z0-9_.\-]{3,32}$/;

// Registrierung
router.post('/api/auth/register', async (req, res) => {
  const { username, password, name } = req.body || {};
  if (!username || !USERNAME_RE.test(username))
    return res.status(400).json({ error: 'Benutzername: 3–32 Zeichen, nur Buchstaben, Ziffern, . _ -' });
  if (!password || String(password).length < 6)
    return res.status(400).json({ error: 'Das Passwort muss mindestens 6 Zeichen haben.' });
  if (getUserByUsername(username))
    return res.status(409).json({ error: 'Dieser Benutzername ist bereits vergeben.' });

  const passwordHash = await hashPassword(String(password));
  const user = createUser({ username, name: (name || '').trim() || username, passwordHash });
  res.status(201).json(profile(user));
});

// Anmeldung – prüft die per Basic-Header gesendeten Zugangsdaten.
router.post('/api/auth/login', requireAuth, (req, res) => {
  res.json(profile(req.user));
});

// Aktuelles Profil (validiert ebenfalls die Zugangsdaten).
router.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(profile(req.user));
});

export default router;
