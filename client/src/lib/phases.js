// ===========================================================================
//  phases.js – Der Projekt-Fahrplan (Signature-Element „Flussschiene")
//  Sechs Phasen von der Initiative bis zur Modell-Empfehlung. Aufgaben sind entweder
//  „auto" (werden aus dem Projektzustand erkannt) oder manuell (Häkchen, das
//  serverseitig gespeichert wird).
// ===========================================================================
import { committedQuote, consumptionStats } from './economics.js';

const hasInvite = (p, role) => (p.invites || []).some((i) => i.role === role);
const hasMember = (p, role) => (p.members || []).some((m) => m.role === role);

export const PHASES = [
  {
    id: 'initiative', n: 1, title: 'Initiative ergreifen', to: 'gebaeude',
    summary: 'Projekt aufsetzen und die Ausgangslage des Hauses erfassen.',
    tasks: [
      { id: 'created', label: 'Projekt angelegt', auto: () => true },
      { id: 'building', label: 'Gebäude- & Anlagendaten geprüft', to: 'gebaeude', hint: 'Unter „Gebäude & Anlage“ Werte sichten und ergänzen.' },
      { id: 'firstcheck', label: 'Erste Wirtschaftlichkeit angesehen', to: 'wirtschaftlichkeit', hint: 'Die Schätzung auf der Seite „Wirtschaftlichkeit“.' },
    ],
  },
  {
    id: 'community', n: 2, title: 'Hausgemeinschaft bilden', to: 'gemeinschaft',
    summary: 'Nachbarn gewinnen – je mehr mitmachen, desto stärker die Position.',
    tasks: [
      { id: 'invited', label: 'Nachbarn eingeladen', auto: (p) => hasInvite(p, 'mieter'), to: 'gemeinschaft' },
      { id: 'quote50', label: 'Mindestens 50 % der Wohnungen sagen zu', auto: (p) => committedQuote(p) >= 50, to: 'gemeinschaft' },
      { id: 'confirmed', label: 'Haushaltsdaten gesammelt', auto: (p) => { const c = consumptionStats(p); return c.tenants > 0 && c.reported >= Math.ceil(c.tenants * 0.5); }, to: 'gemeinschaft', hint: 'Verbrauchswerte machen die Analyse gebäudegenau.' },
    ],
  },
  {
    id: 'owner', n: 3, title: 'Eigentümerseite gewinnen', to: 'gemeinschaft',
    summary: 'Die Eigentümerseite mit einem fertigen, fairen Vorschlag ansprechen.',
    tasks: [
      { id: 'ownerinvited', label: 'Eigentümer eingeladen', auto: (p) => hasInvite(p, 'vermieter'), to: 'gemeinschaft' },
      { id: 'letter', label: 'Anschreiben an Eigentümerseite erstellt', to: 'dokumente', hint: 'Wird unter „Dokumente“ als Word-Datei erzeugt.' },
      { id: 'ownerjoined', label: 'Eigentümer beigetreten', auto: (p) => hasMember(p, 'vermieter'), to: 'gemeinschaft' },
    ],
  },
  {
    id: 'feindaten', n: 4, title: 'Feindaten einholen', to: 'gebaeude',
    summary: 'Aus Schätzwerten werden belastbare Zahlen – Angebot und Dachdaten.',
    tasks: [
      { id: 'feindaten', label: 'Genaue Anlagendaten / Angebot hinterlegt', auto: (p) => !!p.feindaten, to: 'gebaeude' },
      { id: 'recalc', label: 'Wirtschaftlichkeit auf Feindaten geprüft', to: 'wirtschaftlichkeit', hint: 'Zahlen nach Eingang der Feindaten erneut ansehen.' },
    ],
  },
  {
    id: 'negotiation', n: 5, title: 'Verhandeln & einigen', to: 'verhandlung',
    summary: 'Einen Preis finden, der für beide Seiten trägt – und ihn bestätigen.',
    tasks: [
      { id: 'proposed', label: 'Preis verhandelt', auto: (p) => (p.proposals || []).some((pr) => (pr.kind || 'price') === 'price' && (pr.status || 'approved') === 'approved'), to: 'verhandlung' },
      { id: 'consensus', label: 'Alle Aktiven stimmen dem Preis zu', auto: (p) => !!(p.consent && p.consent.consensus), to: 'verhandlung' },
    ],
  },
  {
    id: 'recommendation', n: 6, title: 'Modell empfehlen & entscheiden', to: 'wirtschaftlichkeit',
    summary: 'Beide Modelle vergleichen, die Empfehlung als Unterlage erzeugen und gemeinsam entscheiden.',
    tasks: [
      { id: 'compared', label: 'Beide Modelle (GGV & Mieterstrom) verglichen', to: 'wirtschaftlichkeit', hint: 'Der Modellvergleich auf der Seite „Wirtschaftlichkeit“.' },
      { id: 'analysis', label: 'Wirtschaftlichkeitsanalyse als Unterlage erzeugt', to: 'dokumente', hint: 'Unter „Dokumente“ als Word-Datei für die Eigentümerseite.' },
      { id: 'decided', label: 'Modellentscheidung getroffen', hint: 'Die Eigentümerseite wählt GGV oder Mieterstrom.' },
    ],
  },
];

export const isAuto = (t) => typeof t.auto === 'function';
export const taskDone = (t, p) => (isAuto(t) ? !!t.auto(p) : !!(p.tasks && p.tasks[t.id] && p.tasks[t.id].done));
export const phaseCounts = (ph, p) => ({ done: ph.tasks.filter((t) => taskDone(t, p)).length, total: ph.tasks.length });
export const phaseComplete = (ph, p) => ph.tasks.every((t) => taskDone(t, p));

export function overall(p) {
  const total = PHASES.reduce((s, ph) => s + ph.tasks.length, 0);
  const done = PHASES.reduce((s, ph) => s + phaseCounts(ph, p).done, 0);
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
export function currentPhase(p) {
  return PHASES.find((ph) => !phaseComplete(ph, p)) || PHASES[PHASES.length - 1];
}
export function nextActions(p, max = 4) {
  const out = [];
  for (const ph of PHASES) {
    for (const t of ph.tasks) {
      if (!taskDone(t, p) && !isAuto(t)) out.push({ ...t, phase: ph });
      if (out.length >= max) return out;
    }
  }
  return out;
}
