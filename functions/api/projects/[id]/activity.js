import { load, getMember, listActivity } from '../../../_lib/store.js';
import { authUser } from '../../../_lib/auth.js';
import { json, err } from '../../../_lib/http.js';

export async function onRequestGet({ request, env, params }) {
  const db = await load(env);
  const user = await authUser(request, db);
  if (!user) return err('Nicht angemeldet.', 401);
  if (!getMember(db, params.id, user.id)) return err('Kein Zugriff auf dieses Projekt.', 403);
  return json(listActivity(db, params.id, 200));
}
