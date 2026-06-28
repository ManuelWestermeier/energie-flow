import { load, persist, getUserByUsername, createUser } from '../../_lib/store.js';
import { hashPassword, profile, USERNAME_RE } from '../../_lib/auth.js';
import { json, err, readJson } from '../../_lib/http.js';

export async function onRequestPost({ request, env }) {
  const { username, password, name } = await readJson(request);
  if (!username || !USERNAME_RE.test(username))
    return err('Benutzername: 3–32 Zeichen, nur Buchstaben, Ziffern, . _ -', 400);
  if (!password || String(password).length < 6)
    return err('Das Passwort muss mindestens 6 Zeichen haben.', 400);
  const db = await load(env);
  if (getUserByUsername(db, username))
    return err('Dieser Benutzername ist bereits vergeben.', 409);
  const passwordHash = await hashPassword(String(password));
  const user = createUser(db, { username, name: (name || '').trim() || username, passwordHash });
  await persist(env, db);
  return json(profile(user), 201);
}
