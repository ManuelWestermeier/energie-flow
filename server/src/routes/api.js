// ---------------------------------------------------------------------------
//  routes/api.js – Projekt-API
//  Nach jeder Änderung wird der vollständige Projektzustand per WebSocket an
//  alle Mitglieder im Raum  project:<id>  gesendet (Live-Synchronisation).
// ---------------------------------------------------------------------------
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import {
  createProject, updateProject, rawProject, fullProject, listProjectsForUser,
  addMember, getMember, updateMyMember,
  createInvite, getInviteByToken, bumpInvite,
  addProposal, setConsent, clearConsents,
  setTask, logActivity, listActivity,
} from '../db.js';

const router = Router();

function emit(req, id) {
  const io = req.app.get('io');
  if (io) io.to('project:' + id).emit('project:update', fullProject(id));
}
function member(req, id) { return getMember(id, req.user.id); }
function guardMember(req, res, id) {
  const m = member(req, id);
  if (!m) { res.status(403).json({ error: 'Kein Zugriff auf dieses Projekt.' }); return null; }
  return m;
}

// ---- Projekt anlegen -------------------------------------------------------
router.post('/api/projects', requireAuth, (req, res) => {
  const d = req.body || {};
  const id = createProject(req.user.id, {
    name: d.name || `Solaranlage ${d.street || ''} ${d.hausnr || ''}`.trim() || 'Solarprojekt',
    street: d.street, hausnr: d.hausnr, plz: d.plz, ort: d.ort, bundesland: d.bundesland,
    eigentum: d.eigentum,
    we: d.we, kwp: d.kwp, ertrag: d.ertrag, invest: d.invest,
    gvpreis: d.gvpreis, arbeitspreis: d.arbeitspreis, einspeise: d.einspeise,
    opex: d.opex, versicherung: d.versicherung, zeitraum: d.zeitraum,
    share_pct: d.share_pct ?? 90,
    intake: d.intake || d,
  });
  addMember(id, req.user.id, { role: 'admin', wohnung: d.wohnung, household: req.user.name });
  logActivity(id, { type: 'create', actorName: req.user.name, text: 'hat das Projekt angelegt' });
  res.json(fullProject(id));
});

router.get('/api/projects', requireAuth, (req, res) => {
  res.json(listProjectsForUser(req.user.id).map((p) => ({
    id: p.id, name: p.name, street: p.street, hausnr: p.hausnr, ort: p.ort,
    status: p.status, share_pct: p.share_pct, members: p.member_count, updated_at: p.updated_at,
    kwp: p.kwp, we: p.we,
  })));
});

router.get('/api/projects/:id', requireAuth, (req, res) => {
  if (!guardMember(req, res, req.params.id)) return;
  res.json(fullProject(req.params.id));
});

router.get('/api/projects/:id/activity', requireAuth, (req, res) => {
  if (!guardMember(req, res, req.params.id)) return;
  res.json(listActivity(req.params.id, 200));
});

// ---- Gebäude-/Anlagendaten (Admin oder Vermieter) -------------------------
router.patch('/api/projects/:id', requireAuth, (req, res) => {
  const m = guardMember(req, res, req.params.id);
  if (!m) return;
  if (!['admin', 'vermieter'].includes(m.role))
    return res.status(403).json({ error: 'Nur Admin oder Eigentümerseite dürfen die Anlagendaten ändern.' });
  const allow = ['name', 'we', 'kwp', 'ertrag', 'invest', 'gvpreis', 'arbeitspreis',
    'einspeise', 'opex', 'versicherung', 'zeitraum', 'feindaten'];
  const patch = {};
  for (const k of allow) if (req.body[k] !== undefined) patch[k] = req.body[k];
  updateProject(req.params.id, patch);
  if ('name' in patch) logActivity(req.params.id, { type: 'edit', actorName: req.user.name, text: 'hat das Projekt umbenannt' });
  else logActivity(req.params.id, { type: 'edit', actorName: req.user.name, text: req.body.feindaten ? 'hat Feindaten hinterlegt' : 'hat die Anlagendaten aktualisiert' });
  emit(req, req.params.id);
  res.json(fullProject(req.params.id));
});

// ---- Eigene Haushaltsdaten -------------------------------------------------
router.post('/api/projects/:id/members/me', requireAuth, (req, res) => {
  if (!guardMember(req, res, req.params.id)) return;
  const { wohnung, household, verbrauch, status, confirmed } = req.body || {};
  updateMyMember(req.params.id, req.user.id, { wohnung, household, verbrauch, status, confirmed });
  if (confirmed) logActivity(req.params.id, { type: 'member', actorName: req.user.name, text: 'hat die eigenen Daten bestätigt und zugesagt' });
  emit(req, req.params.id);
  res.json(fullProject(req.params.id));
});

