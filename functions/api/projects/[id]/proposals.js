import { load, persist, getMember, addProposal, updateProject, clearConsents, logActivity, fullProject } from '../../../_lib/store.js';
import { authUser } from '../../../_lib/auth.js';
import { json, err, readJson } from '../../../_lib/http.js';

export async function onRequestPost({ request, env, params }) {
  const id = params.id;
  const db = await load(env);
  const user = await authUser(request, db);
  if (!user) return err('Nicht angemeldet.', 401);
  const m = getMember(db, id, user.id);
  if (!m) return err('Kein Zugriff auf dieses Projekt.', 403);

  const { share_pct, quote_pct, params: p, result, note } = await readJson(request);
  if (typeof share_pct !== 'number') return err('Ungültiger Anteil.', 400);
  addProposal(db, id, { by_user_id: user.id, by_role: m.role, by_name: user.name, share_pct, quote_pct, params: p, result, note });
  updateProject(db, id, { share_pct, status: 'verhandeln' });
  clearConsents(db, id);
  logActivity(db, id, { type: 'proposal', actorName: user.name, text: `schlägt ${Math.round(share_pct)} % des Grundpreises vor` });
  await persist(env, db);
  return json(fullProject(db, id));
}
