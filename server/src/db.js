// ---------------------------------------------------------------------------
//  db.js – SQLite-Datenhaltung (better-sqlite3)
//  Speichert Nutzer, Projekte, Mitglieder, Einladungen, Vorschläge (Verlauf)
//  und Zustimmungen. Stellt fullProject() bereit – den vollständigen
//  Projektzustand, der per WebSocket live synchronisiert wird.
// ---------------------------------------------------------------------------
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'energieflow.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE,
  name       TEXT,
  picture    TEXT,
  provider   TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  street      TEXT, hausnr TEXT, plz TEXT, ort TEXT, bundesland TEXT,
  eigentum    TEXT,
  we          INTEGER DEFAULT 8,
  kwp         REAL DEFAULT 30,
  ertrag      REAL DEFAULT 900,
  invest      REAL DEFAULT 62250,
  gvpreis     REAL DEFAULT 35,
  arbeitspreis REAL DEFAULT 34,
  einspeise   REAL DEFAULT 6.88,
  opex        REAL DEFAULT 600,
  versicherung REAL DEFAULT 200,
  zeitraum    INTEGER DEFAULT 20,
  qmax        REAL DEFAULT 40.7,
  share_pct   REAL DEFAULT 90,
  status      TEXT DEFAULT 'sammeln',
  intake_json TEXT,
  admin_id    TEXT REFERENCES users(id),
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS members (
  id          TEXT PRIMARY KEY,
  project_id  TEXT REFERENCES projects(id) ON DELETE CASCADE,
  user_id     TEXT REFERENCES users(id),
  role        TEXT DEFAULT 'mieter',           -- admin | mieter | vermieter
  household   TEXT,
  wohnung     TEXT,
  status      TEXT DEFAULT 'beigetreten',      -- beigetreten | zugesagt | abgelehnt
  verbrauch   REAL,
  confirmed   INTEGER DEFAULT 0,
  joined_at   TEXT DEFAULT (datetime('now')),
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS invites (
  id          TEXT PRIMARY KEY,
  project_id  TEXT REFERENCES projects(id) ON DELETE CASCADE,
  token       TEXT UNIQUE,
  role        TEXT DEFAULT 'mieter',
  label       TEXT,
  email       TEXT,
  created_by  TEXT REFERENCES users(id),
  used_count  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS proposals (
  id          TEXT PRIMARY KEY,
  project_id  TEXT REFERENCES projects(id) ON DELETE CASCADE,
  by_user_id  TEXT,
  by_role     TEXT,
  by_name     TEXT,
  share_pct   REAL,
  quote_pct   REAL,
  params_json TEXT,
  result_json TEXT,
  note        TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consents (
  id          TEXT PRIMARY KEY,
  project_id  TEXT REFERENCES projects(id) ON DELETE CASCADE,
  user_id     TEXT REFERENCES users(id),
  share_pct   REAL,
  agreed      INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  UNIQUE(project_id, user_id)
);
`);

// ---- Nutzer ----------------------------------------------------------------
export function upsertUser({ email, name, picture, provider }) {
  const existing = email ? db.prepare('SELECT * FROM users WHERE email = ?').get(email) : null;
  if (existing) {
    db.prepare('UPDATE users SET name=COALESCE(?,name), picture=COALESCE(?,picture) WHERE id=?')
      .run(name, picture, existing.id);
    return db.prepare('SELECT * FROM users WHERE id=?').get(existing.id);
  }
  const id = 'u_' + nanoid(10);
  db.prepare('INSERT INTO users (id,email,name,picture,provider) VALUES (?,?,?,?,?)')
    .run(id, email, name, picture, provider);
  return db.prepare('SELECT * FROM users WHERE id=?').get(id);
}
export const getUser = (id) => db.prepare('SELECT * FROM users WHERE id=?').get(id);

// ---- Projekte --------------------------------------------------------------
const PROJECT_FIELDS = ['name', 'street', 'hausnr', 'plz', 'ort', 'bundesland', 'eigentum',
  'we', 'kwp', 'ertrag', 'invest', 'gvpreis', 'arbeitspreis', 'einspeise', 'opex',
  'versicherung', 'zeitraum', 'qmax', 'share_pct', 'status', 'intake_json'];

export function createProject(adminId, data) {
  const id = 'p_' + nanoid(10);
  const cols = ['id', 'admin_id', ...PROJECT_FIELDS.filter(f => data[f] !== undefined)];
  const vals = [id, adminId, ...PROJECT_FIELDS.filter(f => data[f] !== undefined).map(f => data[f])];
  db.prepare(`INSERT INTO projects (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...vals);
  return id;
}

export function updateProject(id, data) {
  const fields = PROJECT_FIELDS.filter(f => data[f] !== undefined);
  if (!fields.length) return;
  db.prepare(`UPDATE projects SET ${fields.map(f => f + '=?').join(',')}, updated_at=datetime('now') WHERE id=?`)
    .run(...fields.map(f => data[f]), id);
}

export const rawProject = (id) => db.prepare('SELECT * FROM projects WHERE id=?').get(id);

export function listProjectsForUser(userId) {
  const rows = db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM members m WHERE m.project_id=p.id) AS member_count
    FROM projects p
    JOIN members m ON m.project_id = p.id
    WHERE m.user_id = ?
    ORDER BY p.updated_at DESC`).all(userId);
  return rows;
}

// ---- Mitglieder ------------------------------------------------------------
export function addMember(projectId, userId, { role = 'mieter', household, wohnung } = {}) {
  const existing = db.prepare('SELECT * FROM members WHERE project_id=? AND user_id=?').get(projectId, userId);
  if (existing) return existing.id;
  const id = 'm_' + nanoid(10);
  db.prepare('INSERT INTO members (id,project_id,user_id,role,household,wohnung) VALUES (?,?,?,?,?,?)')
    .run(id, projectId, userId, role, household, wohnung);
  return id;
}
export const getMember = (projectId, userId) =>
  db.prepare('SELECT * FROM members WHERE project_id=? AND user_id=?').get(projectId, userId);

export function updateMyMember(projectId, userId, { wohnung, verbrauch, status, confirmed, household }) {
  const m = getMember(projectId, userId);
  if (!m) return;
  db.prepare(`UPDATE members SET
      wohnung=COALESCE(?,wohnung),
      household=COALESCE(?,household),
      verbrauch=COALESCE(?,verbrauch),
      status=COALESCE(?,status),
      confirmed=COALESCE(?,confirmed)
    WHERE id=?`).run(wohnung, household, verbrauch,
      status, confirmed === undefined ? null : (confirmed ? 1 : 0), m.id);
}

// ---- Einladungen -----------------------------------------------------------
export function createInvite(projectId, createdBy, { role = 'mieter', label, email }) {
  const id = 'i_' + nanoid(10);
  const token = nanoid(18);
  db.prepare('INSERT INTO invites (id,project_id,token,role,label,email,created_by) VALUES (?,?,?,?,?,?,?)')
    .run(id, projectId, token, role, label, email, createdBy);
  return db.prepare('SELECT * FROM invites WHERE id=?').get(id);
}
export const getInviteByToken = (token) => db.prepare('SELECT * FROM invites WHERE token=?').get(token);
export const bumpInvite = (id) => db.prepare('UPDATE invites SET used_count=used_count+1 WHERE id=?').run(id);

// ---- Vorschläge / Verlauf --------------------------------------------------
export function addProposal(projectId, { by_user_id, by_role, by_name, share_pct, quote_pct, params, result, note }) {
  const id = 'pr_' + nanoid(10);
  db.prepare(`INSERT INTO proposals
      (id,project_id,by_user_id,by_role,by_name,share_pct,quote_pct,params_json,result_json,note)
      VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, projectId, by_user_id, by_role, by_name, share_pct, quote_pct,
      JSON.stringify(params || {}), JSON.stringify(result || {}), note);
  return id;
}

