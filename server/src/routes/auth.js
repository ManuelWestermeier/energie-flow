// ---------------------------------------------------------------------------
//  routes/auth.js – Login-Endpunkte
// ---------------------------------------------------------------------------
import { Router } from 'express';
import passport from 'passport';
import { signToken, googleConfigured, requireAuth } from '../auth.js';
import { upsertUser } from '../db.js';

const router = Router();
const CLIENT = process.env.CLIENT_URL || 'http://localhost:5173';

// Welche Login-Verfahren stehen bereit? (Frontend blendet entsprechend ein)
router.get('/auth/config', (_req, res) => {
  res.json({ google: googleConfigured, dev: process.env.ALLOW_DEV_LOGIN === 'true' });
});

// --- Google -----------------------------------------------------------------
router.get('/auth/google', (req, res, next) => {
  if (!googleConfigured) return res.redirect(`${CLIENT}/login?error=google_nicht_konfiguriert`);
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get('/auth/google/callback',
  (req, res, next) => passport.authenticate('google', { session: false, failureRedirect: `${CLIENT}/login?error=login_fehlgeschlagen` })(req, res, next),
  (req, res) => {
    const token = signToken(req.user);
    // Token im URL-Fragment übergeben – das Frontend liest und speichert es.
    res.redirect(`${CLIENT}/login#token=${token}`);
  });

// --- Entwickler-Login (ohne Google) ----------------------------------------
router.post('/auth/dev', (req, res) => {
  if (process.env.ALLOW_DEV_LOGIN !== 'true')
    return res.status(403).json({ error: 'Entwickler-Login ist deaktiviert.' });
  const { email, name } = req.body || {};
  if (!email) return res.status(400).json({ error: 'E-Mail erforderlich.' });
  const user = upsertUser({ email, name: name || email.split('@')[0], picture: null, provider: 'dev' });
  res.json({ token: signToken(user), user: { id: user.id, email: user.email, name: user.name } });
});

router.get('/api/me', requireAuth, (req, res) => {
  const { id, email, name, picture } = req.user;
  res.json({ id, email, name, picture });
});

export default router;
