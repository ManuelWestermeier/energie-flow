import { load, persist, getInviteByToken, addMember, bumpInvite, updateProject, logActivity, fullProject } from '../../../_lib/store.js';
import { authUser } from '../../../_lib/auth.js';
import { json, err, readJson } from '../../../_lib/http.js';

export async function onRequestPost({ request, env, params }) {
  const db = await load(env);
  const user = await authUser(request, db);
  if (!user) return err('Nicht angemeldet.', 401);
  const inv = getInviteByToken(db, params.token);
  if (!inv) return err('Einladung nicht gefunden.', 404);
  const body = await readJson(request);
  addMember(db, inv.project_id, user.id, { role: inv.role, household: body.household || user.name, wohnung: body.wohnung });
  bumpInvite(db, inv.id);
  if (inv.role === 'vermieter') updateProject(db, inv.project_id, { status: 'verhandeln' });
  logActivity(db, inv.project_id, { type: 'join', actorName: user.name, text: inv.role === 'vermieter' ? 'ist als Eigentümerseite beigetreten' : 'ist der Hausgemeinschaft beigetreten' });
  await persist(env, db);
  return json(fullProject(db, inv.project_id));
}
