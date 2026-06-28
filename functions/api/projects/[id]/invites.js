import { load, persist, getMember, createInvite, fullProject } from '../../../_lib/store.js';
import { authUser } from '../../../_lib/auth.js';
import { json, err, readJson } from '../../../_lib/http.js';

export async function onRequestPost({ request, env, params }) {
  const id = params.id;
  const db = await load(env);
  const user = await authUser(request, db);
  if (!user) return err('Nicht angemeldet.', 401);
  const m = getMember(db, id, user.id);
  if (!m) return err('Kein Zugriff auf dieses Projekt.', 403);
  if (m.role !== 'admin') return err('Nur der/die Admin darf einladen.', 403);

  const { role = 'mieter', label, email } = await readJson(request);
  const invite = createInvite(db, id, user.id, { role, label, email });
  await persist(env, db);
  return json(invite);
}
