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
  const isOwnerSide = inv.role === 'vermieter';
  const verbrauch = isOwnerSide ? null : body.verbrauch;
  addMember(db, inv.project_id, user.id, { role: inv.role, household: body.household || user.name, wohnung: body.wohnung, verbrauch });
  bumpInvite(db, inv.id);
  if (isOwnerSide) updateProject(db, inv.project_id, { status: 'verhandeln' });
  const joinText = inv.role === 'vermieter' ? 'ist als Eigentümerseite beigetreten'
    : inv.role === 'selbstnutzer' ? 'ist als selbstnutzender Eigentümer beigetreten'
    : 'ist der Hausgemeinschaft beigetreten';
  logActivity(db, inv.project_id, { type: 'join', actorName: user.name, text: joinText });
  if (Number(verbrauch) > 0) logActivity(db, inv.project_id, { type: 'consumption', actorName: user.name, text: `hat den Jahresverbrauch hinterlegt (${Math.round(Number(verbrauch)).toLocaleString('de-DE')} kWh)` });
  await persist(env, db);
  return json(fullProject(db, inv.project_id, { userId: user.id, role: inv.role }));
}
