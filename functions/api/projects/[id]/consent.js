import { load, persist, getMember, rawProject, setConsent, updateProject, logActivity, fullProject } from '../../../_lib/store.js';
import { authUser } from '../../../_lib/auth.js';
import { json, err, readJson } from '../../../_lib/http.js';

export async function onRequestPost({ request, env, params }) {
  const id = params.id;
  const db = await load(env);
  const user = await authUser(request, db);
  if (!user) return err('Nicht angemeldet.', 401);
  const m = getMember(db, id, user.id);
  if (!m) return err('Kein Zugriff auf dieses Projekt.', 403);

  const body = await readJson(request);
  const p = rawProject(db, id);
  const agreed = body.agreed !== false;
  setConsent(db, id, user.id, p.share_pct, agreed);
  if (agreed) logActivity(db, id, { type: 'consent', actorName: user.name, text: `stimmt ${Math.round(p.share_pct)} % zu` });
  const viewer = { userId: user.id, role: m.role };
  let full = fullProject(db, id, viewer);
  if (full.consent.consensus && p.status !== 'vereinbart') {
    updateProject(db, id, { status: 'vereinbart' });
    logActivity(db, id, { type: 'agreed', actorName: null, text: 'Einigung erreicht – alle Aktiven stimmen dem Preis zu' });
    full = fullProject(db, id, viewer);
  }
  await persist(env, db);
  return json(full);
}
