// ---------------------------------------------------------------------------
//  db.js – Datenhaltung als schlanker JSON-Store (ohne native Abhängigkeit)
//  Persistenz: server/data/db.json (synchron gesichert).
// ---------------------------------------------------------------------------
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'db.json');
fs.mkdirSync(dataDir, { recursive: true });

const EMPTY = { users: [], projects: [], members: [], invites: [], proposals: [], consents: [], activity: [] };

let data;
try {
  data = fs.existsSync(dbFile) ? { ...EMPTY, ...JSON.parse(fs.readFileSync(dbFile, 'utf8')) } : { ...EMPTY };
} catch { data = { ...EMPTY }; }
function save() { fs.writeFileSync(dbFile, JSON.stringify(data, null, 2)); }
const now = () => new Date().toISOString();

const PROJECT_FIELDS = ['name', 'street', 'hausnr', 'plz', 'ort', 'bundesland', 'eigentum',
  'we', 'kwp', 'ertrag', 'invest', 'gvpreis', 'arbeitspreis', 'einspeise', 'opex',
  'versicherung', 'zeitraum', 'qmax', 'share_pct', 'status', 'intake', 'feindaten'];
const NUMERIC = new Set(['we', 'kwp', 'ertrag', 'invest', 'gvpreis', 'arbeitspreis',
  'einspeise', 'opex', 'versicherung', 'zeitraum', 'qmax', 'share_pct']);
const coerce = (k, v) => (NUMERIC.has(k) && v !== undefined && v !== null && v !== '' ? Number(v) : v);

const PROJECT_DEFAULTS = {
  name: 'Solarprojekt', street: '', hausnr: '', plz: '', ort: '', bundesland: 'Bayern',
  eigentum: 'vermieter', we: 8, kwp: 30, ertrag: 900, invest: 62250, gvpreis: 35,
  arbeitspreis: 34, einspeise: 6.88, opex: 600, versicherung: 200, zeitraum: 20,
  qmax: 40.7, share_pct: 90, status: 'sammeln', intake: null, feindaten: false, tasks: {},
};

// ---- Nutzer ----------------------------------------------------------------
export function createUser({ username, name, passwordHash }) {
  const user = { id: 'u_' + nanoid(10), username, name: name || username, password_hash: passwordHash, created_at: now() };
  data.users.push(user); save(); return user;
}
export const getUserByUsername = (username) =>
  data.users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
export const getUserById = (id) => data.users.find((u) => u.id === id);

// ---- Projekte --------------------------------------------------------------
export function createProject(adminId, input = {}) {
  const id = 'p_' + nanoid(10);
  const p = { id, admin_id: adminId, ...PROJECT_DEFAULTS, tasks: {}, created_at: now(), updated_at: now() };
  for (const f of PROJECT_FIELDS) if (input[f] !== undefined) p[f] = coerce(f, input[f]);
  data.projects.push(p); save(); return id;
}
export function updateProject(id, patch = {}) {
  const p = data.projects.find((x) => x.id === id);
  if (!p) return;
  let changed = false;
  for (const f of PROJECT_FIELDS) if (patch[f] !== undefined) { p[f] = coerce(f, patch[f]); changed = true; }
  if (changed) { p.updated_at = now(); save(); }
}
export const rawProject = (id) => data.projects.find((p) => p.id === id) || null;

