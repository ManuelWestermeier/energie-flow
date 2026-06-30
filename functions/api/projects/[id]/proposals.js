import { load, persist, getMember, addProposal, getProposal, setProposalStatus, updateProject, clearConsents, logActivity, fullProject } from '../../../_lib/store.js';
import { authUser } from '../../../_lib/auth.js';
import { json, err, readJson } from '../../../_lib/http.js';

const DATA_FIELDS = ['we', 'kwp', 'ertrag', 'invest', 'gvpreis', 'arbeitspreis', 'einspeise', 'opex', 'versicherung', 'zeitraum'];

function cleanPatch(raw = {}) {
  const patch = {};
  for (const k of DATA_FIELDS) if (raw && raw[k] !== undefined && raw[k] !== '' && raw[k] !== null) patch[k] = raw[k];
  return patch;
}

// Vorschlag einreichen (Preis oder Anlagendaten).
// Admin/Eigentümerseite wirken direkt; Mieter erzeugen einen Vorschlag, der auf
// Freigabe durch den Admin wartet und erst dann sichtbar/wirksam wird.
export async function onRequestPost({ request, env, params }) {
  const id = params.id;
  const db = await load(env);
  const user = await authUser(request, db);
  if (!user) return err('Nicht angemeldet.', 401);
  const m = getMember(db, id, user.id);
  if (!m) return err('Kein Zugriff auf dieses Projekt.', 403);
  const viewer = { userId: user.id, role: m.role };
  const canApply = ['admin', 'vermieter'].includes(m.role);
  const body = await readJson(request);
  const kind = body.kind === 'data' ? 'data' : 'price';

  if (kind === 'data') {
    const patch = cleanPatch(body.patch);
    if (Object.keys(patch).length === 0) return err('Kein gültiges Datenfeld im Vorschlag.', 400);
    const status = canApply ? 'approved' : 'pending';
    addProposal(db, id, { kind: 'data', status, by_user_id: user.id, by_role: m.role, by_name: user.name, patch, note: body.note });
    if (canApply) { updateProject(db, id, patch); logActivity(db, id, { type: 'edit', actorName: user.name, text: 'hat die Anlagendaten aktualisiert' }); }
    else logActivity(db, id, { type: 'proposal', actorName: user.name, text: 'schlägt eine Änderung der Anlagendaten vor (wartet auf Freigabe)' });
    await persist(env, db);
    return json(fullProject(db, id, viewer));
  }

  // Preis
  if (typeof body.share_pct !== 'number') return err('Ungültiger Anteil.', 400);
  const status = canApply ? 'approved' : 'pending';
  addProposal(db, id, { kind: 'price', status, by_user_id: user.id, by_role: m.role, by_name: user.name, share_pct: body.share_pct, quote_pct: body.quote_pct, params: body.params, result: body.result, note: body.note });
  if (canApply) {
    updateProject(db, id, { share_pct: body.share_pct, status: 'verhandeln' });
    clearConsents(db, id);
    logActivity(db, id, { type: 'proposal', actorName: user.name, text: `schlägt ${Math.round(body.share_pct)} % des Grundpreises vor` });
  } else {
    logActivity(db, id, { type: 'proposal', actorName: user.name, text: `schlägt ${Math.round(body.share_pct)} % des Grundpreises vor (wartet auf Freigabe)` });
  }
  await persist(env, db);
  return json(fullProject(db, id, viewer));
}

// Vorschlag freigeben/ablehnen – nur der Admin (Projektleitung).
export async function onRequestPatch({ request, env, params }) {
  const id = params.id;
  const db = await load(env);
  const user = await authUser(request, db);
  if (!user) return err('Nicht angemeldet.', 401);
  const m = getMember(db, id, user.id);
  if (!m) return err('Kein Zugriff auf dieses Projekt.', 403);
  if (m.role !== 'admin') return err('Nur die Projektleitung kann Vorschläge freigeben.', 403);
  const viewer = { userId: user.id, role: m.role };

  const { proposalId, decision } = await readJson(request);
  const pr = getProposal(db, id, proposalId);
  if (!pr) return err('Vorschlag nicht gefunden.', 404);
  if ((pr.status || 'approved') !== 'pending') return err('Dieser Vorschlag wurde bereits entschieden.', 409);

  if (decision === 'approve') {
    if (pr.kind === 'data') {
      updateProject(db, id, cleanPatch(pr.patch));
      logActivity(db, id, { type: 'edit', actorName: user.name, text: `hat eine vorgeschlagene Datenänderung von ${pr.by_name} übernommen` });
    } else {
      updateProject(db, id, { share_pct: pr.share_pct, status: 'verhandeln' });
      clearConsents(db, id);
      logActivity(db, id, { type: 'proposal', actorName: user.name, text: `hat ${Math.round(pr.share_pct)} % (Vorschlag von ${pr.by_name}) freigegeben` });
    }
    setProposalStatus(db, id, proposalId, 'approved', user.name);
  } else if (decision === 'reject') {
    setProposalStatus(db, id, proposalId, 'rejected', user.name);
    logActivity(db, id, { type: 'proposal', actorName: user.name, text: `hat einen Vorschlag von ${pr.by_name} abgelehnt` });
  } else {
    return err('Unbekannte Entscheidung.', 400);
  }
  await persist(env, db);
  return json(fullProject(db, id, viewer));
}
