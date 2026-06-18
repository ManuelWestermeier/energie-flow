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
export function scenario(E, { quotePct, sharePct }) {
  const teil = E.we * quotePct / 100;               // teilnehmende Wohneinheiten
  const erz = E.kwp * E.ertrag;                      // Jahreserzeugung kWh
  const evje = 1582.5 * (E.kwp / E.we) / (30 / 8);   // Direktverbrauch je teilnehmender WE
  const raw = teil * evje;
  const cap = erz * E.qmax / 100;                    // Obergrenze Direktverbrauch
  const solar = Math.min(raw, cap);                  // tatsächlich direkt genutzter Solarstrom kWh
  const feed = Math.max(erz - solar, 0);             // Überschuss-Einspeisung kWh

  const solarpreis = E.gvpreis * sharePct / 100;     // ct/kWh
  const einnSolar = solar * solarpreis / 100;        // €/a Erlös aus Direktlieferung
  const einnFeed = feed * E.einspeise / 100;         // €/a Erlös Einspeisung
  const kosten = (E.opex || 0) + (E.versicherung || 0);
  const netto = einnSolar + einnFeed - kosten;       // €/a Nettoüberschuss (Vermieter)

  const tenantSavingsTotal = solar * (E.gvpreis - solarpreis) / 100; // €/a Ersparnis aller Mieter:innen
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

// IRR-Kurve über den Preisanteil – für die Hebel-Visualisierung
export function irrCurve(E, quotePct, from = 60, to = 100, step = 2) {
  const pts = [];
  for (let s = from; s <= to + 1e-6; s += step) {
    const r = scenario(E, { quotePct, sharePct: +s.toFixed(1) }).irr;
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
