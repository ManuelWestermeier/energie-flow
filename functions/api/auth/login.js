import { load } from '../../_lib/store.js';
import { authUser, profile } from '../../_lib/auth.js';
import { json, err } from '../../_lib/http.js';

// Prüft die per Basic-Header gesendeten Zugangsdaten (kein Token, keine Session).
export async function onRequestPost({ request, env }) {
  const db = await load(env);
  const user = await authUser(request, db);
  if (!user) return err('Benutzername oder Passwort falsch.', 401);
  return json(profile(user));
}
