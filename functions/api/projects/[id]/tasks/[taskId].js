import { load, persist, getMember, setTask, logActivity, fullProject } from '../../../../_lib/store.js';
import { authUser } from '../../../../_lib/auth.js';
import { json, err, readJson } from '../../../../_lib/http.js';

export async function onRequestPost({ request, env, params }) {
  const { id, taskId } = params;
  const db = await load(env);
  const user = await authUser(request, db);
  if (!user) return err('Nicht angemeldet.', 401);
  const m = getMember(db, id, user.id);
  if (!m) return err('Kein Zugriff auf dieses Projekt.', 403);

  const body = await readJson(request);
  const done = body.done !== false;
  setTask(db, id, taskId, done, user.name);
  const label = (body.label || 'Aufgabe').toString().slice(0, 120);
  logActivity(db, id, { type: 'task', actorName: user.name, text: (done ? 'hat erledigt: ' : 'hat als offen markiert: ') + label });
  await persist(env, db);
  return json(fullProject(db, id, { userId: user.id, role: m.role }));
}
