// ===========================================================================
//  economics.js — Wirtschafts-Engine (verifiziert, reproduziert Ariadne)
//  Quelle: Ariadne-Analyse „Gebäude- und Mieterstrom" (Fischer/Henger, IW Köln,
//  Sept. 2025), Referenzfall 30 kWp / 8 Wohneinheiten.
//
//  Zwei Hebel der Verhandlung:
//   • quotePct  – Beteiligungsquote im Haus (% der Wohneinheiten)
//   • sharePct  – Solarstrompreis als Anteil des Grundversorgungstarifs
//
//  Wichtig (Rechtslage): Die 90-%-Grenze ist die Mieterstrom-Vorgabe nach
//  §42a Abs. 4 EnWG. Für die GGV nach §42b EnWG gilt FREIE Preisgestaltung –
//  §42b verweist nur auf §42a Abs. 2 und 3, nicht auf Abs. 4. 90 % nutzen wir
//  daher als freiwilligen Fairness-Maßstab, nach unten und oben verhandelbar.
// ===========================================================================

export const REGIONS = {
  'Baden-Württemberg': 980, 'Bayern': 980, 'Berlin': 920, 'Brandenburg': 930,
  'Bremen': 880, 'Hamburg': 880, 'Hessen': 930, 'Mecklenburg-Vorpommern': 920,
  'Niedersachsen': 890, 'Nordrhein-Westfalen': 900, 'Rheinland-Pfalz': 950,
  'Saarland': 960, 'Sachsen': 940, 'Sachsen-Anhalt': 940,
  'Schleswig-Holstein': 900, 'Thüringen': 940,
};

const ORIENT_F = { sued: 1.0, 'so-sw': 0.95, 'ost-west': 0.85, nord: 0.72, flach: 0.9 };
const SHADE_F = { keine: 1.0, gering: 0.96, teilweise: 0.86, stark: 0.72 };

// Vorschläge für den Rechner
export const suggestErtrag = (d) =>
  Math.round((REGIONS[d.bundesland] || 900) * (ORIENT_F[d.ausrichtung] || 0.95) * (SHADE_F[d.verschattung] || 1.0));
export const suggestKwp = (d) => {
  const byWe = Math.round((+d.we || 8) * 3.75);
  const byArea = d.dachflaeche ? Math.floor(+d.dachflaeche / 5.5) : null;
  return Math.max(5, byArea ? Math.min(byWe, byArea) : byWe);
};
export const suggestInvest = (kwp) => Math.round(2075 * (+kwp || 30)); // €/kWp inkl. Speicher & Montage
export const suggestOpex = (kwp) => Math.round(20 * (+kwp || 30));     // Betriebskosten €/a

