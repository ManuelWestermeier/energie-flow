import { load, persist, getMember, updateProject, fullProject, logActivity } from '../../../_lib/store.js';
import { authUser } from '../../../_lib/auth.js';
import { json, err, readJson } from '../../../_lib/http.js';

export async function onRequest({ request, env, params }) {
  const id = params.id;
  const db = await load(env);
  const user = await authUser(request, db);
  if (!user) return err('Nicht angemeldet.', 401);
  const m = getMember(db, id, user.id);
  if (!m) return err('Kein Zugriff auf dieses Projekt.', 403);

  if (request.method === 'GET') return json(fullProject(db, id, { userId: user.id, role: m.role }));

  if (request.method === 'PATCH') {
    if (!['admin', 'vermieter'].includes(m.role))
      return err('Nur Admin oder Eigentümerseite dürfen die Anlagendaten ändern.', 403);
    const body = await readJson(request);
    const allow = ['name', 'we', 'kwp', 'ertrag', 'invest', 'gvpreis', 'arbeitspreis',
      'einspeise', 'opex', 'versicherung', 'zeitraum', 'feindaten'];
    const patch = {};
    for (const k of allow) if (body[k] !== undefined) patch[k] = body[k];
    updateProject(db, id, patch);
    if ('name' in patch) logActivity(db, id, { type: 'edit', actorName: user.name, text: 'hat das Projekt umbenannt' });
    else logActivity(db, id, { type: 'edit', actorName: user.name, text: body.feindaten ? 'hat Feindaten hinterlegt' : 'hat die Anlagendaten aktualisiert' });
    await persist(env, db);
    return json(fullProject(db, id, { userId: user.id, role: m.role }));
  }

  return err('Methode nicht erlaubt.', 405);
}
