import { Stat } from './ui.jsx';
import { de, eur, ct, pct, irrText, amortText } from '../lib/format.js';
import { Info, CheckCircle2, Sun, Leaf, PiggyBank, TrendingUp } from 'lucide-react';

// Datenstand einschätzen: erste Schätzung vs. gebäudegenaue Auswertung
export function dataQuality(project) {
  const m = project.members || [];
  const tenants = m.filter((x) => x.role !== 'vermieter');
  const confirmed = tenants.filter((x) => x.confirmed && x.verbrauch != null).length;
  const totalWE = +project.we || tenants.length || 8;
  const hasVermieter = m.some((x) => x.role === 'vermieter');
  const enough = confirmed >= Math.ceil(totalWE / 2) && confirmed >= 2;
  const missing = [];
  if (confirmed < totalWE) missing.push(`${totalWE - confirmed} von ${totalWE} Haushalten ohne bestätigten Verbrauch`);
  if (!hasVermieter) missing.push('Eigentümerseite noch nicht beigetreten (Feindaten offen)');
  return { level: enough && hasVermieter ? 'genau' : 'schaetzung', confirmed, totalWE, hasVermieter, missing };
}

export function DataBanner({ project }) {
  const q = dataQuality(project);
  if (q.level === 'genau') {
    return (
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-green-soft text-[13.5px]">
        <CheckCircle2 className="h-4 w-4 text-green-deep shrink-0 mt-0.5" />
        <div className="text-green-ink">
          <strong>Gebäudegenaue Auswertung.</strong> Genug Haushalte haben ihre Daten bestätigt
          und die Eigentümerseite ist dabei – die Zahlen sind belastbar.
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-soft/70 text-[13.5px]">
      <Info className="h-4 w-4 text-amber-deep shrink-0 mt-0.5" />
      <div className="text-ink-soft">
        <strong className="text-ink">Erste Schätzung.</strong> Sie wird genauer, sobald:
        <ul className="mt-1 ml-4 list-disc space-y-0.5">
          {q.missing.map((t, k) => <li key={k}>{t}</li>)}
        </ul>
      </div>
    </div>
  );
}

export function AnalysisGrid({ r, sharePct }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat label="Solarstrompreis" value={ct(r.solarpreis)} tone="green"
              sub={`${pct(sharePct, 0)} des Grundpreises`} />
        <Stat label="Ersparnis je Haushalt" value={`${eur(r.tenantSavingsPerHH)}`} tone="green" sub="pro Jahr" />
        <Stat label="Ersparnis gesamt" value={`${eur(r.tenantSavingsTotal)}`} sub="alle Mieter:innen / Jahr" />
        <Stat label="Überschuss Eigentümer" value={`${eur(r.netto)}`} tone="amber" sub="pro Jahr" />
        <Stat label="Rendite (IRR)" value={r.irr == null ? '—' : pct(r.irr * 100, 1)}
              sub={r.irr == null ? 'rechnet sich im Zeitraum nicht' : 'p.a. über Laufzeit'} />
        <Stat label="Amortisation" value={r.amort == null ? '—' : `${de(r.amort, 1)} J.`} sub={r.amort == null ? '> Zeitraum' : 'bis zur Deckung'} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
        <Mini icon={<Sun className="h-4 w-4" />} label="Direkt genutzt" value={`${de(r.solar)} kWh`} sub={pct(r.direktquote)} />
        <Mini icon={<TrendingUp className="h-4 w-4" />} label="Einspeisung" value={`${de(r.feed)} kWh`} sub="Überschuss" />
        <Mini icon={<PiggyBank className="h-4 w-4" />} label="Erlös direkt" value={`${eur(r.einnSolar)}`} sub="pro Jahr" />
        <Mini icon={<Leaf className="h-4 w-4" />} label="CO₂ vermieden" value={`${de(r.co2)} kg`} sub="pro Jahr" />
      </div>
    </div>
  );
}

function Mini({ icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-line bg-paper/50 p-3">
      <div className="flex items-center gap-1.5 text-ink-faint">{icon}<span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span></div>
      <div className="font-display text-lg text-ink mt-1 tnum">{value}</div>
      <div className="text-[11.5px] text-ink-faint">{sub}</div>
    </div>
  );
}
