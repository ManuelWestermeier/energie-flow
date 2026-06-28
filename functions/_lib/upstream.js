// Gemeinsamer Helfer für den Planer-Proxy: holt externe Dienste über das
// native globale fetch (Workers-Runtime; KEIN node:https mehr nötig).
const UA = 'EnergieFlow/1.0 (YES! 2026 Wettbewerbsprojekt)';

export async function upstream(url, { method = 'GET', headers = {}, body = null } = {}) {
  const res = await fetch(url, {
    method,
    headers: { 'User-Agent': UA, 'Accept-Language': 'de', ...headers },
    body,
  });
  const text = await res.text();
  return { status: res.status, text };
}
export async function upstreamJson(url, headers) {
  const r = await upstream(url, { headers });
  if (r.status >= 400) throw new Error('Externer Dienst antwortete mit ' + r.status);
  return JSON.parse(r.text);
}
