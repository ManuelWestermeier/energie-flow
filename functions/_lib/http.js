// Kleine Helfer für JSON-Antworten und das Lesen von Request-Bodies.
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
export const err = (message, status = 400) => json({ error: message }, status);
export async function readJson(request) {
  try { return (await request.json()) || {}; } catch { return {}; }
}
