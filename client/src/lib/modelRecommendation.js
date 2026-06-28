// ===========================================================================
//  modelRecommendation.js — beratende Modellempfehlung GGV ↔ Mieterstrom
//
//  Liefert pro Gebäude eine transparente Empfehlung: Die Plattform analysiert
//  das Gebäude und empfiehlt das passende Modell – die Eigentümerseite
//  entscheidet informiert. Dies ist ein nachvollziehbarer Entscheidungs-Helfer
//  (Faktoren sichtbar), KEINE exakte Renditeberechnung für Mieterstrom: operativ
//  begleitet die Plattform die GGV (die Zahlen dazu liefert economics.js).
//
//  Kennzahlen-Quelle: Ariadne-Analyse „Gebäude- und Mieterstrom in Deutschland“
//  (Fischer/Henger, IW Köln, 2025), Basisvariante 30 kWp / 8 WE — Tabelle 9 und
//  Abbildung 8 (S. 56–58). Interner Zinsfuß: GGV 1,4 % vs. Mieterstrom 3,6 %.
//  Richtungsaussagen (Vollversorger-/Reststrompflicht, vereinfachte Abrechnung,
//  WEG-Eignung, verpflichtende iMSys-Messung, kein Mieterstromzuschlag): Kap. 2.2
//  / Tabelle 3 und Experteneinschätzung S. 79/86.
// ===========================================================================

// Interner Zinsfuß der Ariadne-Basisvariante (% p. a.) – Referenzwerte, nicht
// gebäudegenau für Mieterstrom.
export const REF_IRR = { ggv: 1.4, mieterstrom: 3.6 };

export const OWNER_TYPES = [
  { id: 'privat', label: 'Privat' },
  { id: 'weg', label: 'WEG' },
  { id: 'unternehmen', label: 'Unternehmen' },
];

export function buildingSize(we) {
  const n = Number(we) || 0;
  if (n <= 6) return 'klein';
  if (n <= 12) return 'mittel';
  return 'gross';
}
const SIZE_LABEL = { klein: 'klein', mittel: 'mittel', gross: 'groß' };

// inp: { we, ownerType:'privat'|'weg'|'unternehmen', bearsResidual:bool,
//        wantsZuschlag:bool, keepGewerbe:bool }
export function recommendModel(inp = {}) {
  const we = Number(inp.we) || 8;
  const size = buildingSize(we);
  const ownerType = inp.ownerType || 'privat';
  const bearsResidual = !!inp.bearsResidual;
  const wantsZuschlag = !!inp.wantsZuschlag;
  const keepGewerbe = inp.keepGewerbe !== false; // Standard: ja

  const ggv = []; // { w, text }
  const mst = [];

  // 1) Eigentümertyp
  if (ownerType === 'privat')
    ggv.push({ w: 2, text: 'Privater Kleinvermieter: Mieterstrom verlangt Vollversorgung, Reststrombeschaffung und eine vollständige Energieabrechnung – die GGV vermeidet diese Pflichten.' });
  else if (ownerType === 'weg')
    ggv.push({ w: 2, text: 'Wohnungseigentümergemeinschaft: laut Ariadne „insbesondere für WEG von Interesse“, da Mieter nicht aktiv in einen neuen Vertrag wechseln müssen.' });
  else
    mst.push({ w: 2, text: 'Wohnungs-/Immobilienunternehmen kann Vollversorgung, Reststrombeschaffung und Abrechnung professionell tragen – damit wird Mieterstrom mit seiner höheren Rendite tragfähig.' });

  // 2) Gebäudegröße
  if (size === 'klein') {
    ggv.push({ w: 1, text: `Kleines Gebäude (${we} WE): Mieterstrom skaliert erst mit mehr Wohneinheiten, die niedrigschwellige GGV passt hier eher.` });
    mst.push({ w: 1, text: `Kleines Gebäude (${we} WE): die bei der GGV verpflichtenden intelligenten Messsysteme schlagen anteilig stärker zu Buche (höhere Messkosten, Ariadne).` });
  } else if (size === 'mittel') {
    ggv.push({ w: 1, text: `Mittelgroßes Gebäude (${we} WE): liegt im Bereich, in dem die GGV gut funktioniert.` });
  } else {
    mst.push({ w: 2, text: `Größeres Gebäude (${we} WE): mit mehr Beteiligung und Verbrauch erzielt Mieterstrom meist die höhere Rendite – plus Mieterstromzuschlag.` });
  }

  // 3) Bereitschaft zur Vollversorgung & zum Reststromrisiko
  if (!bearsResidual)
    ggv.push({ w: 2, text: 'Keine Bereitschaft, Vollversorger zu werden und das Reststromrisiko zu tragen – genau das setzt Mieterstrom voraus.' });
  else
    mst.push({ w: 1, text: 'Bereitschaft zur Vollversorgung samt Reststromrisiko ist vorhanden – eine Kernvoraussetzung für Mieterstrom ist erfüllt.' });

  // 4) Mieterstromzuschlag
  if (wantsZuschlag)
    mst.push({ w: 2, text: 'Der Mieterstromzuschlag soll genutzt werden – den gibt es ausschließlich im Mieterstrommodell.' });
  else
    ggv.push({ w: 1, text: 'Kein Fokus auf den Mieterstromzuschlag – die GGV kommt ohne diese Förderung aus und erlaubt dafür eine freie Preisgestaltung.' });

  // 5) Gewerbesteuer (erweiterte Kürzung) – v. a. für private Vermieter relevant
  if (keepGewerbe && ownerType === 'privat')
    ggv.push({ w: 2, text: 'Erhalt der erweiterten Gewerbesteuerkürzung wichtig: gewerblicher Stromverkauf (Mieterstrom) kann sie gefährden, die GGV ist hier unkritischer.' });

  const sum = (arr) => arr.reduce((a, b) => a + b.w, 0);
  const gScore = sum(ggv);
  const mScore = sum(mst);
  const diff = gScore - mScore;

  let pick = 'knapp';
  if (diff >= 2) pick = 'ggv';
  else if (diff <= -2) pick = 'mieterstrom';

  // Deutlichkeit der Empfehlung (ohne Pseudo-Genauigkeit zu suggerieren)
  const margin = Math.abs(diff);
  const strength = pick === 'knapp' ? 'knapp' : margin >= 4 ? 'deutlich' : 'tendenziell';

  return {
    pick, strength, size, sizeLabel: SIZE_LABEL[size], we,
    reasonsGGV: ggv.sort((a, b) => b.w - a.w).map((r) => r.text),
    reasonsMST: mst.sort((a, b) => b.w - a.w).map((r) => r.text),
    refIrr: REF_IRR,
    inputs: { ownerType, bearsResidual, wantsZuschlag, keepGewerbe },
  };
}
