import { load } from '../../_lib/store.js';
import { authUser, profile } from '../../_lib/auth.js';
import { json, err } from '../../_lib/http.js';

export async function onRequestGet({ request, env }) {
  const db = await load(env);
  const user = await authUser(request, db);
  if (!user) return err('Nicht angemeldet.', 401);
  return json(profile(user));
}