export function listProjectsForUser(userId) {
  const mine = data.members.filter((m) => m.user_id === userId).map((m) => m.project_id);
  return data.projects
    .filter((p) => mine.includes(p.id))
    .map((p) => ({ ...p, member_count: data.members.filter((m) => m.project_id === p.id).length }))
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

// Aufgaben-Status (Fahrplan). tasks = { [taskId]: { done, by, at } }
export function setTask(projectId, taskId, done, byName) {
  const p = rawProject(projectId);
  if (!p) return;
  p.tasks = p.tasks || {};
  if (done) p.tasks[taskId] = { done: true, by: byName || null, at: now() };
  else delete p.tasks[taskId];
  p.updated_at = now(); save();
}

// ---- Mitglieder ------------------------------------------------------------
export function addMember(projectId, userId, { role = 'mieter', household, wohnung } = {}) {
  const existing = data.members.find((m) => m.project_id === projectId && m.user_id === userId);
  if (existing) return existing.id;
  const id = 'm_' + nanoid(10);
  data.members.push({
    id, project_id: projectId, user_id: userId, role,
    household: household ?? null, wohnung: wohnung ?? null,
    status: 'beigetreten', verbrauch: null, confirmed: 0, joined_at: now(),
  });
  save(); return id;
}
export const getMember = (projectId, userId) =>
  data.members.find((m) => m.project_id === projectId && m.user_id === userId) || null;

export function updateMyMember(projectId, userId, { wohnung, household, verbrauch, status, confirmed }) {
  const m = getMember(projectId, userId);
  if (!m) return;
  if (wohnung !== undefined) m.wohnung = wohnung;
  if (household !== undefined) m.household = household;
  if (verbrauch !== undefined) m.verbrauch = verbrauch === null ? null : Number(verbrauch);
  if (status !== undefined) m.status = status;
  if (confirmed !== undefined) m.confirmed = confirmed ? 1 : 0;
  save();
}

// ---- Einladungen -----------------------------------------------------------
export function createInvite(projectId, createdBy, { role = 'mieter', label, email } = {}) {
  const invite = {
    id: 'i_' + nanoid(10), project_id: projectId, token: nanoid(18), role,
    label: label ?? null, email: email ?? null, created_by: createdBy, used_count: 0, created_at: now(),
  };
  data.invites.push(invite); save(); return invite;
}
export const getInviteByToken = (token) => data.invites.find((i) => i.token === token) || null;
export function bumpInvite(id) { const i = data.invites.find((x) => x.id === id); if (i) { i.used_count += 1; save(); } }

// ---- Vorschläge ------------------------------------------------------------
export function addProposal(projectId, { by_user_id, by_role, by_name, share_pct, quote_pct, params, result, note }) {
  const id = 'pr_' + nanoid(10);
  data.proposals.push({
    id, project_id: projectId, by_user_id, by_role, by_name,
    share_pct: Number(share_pct), quote_pct: quote_pct == null ? null : Number(quote_pct),
    params: params || {}, result: result || {}, note: note ?? null, created_at: now(),
  });
  save(); return id;
}

// ---- Zustimmungen ----------------------------------------------------------
export function setConsent(projectId, userId, share_pct, agreed) {
  let c = data.consents.find((x) => x.project_id === projectId && x.user_id === userId);
  if (!c) { c = { id: 'c_' + nanoid(10), project_id: projectId, user_id: userId }; data.consents.push(c); }
  c.share_pct = Number(share_pct); c.agreed = agreed ? 1 : 0; c.created_at = now(); save();
}
export function clearConsents(projectId) {
  data.consents = data.consents.filter((c) => c.project_id !== projectId); save();
}

// ---- Aktivitätsprotokoll ---------------------------------------------------
export function logActivity(projectId, { type, actorName, text }) {
  data.activity.push({ id: 'a_' + nanoid(10), project_id: projectId, type: type || 'info', actor_name: actorName || null, text: text || '', created_at: now() });
  save();
}
export function listActivity(projectId, limit = 100) {
  return data.activity.filter((a) => a.project_id === projectId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, limit);
}

// ---- Vollständiger Projektzustand ------------------------------------------
export function fullProject(id) {
  const p = rawProject(id);
  if (!p) return null;

  const members = data.members.filter((m) => m.project_id === id)
    .sort((a, b) => (a.joined_at < b.joined_at ? -1 : 1))
    .map((m) => { const u = getUserById(m.user_id) || {}; return { ...m, user_name: u.name, user_username: u.username }; });

  const invites = data.invites.filter((i) => i.project_id === id).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  const proposals = data.proposals.filter((pr) => pr.project_id === id).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const consents = data.consents.filter((c) => c.project_id === id);

  const active = members.filter((m) => m.status !== 'abgelehnt');
  const consentByUser = Object.fromEntries(consents.map((c) => [c.user_id, c]));
  const agreedAt = (m) => { const c = consentByUser[m.user_id]; return !!(c && c.agreed && Math.abs(Number(c.share_pct) - Number(p.share_pct)) < 0.001); };
  const agreedCount = active.filter(agreedAt).length;
  const consensus = active.length > 0 && agreedCount === active.length;

  return {
    ...p,
    intake: p.intake || null,
    tasks: p.tasks || {},
    members: members.map((m) => ({
      id: m.id, userId: m.user_id, role: m.role, name: m.user_name, username: m.user_username,
      picture: null, household: m.household, wohnung: m.wohnung, status: m.status,
      verbrauch: m.verbrauch, confirmed: !!m.confirmed, agreed: agreedAt(m),
    })),
    invites: invites.map((i) => ({ id: i.id, token: i.token, role: i.role, label: i.label, email: i.email, used: i.used_count })),
    proposals: proposals.map((pr) => ({ ...pr })),
    consent: { agreedCount, activeCount: active.length, consensus },
    activity: listActivity(id, 12),
  };
}

export default data;
