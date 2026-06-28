import { useState, useMemo } from 'react';
import { Scale, Building2, CheckCircle2, Sparkles } from 'lucide-react';
import { InfoNote } from './ui.jsx';
import { recommendModel, OWNER_TYPES } from '../lib/modelRecommendation.js';
import { pct } from '../lib/format.js';

// Beratendes Empfehlungs-Feature: empfiehlt je Gebäude GGV oder Mieterstrom.
// Die Faktoren sind lokale Eingaben (nichts wird gespeichert) – die GGV bleibt
// operativ das Rückgrat der Plattform.
export default function ModelRecommendation({ we }) {
  const [ownerType, setOwnerType] = useState('privat');
  const [bearsResidual, setBearsResidual] = useState(false);
  const [wantsZuschlag, setWantsZuschlag] = useState(false);
  const [keepGewerbe, setKeepGewerbe] = useState(true);

  const rec = useMemo(
    () => recommendModel({ we, ownerType, bearsResidual, wantsZuschlag, keepGewerbe }),
    [we, ownerType, bearsResidual, wantsZuschlag, keepGewerbe],
  );

  const isGGV = rec.pick === 'ggv';
  const isMST = rec.pick === 'mieterstrom';
  const verdictName = isGGV ? 'Gemeinschaftliche Gebäudeversorgung (GGV)'
    : isMST ? 'Mieterstrom' : 'Beide Modelle vertretbar';
  const strengthText = rec.pick === 'knapp'
    ? 'knappe Entscheidung – beide Modelle sind hier vertretbar'
    : rec.strength === 'deutlich' ? 'deutliche Empfehlung' : 'tendenzielle Empfehlung';

  const verdictTint = isGGV ? 'bg-grass-soft/45 border-grass/30'
    : isMST ? 'bg-sun-soft/45 border-sun/30' : 'bg-paper-2 border-line';
  const verdictText = isGGV ? 'text-grass-deep' : isMST ? 'text-sun-deep' : 'text-ink';

  const backbone = isGGV
    ? { tone: 'info', text: <>Für dieses Gebäude ist die GGV zugleich das <strong>operative Rückgrat</strong> dieser Plattform – die Szenarien unten rechnen die GGV.</> }
    : isMST
      ? { tone: 'sun', text: <>Für dieses Gebäude wäre <strong>Mieterstrom</strong> voraussichtlich renditestärker. Diese Plattform begleitet operativ die <strong>GGV</strong>; die Modellwahl trefft ihr informiert. Die Szenarien unten zeigen die GGV-Variante.</> }
      : { tone: 'info', text: <>Beide Modelle sind hier vertretbar. Operativ begleitet die Plattform die <strong>GGV</strong> (Szenarien unten); Mieterstrom ist die renditeorientierte Alternative.</> };

  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2"><Scale className="h-4 w-4 text-grass-deep" /><h3>Welches Modell passt zu diesem Gebäude?</h3></div>
          <p className="text-[13px] text-ink-soft mt-0.5">Die Plattform empfiehlt – ihr entscheidet informiert. Pro Gebäude ist es ein Trade-off, kein Sowohl-als-auch.</p>
        </div>
        <span className="shrink-0 rounded-pill bg-grass-soft text-grass-deep text-2xs font-semibold px-2.5 py-1">beratend</span>
      </div>

      {/* Annahmen (lokale Eingaben, nichts wird gespeichert) */}
      <div className="rounded-xl bg-paper-2 border border-line p-3.5 space-y-3">
        <div className="flex items-center gap-2 text-2xs text-ink-faint"><Building2 className="h-3.5 w-3.5" /> Annahmen zum Gebäude · Größe kommt aus den Projektdaten ({rec.we} WE, {rec.sizeLabel})</div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-ink-soft">Eigentümer:</span>
            <div className="flex rounded-pill border border-line p-0.5 text-2xs">
              {OWNER_TYPES.map((o) => (
                <button key={o.id} onClick={() => setOwnerType(o.id)}
                  className={`px-2.5 py-1 rounded-pill font-semibold ${ownerType === o.id ? 'bg-grass-soft text-grass-deep' : 'text-ink-soft'}`}>{o.label}</button>
              ))}
            </div>
          </div>
          <Toggle label="Vollversorgung & Reststromrisiko tragen" value={bearsResidual} onChange={setBearsResidual} />
          <Toggle label="Mieterstromzuschlag gewünscht" value={wantsZuschlag} onChange={setWantsZuschlag} />
          {ownerType === 'privat' && (
            <Toggle label="Erweiterte Gewerbesteuerkürzung erhalten" value={keepGewerbe} onChange={setKeepGewerbe} />
          )}
        </div>
      </div>

      {/* Empfehlung */}
      <div className={`rounded-xl border p-4 ${verdictTint}`}>
        <div className="flex items-center gap-1.5 text-2xs uppercase tracking-wide text-ink-faint mb-1"><Sparkles className="h-3.5 w-3.5" /> Empfehlung für dieses Gebäude</div>
        <div className={`font-display font-bold text-lg leading-tight ${verdictText}`}>{verdictName}</div>
        <div className="text-[13px] text-ink-soft mt-0.5">{strengthText}</div>
      </div>

      {/* Begründung: zwei Spalten */}
      <div className="grid md:grid-cols-2 gap-3">
        <ReasonList tone="grass" title="Spricht für die GGV" items={rec.reasonsGGV} />
        <ReasonList tone="sun" title="Spricht für Mieterstrom" items={rec.reasonsMST} />
      </div>

      {/* Referenz-Einordnung */}
      <div className="rounded-lg bg-paper-2 border border-line px-3.5 py-2.5 text-[13px] text-ink-soft">
        Zur Einordnung – interner Zinsfuß der Ariadne-Basisvariante (8 WE / 30 kWp):
        GGV <strong className="tnum text-ink">{pct(rec.refIrr.ggv, 1)}</strong> · Mieterstrom <strong className="tnum text-ink">{pct(rec.refIrr.mieterstrom, 1)}</strong>.
        Die konkreten GGV-Zahlen für dieses Gebäude stehen unten; die niedrigere Rendite ist der bewusste Preis für die niedrigere Hürde.
      </div>

      <InfoNote tone={backbone.tone}>{backbone.text}</InfoNote>
    </section>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center gap-2 text-[13px] text-ink-soft">
      <span className={`relative inline-flex h-5 w-9 items-center rounded-pill transition-colors ${value ? 'bg-grass' : 'bg-line'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
      {label}
    </button>
  );
}

function ReasonList({ tone, title, items }) {
  const dot = tone === 'grass' ? 'bg-grass' : 'bg-sun';
  const head = tone === 'grass' ? 'text-grass-deep' : 'text-sun-deep';
  return (
    <div className="rounded-xl border border-line p-3.5">
      <div className="flex items-center gap-1.5 mb-2"><CheckCircle2 className={`h-4 w-4 ${head}`} /><h4 className={`text-[13.5px] font-semibold ${head}`}>{title}</h4></div>
      {items.length === 0
        ? <p className="text-[13px] text-ink-faint">– für dieses Gebäude kein klarer Punkt –</p>
        : (
          <ul className="space-y-1.5">
            {items.map((t, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-ink-soft leading-snug">
                <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />{t}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
