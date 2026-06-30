import { load, persist, listProjectsForUser, createProject, addMember, logActivity, fullProject } from '../../_lib/store.js';
import { authUser } from '../../_lib/auth.js';
import { json, err, readJson } from '../../_lib/http.js';

export async function onRequest({ request, env }) {
  const db = await load(env);
  const user = await authUser(request, db);
  if (!user) return err('Nicht angemeldet.', 401);

  if (request.method === 'GET') {
    return json(listProjectsForUser(db, user.id).map((p) => ({
      id: p.id, name: p.name, street: p.street, hausnr: p.hausnr, ort: p.ort,
      status: p.status, share_pct: p.share_pct, members: p.member_count, updated_at: p.updated_at,
      kwp: p.kwp, we: p.we,
    })));
  }

  if (request.method === 'POST') {
    const d = await readJson(request);
    const id = createProject(db, user.id, {
      name: d.name || `Solaranlage ${d.street || ''} ${d.hausnr || ''}`.trim() || 'Solarprojekt',
      street: d.street, hausnr: d.hausnr, plz: d.plz, ort: d.ort, bundesland: d.bundesland,
      eigentum: d.eigentum,
      we: d.we, kwp: d.kwp, ertrag: d.ertrag, invest: d.invest,
      gvpreis: d.gvpreis, arbeitspreis: d.arbeitspreis, einspeise: d.einspeise,
      opex: d.opex, versicherung: d.versicherung, zeitraum: d.zeitraum,
      share_pct: d.share_pct ?? 90,
      intake: d.intake || d,
    });
    addMember(db, id, user.id, { role: 'admin', wohnung: d.wohnung, household: user.name, verbrauch: d.verbrauch });
    logActivity(db, id, { type: 'create', actorName: user.name, text: 'hat das Projekt angelegt' });
    if (Number(d.verbrauch) > 0) logActivity(db, id, { type: 'consumption', actorName: user.name, text: `hat den Jahresverbrauch hinterlegt (${Math.round(Number(d.verbrauch)).toLocaleString('de-DE')} kWh)` });
    await persist(env, db);
    return json(fullProject(db, id, { userId: user.id, role: 'admin' }));
  }

  return err('Methode nicht erlaubt.', 405);
}
