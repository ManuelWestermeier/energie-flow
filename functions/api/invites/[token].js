import { load, getInviteByToken, rawProject } from '../../_lib/store.js';
import { json, err } from '../../_lib/http.js';

export async function onRequestGet({ env, params }) {
  const db = await load(env);
  const inv = getInviteByToken(db, params.token);
  if (!inv) return err('Einladung nicht gefunden oder abgelaufen.', 404);
  const p = rawProject(db, inv.project_id);
  return json({ role: inv.role, label: inv.label, project: { id: p.id, name: p.name, street: p.street, hausnr: p.hausnr, ort: p.ort, kwp: p.kwp, we: p.we } });
}
