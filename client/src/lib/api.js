// ---------------------------------------------------------------------------
//  api.js — REST-Zugriff (Token aus localStorage)
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'ef_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) headers.Authorization = 'Bearer ' + t;
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && data.error) || `Fehler ${res.status}`);
  return data;
}

export const api = {
  get: (p) => req('GET', p),
  post: (p, b) => req('POST', p, b),
  patch: (p, b) => req('PATCH', p, b),

  // Auth
  authConfig: () => req('GET', '/auth/config'),
  devLogin: (email, name) => req('POST', '/auth/dev', { email, name }),
  me: () => req('GET', '/api/me'),

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