// Finanzmathematik
export function annuity(P, r, n) { return r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n)); }
export function irr(inv, cf, years) {
  if (cf <= 0 || cf * years < inv) return null;     // amortisiert sich nicht im Zeitraum
  const npv = (r) => { let s = -inv; for (let t = 1; t <= years; t++) s += cf / Math.pow(1 + r, t); return s; };
  if (npv(0) < 0) return null;
  let lo = 0, hi = 1;
  for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (npv(m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

// Engine-Parameter aus einem Projekt ableiten (mit sinnvollen Defaults)
export function paramsFromProject(p = {}) {
  const we = +p.we || 8;
  const kwp = +p.kwp || 30;
  return {
    we, kwp,
    ertrag: +p.ertrag || 900,
    invest: +p.invest || suggestInvest(kwp),
    gvpreis: +p.gvpreis || 35,            // Grundversorgung ct/kWh
    einspeise: +p.einspeise || 6.88,      // BNetzA Einspeisevergütung ct/kWh
    opex: p.opex != null ? +p.opex : suggestOpex(kwp),
    versicherung: p.versicherung != null ? +p.versicherung : 200, // Ariadne-Basis enthält dies NICHT
    zeitraum: +p.zeitraum || 20,
    qmax: +p.qmax || 40.7,                // max. Direktverbrauchsquote (Ariadne)
  };
}

// Kernberechnung
export function scenario(E, { quotePct, sharePct, consumptionFactor = 1 }) {
  const teil = E.we * quotePct / 100;               // teilnehmende Wohneinheiten
  const erz = E.kwp * E.ertrag;                      // Jahreserzeugung kWh
  const evjeBase = 1582.5 * (E.kwp / E.we) / (30 / 8); // Direktverbrauch je WE bei Referenzverbrauch (2500 kWh)
  const evje = evjeBase * (consumptionFactor || 1);  // skaliert mit dem real gemeldeten Mieterverbrauch
  const raw = teil * evje;
  const cap = erz * E.qmax / 100;                    // Obergrenze Direktverbrauch
  const solar = Math.min(raw, cap);                  // tatsächlich direkt genutzter Solarstrom kWh
  const feed = Math.max(erz - solar, 0);             // Überschuss-Einspeisung kWh

  const solarpreis = E.gvpreis * sharePct / 100;     // ct/kWh
  const einnSolar = solar * solarpreis / 100;        // €/a Erlös aus Direktlieferung
  const einnFeed = feed * E.einspeise / 100;         // €/a Erlös Einspeisung
  const kosten = (E.opex || 0) + (E.versicherung || 0);
  const netto = einnSolar + einnFeed - kosten;       // €/a Nettoüberschuss (Vermieter)

  const tenantSavingsTotal = solar * (E.gvpreis - solarpreis) / 100; // €/a Ersparnis aller Mieter
  return {
    teil, erz, evje, solar, feed, solarpreis,
    einnSolar, einnFeed, kosten, netto,
    irr: irr(E.invest, netto, E.zeitraum),
    amort: netto > 0 ? E.invest / netto : null,
    direktquote: erz > 0 ? (solar / erz) * 100 : 0,
    autarkie: raw > 0 ? (solar / raw) * 100 : 0,
    tenantSavingsTotal,
    tenantSavingsPerHH: teil > 0 ? tenantSavingsTotal / teil : 0,
    co2: solar * 0.38,                               // kg CO₂/a vermieden (Strommix)
  };
}

// IRR-Kurve über den Preisanteil – für die Hebel-Visualisierung (modell-fähig)
export function irrCurve(E, quotePct, from = 60, to = 100, step = 2, consumptionFactor = 1, model = 'ggv') {
  const pts = [];
  for (let s = from; s <= to + 1e-6; s += step) {
    const r = modelScenario(E, { quotePct, sharePct: +s.toFixed(1), consumptionFactor }, model).irr;
    pts.push({ share: +s.toFixed(1), irr: r == null ? null : +(r * 100).toFixed(2) });
  }
  return pts;
}

// Beteiligungsquote aus den Mitgliedern ableiten
export function committedQuote(project) {
  const m = project.members || [];
  const we = +project.we || m.length || 8;
  const ja = m.filter((x) => x.role !== 'vermieter' && x.status === 'zugesagt').length;
  return Math.min(100, Math.round((ja / we) * 100));
}

// Referenzverbrauch je Wohneinheit (Ariadne/Stromspiegel-Basis) – Kalibrierpunkt der Engine
export const CONS_REF = 2500;

// Verbrauchslage aus den Mitgliedern ableiten (für die verbrauchsabhängige Rechnung)
export function consumptionStats(project) {
  const m = (project.members || []).filter((x) => x.role !== 'vermieter');
  const committed = m.filter((x) => x.status === 'zugesagt');
  const reported = m.filter((x) => Number(x.verbrauch) > 0);
  const basis = committed.length ? committed : m;          // Schnitt über Zusagen, sonst alle Mietparteien
  const vals = basis.map((x) => (Number(x.verbrauch) > 0 ? Number(x.verbrauch) : CONS_REF));
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : CONS_REF;
  return {
    tenants: m.length,
    committed: committed.length,
    reported: reported.length,
    totalReported: reported.reduce((a, b) => a + Number(b.verbrauch), 0),
    avg,
    factor: avg / CONS_REF,                                 // 1,0 = Referenz; >1 = mehr Verbrauch → mehr Direktnutzung
    anyReported: reported.length > 0,
  };
}

// Geschätzter Eigenverbrauch eines einzelnen Haushalts (kWh/a) – für die Live-Vorschau.
// Anker: bei CONS_REF entspricht es dem Ariadne-Wert je WE; nie mehr als der eigene Verbrauch.
export function selfPerHousehold(E, consumptionKwh) {
  const c = consumptionKwh || CONS_REF;
  const evjeBase = 1582.5 * ((+E.kwp || 30) / (+E.we || 8)) / (30 / 8);
  return Math.min(evjeBase * (c / CONS_REF), c);
}

// ===========================================================================
//  Mieterstrom-Modell (Dual-Ausbau) — zusätzlich zur GGV.
//
//  Physik identisch zur GGV (gleiche Anlage, gleicher Direktverbrauch). Der
//  Unterschied liegt in den Erlösen: Beim Mieterstrom ist der Betreiber
//  Vollversorger und erhält zusätzlich (a) den Mieterstromzuschlag auf den
//  direkt gelieferten PV-Strom und (b) eine Nettomarge aus der Reststrom-
//  Vollversorgung (inkl. Grundgebühr), abzüglich Netzstromeinkauf.
//
//  Kalibrierung an der Ariadne-Basisvariante (Tabelle 9, 30 kWp / 8 WE):
//   • Mieterstromzuschlag 230,73 € / 10.989 kWh direkt ≈ 2,1 ct/kWh
//   • Reststrom-Nettomarge (Weiterverkauf + Grundgebühr − Einkauf − Grundgebühr):
//     1.734,08 + 900 − 1.871,70 − 150 = 612,38 € / 8 WE ≈ 76,5 €/teiln. Haushalt p. a.
//  Damit reproduziert das Modell bei Ariadne-Eingaben den dortigen
//  Mieterstrom-Überschuss (4.438 €) und internen Zinsfuß (3,6 %).
//  Hinweis: Der Mieterstromzuschlag ist anlagengrößenabhängig gestaffelt; 2,1 ct
//  ist der an der Basisvariante kalibrierte Wert.
// ===========================================================================
export const MS_ZUSCHLAG_CT = 2.1;       // ct/kWh auf direkt gelieferten PV-Strom
export const MS_RESTSTROM_MARGE_HH = 76.5; // €/a Nettomarge je teilnehmendem Haushalt

export function scenarioMieterstrom(E, opts) {
  const g = scenario(E, opts);                         // gleiche PV-Physik wie GGV
  const zuschlag = g.solar * MS_ZUSCHLAG_CT / 100;     // €/a Mieterstromzuschlag
  const reststrom = g.teil * MS_RESTSTROM_MARGE_HH;    // €/a Nettomarge Vollversorgung
  const netto = g.netto + zuschlag + reststrom;
  return {
    ...g,
    model: 'mieterstrom',
    zuschlag, reststrom,
    netto,
    irr: irr(E.invest, netto, E.zeitraum),
    amort: netto > 0 ? E.invest / netto : null,
  };
}

// Beide Modelle für dieselbe Anlage/dasselbe Szenario nebeneinander.
export function compareModels(E, opts) {
  return {
    ggv: { ...scenario(E, opts), model: 'ggv' },
    mieterstrom: scenarioMieterstrom(E, opts),
  };
}

// Einzelnes Szenario je nach gewähltem Modell.
export function modelScenario(E, opts, model = 'ggv') {
  return model === 'mieterstrom' ? scenarioMieterstrom(E, opts) : { ...scenario(E, opts), model: 'ggv' };
}
