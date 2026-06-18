// ---------------------------------------------------------------------------
//  db.js – JSON-basierte Persistenz ohne native Abhängigkeiten
// ---------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'energieflow.json');

fs.mkdirSync(dataDir, { recursive: true });

const emptyState = {
  users: [],
  projects: [],
  members: [],
  invites: [],
  proposals: [],
  consents: [],
};

let state = loadState();

function loadState() {
  try {
    if (!fs.existsSync(dataFile)) return structuredClone(emptyState);
    const raw = fs.readFileSync(dataFile, 'utf8');
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      members: Array.isArray(parsed.members) ? parsed.members : [],
      invites: Array.isArray(parsed.invites) ? parsed.invites : [],
      proposals: Array.isArray(parsed.proposals) ? parsed.proposals : [],
      consents: Array.isArray(parsed.consents) ? parsed.consents : [],
    };
  } catch {
    return structuredClone(emptyState);
  }
}

function saveState() {
  const tmp = `${dataFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmp, dataFile);
}

function now() {
  return new Date().toISOString();
}

function makeId(prefix = '', bytes = 12) {
  return `${prefix}${crypto.randomBytes(bytes).toString('hex')}`;
}

function randomId(bytes = 4) {
  return crypto.randomBytes(bytes).toString('hex');
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function slugUsername(value) {
  const base = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.\.+/g, '.');
  return base.length >= 3 ? base : `user${randomId(2)}`;
}

function makeUniqueUsername(base) {
  const taken = new Set(state.users.map((u) => normalizeUsername(u.username)).filter(Boolean));
  let candidate = normalizeUsername(base) || `user${randomId(2)}`;
  if (!taken.has(candidate)) return candidate;
  let i = 2;
  while (taken.has(`${candidate}${i}`)) i += 1;
  return `${candidate}${i}`;
}

function safeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    name: user.name || user.username || user.email || user.id,
    email: user.email || null,
    picture: user.picture || null,
    provider: user.provider || 'password',
    created_at: user.created_at || null,
  };
}

function findProject(id) {
  return state.projects.find((project) => project.id === id) || null;
}

function findUser(id) {
  return state.users.find((user) => user.id === id) || null;
}

function projectMembers(projectId) {
  return state.members
    .filter((member) => member.project_id === projectId)
    .sort((a, b) => String(a.joined_at || '').localeCompare(String(b.joined_at || '')));
}

function projectInvites(projectId) {
  return state.invites
    .filter((invite) => invite.project_id === projectId)
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
}

function projectProposals(projectId) {
  return state.proposals
    .filter((proposal) => proposal.project_id === projectId)
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

function projectConsents(projectId) {
  return state.consents.filter((consent) => consent.project_id === projectId);
}

// ---- Nutzer ----------------------------------------------------------------
export function getUser(id) {
  return safeUser(findUser(id));
}

export function getUserByUsername(username) {
  const norm = normalizeUsername(username);
  return safeUser(state.users.find((user) => normalizeUsername(user.username) === norm));
}

export function createUser({ username, password, name = '', email = null, picture = null, provider = 'password' }) {
  const norm = normalizeUsername(username);
  if (!norm) throw new Error('Benutzername erforderlich.');
  if (norm.length < 3) throw new Error('Benutzername muss mindestens 3 Zeichen lang sein.');
  if (norm.length > 40) throw new Error('Benutzername ist zu lang.');
  if (!/^[a-z0-9._-]+$/.test(norm)) throw new Error('Benutzername enthält unzulässige Zeichen.');
  if (!password || String(password).length < 8) throw new Error('Passwort muss mindestens 8 Zeichen lang sein.');
  if (state.users.some((user) => normalizeUsername(user.username) === norm)) throw new Error('Benutzername bereits vergeben.');

  const user = {
    id: makeId('u_'),
    username: norm,
    password_hash: bcrypt.hashSync(String(password), Number(process.env.BCRYPT_ROUNDS || 12)),
    name: String(name || norm).trim() || norm,
    email: email ? String(email).trim() : null,
    picture: picture ? String(picture) : null,
    provider,
    created_at: now(),
  };
  state.users.push(user);
  saveState();
  return safeUser(user);
}

export function authenticateUser(username, password) {
  const norm = normalizeUsername(username);
  const user = state.users.find((entry) => normalizeUsername(entry.username) === norm);
  if (!user || !user.password_hash) return null;
  if (!bcrypt.compareSync(String(password || ''), user.password_hash)) return null;
  return safeUser(user);
}

export function updateUserProfile(id, patch = {}) {
  const user = findUser(id);
  if (!user) return null;
  if (patch.name !== undefined) user.name = String(patch.name || '').trim() || user.name;
  if (patch.email !== undefined) user.email = patch.email ? String(patch.email).trim() : null;
  if (patch.picture !== undefined) user.picture = patch.picture ? String(patch.picture) : null;
  saveState();
  return safeUser(user);
}

// ---- Projekte --------------------------------------------------------------
const PROJECT_FIELDS = ['name', 'street', 'hausnr', 'plz', 'ort', 'bundesland', 'eigentum',
  'we', 'kwp', 'ertrag', 'invest', 'gvpreis', 'arbeitspreis', 'einspeise', 'opex',
  'versicherung', 'zeitraum', 'qmax', 'share_pct', 'status', 'intake_json'];

export function createProject(adminId, data) {
  const project = {
    id: makeId('p_'),
    admin_id: adminId,
    created_at: now(),
    updated_at: now(),
  };

  for (const field of PROJECT_FIELDS) {
    if (data[field] !== undefined) project[field] = data[field];
  }

  if (project.share_pct === undefined) project.share_pct = 90;
  if (project.status === undefined) project.status = 'sammeln';

  state.projects.push(project);
  saveState();
  return project.id;
}

export function updateProject(id, data) {
  const project = findProject(id);
  if (!project) return;
  let changed = false;
  for (const field of PROJECT_FIELDS) {
    if (data[field] !== undefined) {
      project[field] = data[field];
      changed = true;
    }
  }
  if (changed) {
    project.updated_at = now();
    saveState();
  }
}

export const rawProject = (id) => clone(findProject(id));

export function listProjectsForUser(userId) {
  return state.projects
    .filter((project) => state.members.some((member) => member.project_id === project.id && member.user_id === userId))
    .sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
    .map((project) => ({
      ...clone(project),
      member_count: state.members.filter((member) => member.project_id === project.id).length,
    }));
}

// ---- Mitglieder ------------------------------------------------------------
export function addMember(projectId, userId, { role = 'mieter', household, wohnung } = {}) {
  const existing = state.members.find((member) => member.project_id === projectId && member.user_id === userId);
  if (existing) return existing.id;
  const member = {
    id: makeId('m_'),
    project_id: projectId,
    user_id: userId,
    role,
    household: household ?? null,
    wohnung: wohnung ?? null,
    status: 'beigetreten',
    verbrauch: null,
    confirmed: 0,
    joined_at: now(),
  };
  state.members.push(member);
  saveState();
  return member.id;
}

export const getMember = (projectId, userId) =>
  clone(state.members.find((member) => member.project_id === projectId && member.user_id === userId) || null);

export function updateMyMember(projectId, userId, { wohnung, verbrauch, status, confirmed, household }) {
  const member = state.members.find((entry) => entry.project_id === projectId && entry.user_id === userId);
  if (!member) return;
  if (wohnung !== undefined) member.wohnung = wohnung ?? null;
  if (household !== undefined) member.household = household ?? null;
  if (verbrauch !== undefined) member.verbrauch = verbrauch ?? null;
  if (status !== undefined) member.status = status;
  if (confirmed !== undefined) member.confirmed = confirmed ? 1 : 0;
  saveState();
}

// ---- Einladungen -----------------------------------------------------------
export function createInvite(projectId, createdBy, { role = 'mieter', label, email }) {
  const invite = {
    id: makeId('i_'),
    project_id: projectId,
    token: makeId(''),
    role,
    label: label ?? null,
    email: email ?? null,
    created_by: createdBy,
    used_count: 0,
    created_at: now(),
  };
  state.invites.push(invite);
  saveState();
  return clone(invite);
}

export const getInviteByToken = (token) =>
  clone(state.invites.find((invite) => invite.token === token) || null);

export const bumpInvite = (id) => {
  const invite = state.invites.find((entry) => entry.id === id);
  if (!invite) return;
  invite.used_count += 1;
  saveState();
};

// ---- Vorschläge / Verlauf --------------------------------------------------
export function addProposal(projectId, { by_user_id, by_role, by_name, share_pct, quote_pct, params, result, note }) {
  const proposal = {
    id: makeId('pr_'),
    project_id: projectId,
    by_user_id,
    by_role,
    by_name,
    share_pct,
    quote_pct,
    params_json: JSON.stringify(params || {}),
    result_json: JSON.stringify(result || {}),
    note: note ?? null,
    created_at: now(),
  };
  state.proposals.push(proposal);
  saveState();
  return proposal.id;
}

// ---- Zustimmungen ----------------------------------------------------------
export function setConsent(projectId, userId, share_pct, agreed) {
  const existing = state.consents.find((consent) => consent.project_id === projectId && consent.user_id === userId);
  if (existing) {
    existing.share_pct = share_pct;
    existing.agreed = agreed ? 1 : 0;
    existing.created_at = now();
  } else {
    state.consents.push({
      id: makeId('c_'),
      project_id: projectId,
      user_id: userId,
      share_pct,
      agreed: agreed ? 1 : 0,
      created_at: now(),
    });
  }
  saveState();
}

export function clearConsents(projectId) {
  const before = state.consents.length;
  state.consents = state.consents.filter((consent) => consent.project_id !== projectId);
  if (state.consents.length !== before) saveState();
}

// ---- Vollständiger Projektzustand (für REST-Antwort & Socket-Broadcast) ----
export function fullProject(id) {
  const project = findProject(id);
  if (!project) return null;

  const members = projectMembers(id);
  const invites = projectInvites(id);
  const proposals = projectProposals(id).map((proposal) => ({
    ...clone(proposal),
    params: safe(proposal.params_json),
    result: safe(proposal.result_json),
  }));
  const consents = projectConsents(id);

  const active = members.filter((member) => member.status !== 'abgelehnt');
  const consentByUser = Object.fromEntries(consents.map((consent) => [consent.user_id, consent]));
  const agreedCount = active.filter((member) => {
    const consent = consentByUser[member.user_id];
    return consent && consent.agreed && Math.abs(consent.share_pct - project.share_pct) < 0.001;
  }).length;
  const consensus = active.length > 0 && agreedCount === active.length;

  return {
    ...clone(project),
    intake: safe(project.intake_json),
    members: members.map((member) => {
      const user = findUser(member.user_id);
      return {
        id: member.id,
        userId: member.user_id,
        role: member.role,
        name: user?.name || user?.username || user?.email || member.user_id,
        username: user?.username || null,
        email: user?.email || null,
        picture: user?.picture || null,
        household: member.household,
        wohnung: member.wohnung,
        status: member.status,
        verbrauch: member.verbrauch,
        confirmed: !!member.confirmed,
        agreed: !!(consentByUser[member.user_id] && consentByUser[member.user_id].agreed &&
          Math.abs(consentByUser[member.user_id].share_pct - project.share_pct) < 0.001)
      };
    }),
    invites: invites.map((invite) => ({
      id: invite.id,
      token: invite.token,
      role: invite.role,
      label: invite.label,
      email: invite.email,
      used: invite.used_count,
    })),
    proposals,
    consent: { agreedCount, activeCount: active.length, consensus },
  };
}

function safe(value) {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
}

export default null;
