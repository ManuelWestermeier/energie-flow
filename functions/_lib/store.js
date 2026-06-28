// ---------------------------------------------------------------------------
//  store.js – Datenhaltung auf Cloudflare KV
//
//  Der gesamte Datenbestand liegt als EIN JSON-Wert unter dem Schlüssel "db"
//  im KV-Namespace (Binding: env.DB). Pro Request wird er einmal geladen
//  (load), in-memory verändert und am Ende einmal gespeichert (persist).
//  Die Manipulationsfunktionen sind ein 1:1-Port der bisherigen JSON-Store-
//  Logik – sie bekommen das geladene Objekt `db` als ersten Parameter und
//  besitzen KEINEN eigenen Zustand (Workers-Isolates sind zustandslos).
//
//  Hinweis (Ehrlichkeit): Lesen-Ändern-Schreiben auf einem einzelnen Blob ist
//  bei sehr vielen gleichzeitigen Schreibzugriffen nicht kollisionsfrei. Für
//  die Größenordnung dieses Projekts (wenige Personen pro Haus) ist das
//  unkritisch. Der saubere Upgrade-Pfad bei echter Nebenläufigkeit ist D1.
// ---------------------------------------------------------------------------
import { nid } from './ids.js';

const KEY = 'db';
const emptyDB = () => ({ users: [], projects: [], members: [], invites: [], proposals: [], consents: [], activity: [] });

export async function load(env) {
  try {
    const raw = await env.DB.get(KEY);
    return raw ? { ...emptyDB(), ...JSON.parse(raw) } : emptyDB();
  } catch {
    return emptyDB();
  }
}
export async function persist(env, db) {
  await env.DB.put(KEY, JSON.stringify(db));
}

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
export function createUser(db, { username, name, passwordHash }) {
  const user = { id: 'u_' + nid(10), username, name: name || username, password_hash: passwordHash, created_at: now() };
  db.users.push(user); return user;
}
export const getUserByUsername = (db, username) =>
  db.users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
export const getUserById = (db, id) => db.users.find((u) => u.id === id);

// ---- Projekte --------------------------------------------------------------
export function createProject(db, adminId, input = {}) {
  const id = 'p_' + nid(10);
  const p = { id, admin_id: adminId, ...PROJECT_DEFAULTS, tasks: {}, created_at: now(), updated_at: now() };
  for (const f of PROJECT_FIELDS) if (input[f] !== undefined) p[f] = coerce(f, input[f]);
  db.projects.push(p); return id;
}
export function updateProject(db, id, patch = {}) {
  const p = db.projects.find((x) => x.id === id);
  if (!p) return;
  let changed = false;
  for (const f of PROJECT_FIELDS) if (patch[f] !== undefined) { p[f] = coerce(f, patch[f]); changed = true; }
  if (changed) p.updated_at = now();
}
export const rawProject = (db, id) => db.projects.find((p) => p.id === id) || null;

export function listProjectsForUser(db, userId) {
  const mine = db.members.filter((m) => m.user_id === userId).map((m) => m.project_id);
  return db.projects
    .filter((p) => mine.includes(p.id))
    .map((p) => ({ ...p, member_count: db.members.filter((m) => m.project_id === p.id).length }))
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

// Aufgaben-Status (Fahrplan). tasks = { [taskId]: { done, by, at } }
export function setTask(db, projectId, taskId, done, byName) {
  const p = rawProject(db, projectId);
  if (!p) return;
  p.tasks = p.tasks || {};
  if (done) p.tasks[taskId] = { done: true, by: byName || null, at: now() };
  else delete p.tasks[taskId];
  p.updated_at = now();
}

// ---- Mitglieder ------------------------------------------------------------
export function addMember(db, projectId, userId, { role = 'mieter', household, wohnung } = {}) {
  const existing = db.members.find((m) => m.project_id === projectId && m.user_id === userId);
  if (existing) return existing.id;
  const id = 'm_' + nid(10);
  db.members.push({
    id, project_id: projectId, user_id: userId, role,
    household: household ?? null, wohnung: wohnung ?? null,
    status: 'beigetreten', verbrauch: null, confirmed: 0, joined_at: now(),
  });
  return id;
}
export const getMember = (db, projectId, userId) =>
  db.members.find((m) => m.project_id === projectId && m.user_id === userId) || null;

export function updateMyMember(db, projectId, userId, { wohnung, household, verbrauch, status, confirmed }) {
  const m = getMember(db, projectId, userId);
  if (!m) return;
  if (wohnung !== undefined) m.wohnung = wohnung;
  if (household !== undefined) m.household = household;
  if (verbrauch !== undefined) m.verbrauch = verbrauch === null ? null : Number(verbrauch);
  if (status !== undefined) m.status = status;
  if (confirmed !== undefined) m.confirmed = confirmed ? 1 : 0;
}

// ---- Einladungen -----------------------------------------------------------
export function createInvite(db, projectId, createdBy, { role = 'mieter', label, email } = {}) {
  const invite = {
    id: 'i_' + nid(10), project_id: projectId, token: nid(18), role,
    label: label ?? null, email: email ?? null, created_by: createdBy, used_count: 0, created_at: now(),
  };
  db.invites.push(invite); return invite;
}
export const getInviteByToken = (db, token) => db.invites.find((i) => i.token === token) || null;
export function bumpInvite(db, id) { const i = db.invites.find((x) => x.id === id); if (i) i.used_count += 1; }

// ---- Vorschläge ------------------------------------------------------------
export function addProposal(db, projectId, { by_user_id, by_role, by_name, share_pct, quote_pct, params, result, note }) {
  const id = 'pr_' + nid(10);
  db.proposals.push({
    id, project_id: projectId, by_user_id, by_role, by_name,
    share_pct: Number(share_pct), quote_pct: quote_pct == null ? null : Number(quote_pct),
    params: params || {}, result: result || {}, note: note ?? null, created_at: now(),
  });
  return id;
}

// ---- Zustimmungen ----------------------------------------------------------
export function setConsent(db, projectId, userId, share_pct, agreed) {
  let c = db.consents.find((x) => x.project_id === projectId && x.user_id === userId);
  if (!c) { c = { id: 'c_' + nid(10), project_id: projectId, user_id: userId }; db.consents.push(c); }
  c.share_pct = Number(share_pct); c.agreed = agreed ? 1 : 0; c.created_at = now();
}
export function clearConsents(db, projectId) {
  db.consents = db.consents.filter((c) => c.project_id !== projectId);
}

// ---- Aktivitätsprotokoll ---------------------------------------------------
export function logActivity(db, projectId, { type, actorName, text }) {
  db.activity.push({ id: 'a_' + nid(10), project_id: projectId, type: type || 'info', actor_name: actorName || null, text: text || '', created_at: now() });
}
export function listActivity(db, projectId, limit = 100) {
  return db.activity.filter((a) => a.project_id === projectId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, limit);
}

// ---- Vollständiger Projektzustand ------------------------------------------
export function fullProject(db, id) {
  const p = rawProject(db, id);
  if (!p) return null;

  const members = db.members.filter((m) => m.project_id === id)
    .sort((a, b) => (a.joined_at < b.joined_at ? -1 : 1))
    .map((m) => { const u = getUserById(db, m.user_id) || {}; return { ...m, user_name: u.name, user_username: u.username }; });

  const invites = db.invites.filter((i) => i.project_id === id).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  const proposals = db.proposals.filter((pr) => pr.project_id === id).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const consents = db.consents.filter((c) => c.project_id === id);

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
    activity: listActivity(db, id, 12),
  };
}