// ---- Zustimmungen ----------------------------------------------------------
export function setConsent(projectId, userId, share_pct, agreed) {
  const id = 'c_' + nanoid(10);
  db.prepare(`INSERT INTO consents (id,project_id,user_id,share_pct,agreed) VALUES (?,?,?,?,?)
      ON CONFLICT(project_id,user_id) DO UPDATE SET share_pct=excluded.share_pct, agreed=excluded.agreed, created_at=datetime('now')`)
    .run(id, projectId, userId, share_pct, agreed ? 1 : 0);
}
export function clearConsents(projectId) {
  db.prepare('DELETE FROM consents WHERE project_id=?').run(projectId);
}

// ---- Vollständiger Projektzustand (für REST-Antwort & Socket-Broadcast) ----
export function fullProject(id) {
  const p = rawProject(id);
  if (!p) return null;
  const members = db.prepare(`
    SELECT m.*, u.name AS user_name, u.email AS user_email, u.picture AS user_picture
    FROM members m JOIN users u ON u.id = m.user_id
    WHERE m.project_id = ? ORDER BY m.joined_at ASC`).all(id);
  const invites = db.prepare('SELECT * FROM invites WHERE project_id=? ORDER BY created_at ASC').all(id);
  const proposals = db.prepare('SELECT * FROM proposals WHERE project_id=? ORDER BY created_at DESC').all(id)
    .map(pr => ({ ...pr, params: safe(pr.params_json), result: safe(pr.result_json) }));
  const consents = db.prepare('SELECT * FROM consents WHERE project_id=?').all(id);

  // Konsens-Status: stimmen alle aktiven Mitglieder (nicht abgelehnt) dem
  // aktuellen Anteil zu?
  const active = members.filter(m => m.status !== 'abgelehnt');
  const consentByUser = Object.fromEntries(consents.map(c => [c.user_id, c]));
  const agreedCount = active.filter(m => {
    const c = consentByUser[m.user_id];
    return c && c.agreed && Math.abs(c.share_pct - p.share_pct) < 0.001;
  }).length;
  const consensus = active.length > 0 && agreedCount === active.length;

  return {
    ...p,
    intake: safe(p.intake_json),
    members: members.map(m => ({
      id: m.id, userId: m.user_id, role: m.role, name: m.user_name, email: m.user_email,
      picture: m.user_picture, household: m.household, wohnung: m.wohnung, status: m.status,
      verbrauch: m.verbrauch, confirmed: !!m.confirmed,
      agreed: !!(consentByUser[m.user_id] && consentByUser[m.user_id].agreed &&
        Math.abs(consentByUser[m.user_id].share_pct - p.share_pct) < 0.001)
    })),
    invites: invites.map(i => ({ id: i.id, token: i.token, role: i.role, label: i.label, email: i.email, used: i.used_count })),
    proposals,
    consent: { agreedCount, activeCount: active.length, consensus }
  };
}

function safe(s) { try { return s ? JSON.parse(s) : null; } catch { return null; } }

export default db;
