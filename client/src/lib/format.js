// Zahlen-/Währungsformatierung (de-DE)
export const de = (x, dec = 0) =>
  (isFinite(x) ? x : 0).toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const eur = (x, dec = 0) => de(x, dec) + ' €';
export const ct = (x, dec = 2) => de(x, dec) + ' ct';
export const kwh = (x, dec = 0) => de(x, dec) + ' kWh';
export const pct = (x, dec = 1) => (isFinite(x) ? x : 0).toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + ' %';
export const irrText = (r) => (r == null ? 'amortisiert sich nicht im Zeitraum' : pct(r * 100, 1) + ' p.a.');
export const amortText = (a) => (a == null ? '> Betrachtungszeitraum' : de(a, 1) + ' Jahre');
export const dateDE = (s) => { try { return new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return s; } };
