// ---------------------------------------------------------------------------
//  api.js – REST-Zugriff über HTTP Basic (Benutzername + Passwort)
//
//  Es gibt KEINE Tokens und KEINE Sessions. Nach erfolgreicher Anmeldung werden
//  die Zugangsdaten (als base64 „user:pass") in der sessionStorage gehalten und
//  bei jeder Anfrage im Header  Authorization: Basic ...  mitgesendet. Beim
//  Schließen des Tabs sind sie wieder weg.
// ---------------------------------------------------------------------------
const CRED_KEY = 'ef_basic';

// UTF-8-sicheres base64 (für Umlaute in Name/Passwort)
const toB64 = (s) => btoa(unescape(encodeURIComponent(s)));

export const setCredentials = (username, password) => sessionStorage.setItem(CRED_KEY, toB64(`${username}:${password}`));
export const clearCredentials = () => sessionStorage.removeItem(CRED_KEY);
export const getBasic = () => sessionStorage.getItem(CRED_KEY);
export const hasCredentials = () => !!getBasic();

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const basic = getBasic();
  if (basic) headers.Authorization = 'Basic ' + basic;
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401) clearCredentials();
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && data.error) || `Fehler ${res.status}`);
  return data;
}

export const api = {
  get: (p) => req('GET', p),
  post: (p, b) => req('POST', p, b),
  patch: (p, b) => req('PATCH', p, b),

  // Authentifizierung
  register: (username, password, name) => req('POST', '/api/auth/register', { username, password, name }),
  login: () => req('POST', '/api/auth/login'),   // prüft die gespeicherten Zugangsdaten
  me: () => req('GET', '/api/auth/me'),

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
  proposeData: (id, patch, note) => req('POST', `/api/projects/${id}/proposals`, { kind: 'data', patch, note }),
  decideProposal: (id, proposalId, decision) => req('PATCH', `/api/projects/${id}/proposals`, { proposalId, decision }),
  consent: (id, agreed) => req('POST', `/api/projects/${id}/consent`, { agreed }),
  toggleTask: (id, taskId, done, label) => req('POST', `/api/projects/${id}/tasks/${taskId}`, { done, label }),
  activity: (id) => req('GET', `/api/projects/${id}/activity`),
};
