// ---------------------------------------------------------------------------
//  api.js — REST-Zugriff mit stateless Username/Passwort-Authentifizierung
// ---------------------------------------------------------------------------
const CREDENTIALS_KEY = 'ef_credentials';

export function getCredentials() {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.username || !parsed?.password) return null;
    return { username: String(parsed.username), password: String(parsed.password) };
  } catch {
    return null;
  }
}

export function setCredentials(credentials) {
  if (!credentials?.username || !credentials?.password) {
    localStorage.removeItem(CREDENTIALS_KEY);
    return;
  }
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({
    username: String(credentials.username),
    password: String(credentials.password),
  }));
}

export function clearCredentials() {
  localStorage.removeItem(CREDENTIALS_KEY);
}

function toBasicAuth(username, password) {
  const encoded = new TextEncoder().encode(`${username}:${password}`);
  let binary = '';
  for (const byte of encoded) binary += String.fromCharCode(byte);
  return `Basic ${btoa(binary)}`;
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const credentials = getCredentials();
  if (credentials) headers.Authorization = toBasicAuth(credentials.username, credentials.password);

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }
  if (!res.ok) throw new Error((data && data.error) || `Fehler ${res.status}`);
  return data;
}

export const api = {
  get: (p) => req('GET', p),
  post: (p, b) => req('POST', p, b),
  patch: (p, b) => req('PATCH', p, b),

  // Auth
  login: (username, password) => req('POST', '/auth/login', { username, password }),
  register: (payload) => req('POST', '/auth/register', payload),
  me: () => req('GET', '/auth/me'),

  // Projekte
  createProject: (d) => req('POST', '/api/projects', d),
  listProjects: () => req('GET', '/api/projects'),
  getProject: (id) => req('GET', '/api/projects/' + id),
  patchProject: (id, d) => req('PATCH', '/api/projects/' + id, d),
  confirmMe: (id, d) => req('POST', `/api/projects/${id}/members/me`, d),
  createInvite: (id, d) => req('POST', `/api/projects/${id}/invites`, d),
  inviteInfo: (token) => req('GET', '/api/invites/' + token),
  acceptInvite: (token, d) => req('POST', `/api/invites/${token}/accept`, d),
  propose: (id, d) => req('POST', `/api/projects/${id}/proposals`, d),
  consent: (id, agreed) => req('POST', `/api/projects/${id}/consent`, { agreed }),
};