// ---- Aufgaben (Fahrplan) ---------------------------------------------------
router.post('/api/projects/:id/tasks/:taskId', requireAuth, (req, res) => {
  if (!guardMember(req, res, req.params.id)) return;
  const done = req.body?.done !== false;
  setTask(req.params.id, req.params.taskId, done, req.user.name);
  const label = (req.body?.label || 'Aufgabe').toString().slice(0, 120);
  logActivity(req.params.id, { type: 'task', actorName: req.user.name, text: (done ? 'hat erledigt: ' : 'hat als offen markiert: ') + label });
  emit(req, req.params.id);
  res.json(fullProject(req.params.id));
});

// ---- Einladungen -----------------------------------------------------------
router.post('/api/projects/:id/invites', requireAuth, (req, res) => {
  const m = guardMember(req, res, req.params.id);
  if (!m) return;
  if (m.role !== 'admin') return res.status(403).json({ error: 'Nur der/die Admin darf einladen.' });
  const { role = 'mieter', label, email } = req.body || {};
  const invite = createInvite(req.params.id, req.user.id, { role, label, email });
  emit(req, req.params.id);
  res.json(invite);
});

router.get('/api/invites/:token', (req, res) => {
  const inv = getInviteByToken(req.params.token);
  if (!inv) return res.status(404).json({ error: 'Einladung nicht gefunden oder abgelaufen.' });
  const p = rawProject(inv.project_id);
  res.json({ role: inv.role, label: inv.label, project: { id: p.id, name: p.name, street: p.street, hausnr: p.hausnr, ort: p.ort, kwp: p.kwp, we: p.we } });
});

router.post('/api/invites/:token/accept', requireAuth, (req, res) => {
  const inv = getInviteByToken(req.params.token);
  if (!inv) return res.status(404).json({ error: 'Einladung nicht gefunden.' });
  addMember(inv.project_id, req.user.id, { role: inv.role, household: req.body?.household || req.user.name, wohnung: req.body?.wohnung });
  bumpInvite(inv.id);
  if (inv.role === 'vermieter') updateProject(inv.project_id, { status: 'verhandeln' });
  logActivity(inv.project_id, { type: 'join', actorName: req.user.name, text: inv.role === 'vermieter' ? 'ist als Eigentümerseite beigetreten' : 'ist der Hausgemeinschaft beigetreten' });
  emit(req, inv.project_id);
  res.json(fullProject(inv.project_id));
});

// ---- Verhandlung -----------------------------------------------------------
router.post('/api/projects/:id/proposals', requireAuth, (req, res) => {
  const m = guardMember(req, res, req.params.id);
  if (!m) return;
  const { share_pct, quote_pct, params, result, note } = req.body || {};
  if (typeof share_pct !== 'number') return res.status(400).json({ error: 'Ungültiger Anteil.' });
  addProposal(req.params.id, { by_user_id: req.user.id, by_role: m.role, by_name: req.user.name, share_pct, quote_pct, params, result, note });
  updateProject(req.params.id, { share_pct, status: 'verhandeln' });
  clearConsents(req.params.id);
  logActivity(req.params.id, { type: 'proposal', actorName: req.user.name, text: `schlägt ${Math.round(share_pct)} % des Grundpreises vor` });
  emit(req, req.params.id);
  res.json(fullProject(req.params.id));
});

// ---- Zustimmung ------------------------------------------------------------
router.post('/api/projects/:id/consent', requireAuth, (req, res) => {
  if (!guardMember(req, res, req.params.id)) return;
  const p = rawProject(req.params.id);
  const agreed = req.body?.agreed !== false;
  setConsent(req.params.id, req.user.id, p.share_pct, agreed);
  let full = fullProject(req.params.id);
  if (agreed) logActivity(req.params.id, { type: 'consent', actorName: req.user.name, text: `stimmt ${Math.round(p.share_pct)} % zu` });
  if (full.consent.consensus && p.status !== 'vereinbart') {
    updateProject(req.params.id, { status: 'vereinbart' });
    logActivity(req.params.id, { type: 'agreed', actorName: null, text: 'Einigung erreicht – alle Aktiven stimmen dem Preis zu' });
    full = fullProject(req.params.id);
  }
  emit(req, req.params.id);
  res.json(full);
});

export default router;
