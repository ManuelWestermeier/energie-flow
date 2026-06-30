import { load, persist, getMember, updateMyMember, logActivity, fullProject } from '../../../../_lib/store.js';
import { authUser } from '../../../../_lib/auth.js';
import { json, err, readJson } from '../../../../_lib/http.js';

export async function onRequestPost({ request, env, params }) {
  const id = params.id;
  const db = await load(env);
  const user = await authUser(request, db);
  if (!user) return err('Nicht angemeldet.', 401);
  const before = getMember(db, id, user.id);
  if (!before) return err('Kein Zugriff auf dieses Projekt.', 403);

  const { wohnung, household, verbrauch, status, confirmed } = await readJson(request);
  const prevStatus = before.status;          // Werte VOR dem Update sichern (before ist eine Referenz!)
  const prevVerbrauch = before.verbrauch;
  updateMyMember(db, id, user.id, { wohnung, household, verbrauch, status, confirmed });

  // Aussagekräftige Ereignisse protokollieren (jede Angabe wird sichtbar)
  const becameYes = status === 'zugesagt' && prevStatus !== 'zugesagt';
  const withdrew = status && status !== 'zugesagt' && prevStatus === 'zugesagt';
  const vNew = verbrauch === undefined ? prevVerbrauch : (verbrauch === null ? null : Number(verbrauch));
  const vChanged = verbrauch !== undefined && Number(vNew || 0) !== Number(prevVerbrauch || 0);
  if (becameYes) logActivity(db, id, { type: 'commit', actorName: user.name, text: 'sagt der Solargemeinschaft zu' });
  if (withdrew) logActivity(db, id, { type: 'member', actorName: user.name, text: 'hat die Zusage zurückgezogen' });
  if (vChanged && Number(vNew) > 0) logActivity(db, id, { type: 'consumption', actorName: user.name, text: `hat den Jahresverbrauch hinterlegt (${Math.round(Number(vNew)).toLocaleString('de-DE')} kWh)` });
  else if (!becameYes && !withdrew && !vChanged && confirmed) logActivity(db, id, { type: 'member', actorName: user.name, text: 'hat die eigenen Daten bestätigt' });

  await persist(env, db);
  return json(fullProject(db, id, { userId: user.id, role: before.role }));
}
