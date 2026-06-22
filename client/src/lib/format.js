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
export const relTime = (s) => {
  try {
    const d = new Date(s).getTime(); const now = Date.now();
    const sec = Math.round((now - d) / 1000);
    if (sec < 60) return 'gerade eben';
    const min = Math.round(sec / 60); if (min < 60) return `vor ${min} Min.`;
    const std = Math.round(min / 60); if (std < 24) return `vor ${std} Std.`;
    const tg = Math.round(std / 24); if (tg < 7) return `vor ${tg} Tg.`;
    return dateDE(s);
  } catch { return dateDE(s); }
};
