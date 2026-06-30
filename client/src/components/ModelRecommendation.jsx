import { useState, useMemo } from 'react';
import { Scale, Building2, CheckCircle2, Sparkles } from 'lucide-react';
import { InfoNote } from './ui.jsx';
import { recommendModel, OWNER_TYPES } from '../lib/modelRecommendation.js';
import { compareModels } from '../lib/economics.js';
import { eur, pct, de } from '../lib/format.js';

// Neutraler Modellvergleich + beratende Empfehlung (GGV ↔ Mieterstrom).
// Beide Modelle werden für dieses Gebäude gerechnet; die Faktoren sind lokale
// Eingaben (nichts wird gespeichert). Die Plattform begleitet bis zu dieser
// Empfehlung – die Umsetzung (Verträge, Anbieter, Anlagenbau) ist nicht Teil
// dieser Analyse.
export default function ModelRecommendation({ E, quote = 100, share = 90, cf = 1 }) {
  const [ownerType, setOwnerType] = useState('privat');
  const [bearsResidual, setBearsResidual] = useState(false);
  const [wantsZuschlag, setWantsZuschlag] = useState(false);
  const [keepGewerbe, setKeepGewerbe] = useState(true);

  const we = E?.we || 8;
  const rec = useMemo(
    () => recommendModel({ we, ownerType, bearsResidual, wantsZuschlag, keepGewerbe }),
    [we, ownerType, bearsResidual, wantsZuschlag, keepGewerbe],
  );
  const cmp = useMemo(
    () => compareModels(E, { quotePct: quote, sharePct: share, consumptionFactor: cf }),
    [E, quote, share, cf],
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

  // Renditehinweis: Mieterstrom ist meist renditestärker – das ehrlich benennen.
  const gIrr = cmp.ggv.irr, mIrr = cmp.mieterstrom.irr;
  const renditeHint = (mIrr != null && gIrr != null && mIrr > gIrr)
    ? <>Rechnerisch liegt <strong>Mieterstrom</strong> bei der Rendite vorn ({pct(mIrr * 100, 1)} vs. {pct(gIrr * 100, 1)}). Ob der höhere Aufwand lohnt, entscheiden die Faktoren unten.</>
    : null;

  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2"><Scale className="h-4 w-4 text-grass-deep" /><h3>Welches Modell passt zu diesem Gebäude?</h3></div>
          <p className="text-[13px] text-ink-soft mt-0.5">Die Plattform rechnet beide Modelle und empfiehlt – die Eigentümerseite entscheidet. Pro Gebäude ist es ein Entweder-oder, kein Sowohl-als-auch.</p>
        </div>
        <span className="shrink-0 rounded-pill bg-paper-3 text-ink-soft text-2xs font-semibold px-2.5 py-1">beratend</span>
      </div>

      {/* Vergleich: beide Modelle mit echten Zahlen für dieses Gebäude */}
      <div className="grid sm:grid-cols-2 gap-3">
        <CompareCard tone="grass" name="GGV" full="Gemeinschaftliche Gebäudeversorgung" s={cmp.ggv}
          picked={isGGV} traits={['Mieter behalten ihren Stromanbieter', 'kein Reststromrisiko, einfache Abrechnung', 'kein Mieterstromzuschlag']} />
        <CompareCard tone="sun" name="Mieterstrom" full="Vollversorgung durch die Eigentümerseite" s={cmp.mieterstrom}
          picked={isMST} traits={['zusätzlich Mieterstromzuschlag', 'Erlös aus Reststrom-Vollversorgung', 'Vollversorgerpflicht + Reststromrisiko']} />
      </div>

      {/* Annahmen (lokale Eingaben, nichts wird gespeichert) */}
      <div className="rounded-xl bg-paper-2 border border-line p-3.5 space-y-3">
        <div className="flex items-center gap-2 text-2xs text-ink-faint"><Building2 className="h-3.5 w-3.5" /> Annahmen zum Gebäude · Größe aus den Projektdaten ({rec.we} WE, {rec.sizeLabel})</div>
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
        {renditeHint && <p className="text-[13px] text-ink-soft mt-2 leading-snug">{renditeHint}</p>}
      </div>

      {/* Begründung: zwei Spalten */}
      <div className="grid md:grid-cols-2 gap-3">
        <ReasonList tone="grass" title="Spricht für die GGV" items={rec.reasonsGGV} />
        <ReasonList tone="sun" title="Spricht für Mieterstrom" items={rec.reasonsMST} />
      </div>

      <InfoNote tone="info">
        Diese Plattform begleitet euch bis zu dieser Modellempfehlung. Die konkrete Umsetzung – Verträge, Wahl eines Mieterstrom-Anbieters, Anlagenbau – ist <strong>nicht Teil dieser Analyse</strong>.
      </InfoNote>
    </section>
  );
}

function CompareCard({ tone, name, full, s, picked, traits }) {
  const head = tone === 'grass' ? 'text-grass-deep' : 'text-sun-deep';
  const ring = picked ? (tone === 'grass' ? 'ring-2 ring-grass/50' : 'ring-2 ring-sun/50') : '';
  return (
    <div className={`rounded-xl border border-line p-4 ${ring}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className={`font-display font-bold ${head}`}>{name}</div>
          <div className="text-2xs text-ink-faint">{full}</div>
        </div>
        {picked && <span className={`rounded-pill text-2xs font-semibold px-2 py-0.5 ${tone === 'grass' ? 'bg-grass-soft text-grass-deep' : 'bg-sun-soft text-sun-deep'}`}>empfohlen</span>}
      </div>
      <dl className="mt-3 space-y-1.5">
        <Row k="Überschuss Eigentümer" v={eur(s.netto) + ' / a'} />
        <Row k="Rendite (interner Zinsfuß)" v={s.irr == null ? '—' : pct(s.irr * 100, 1) + ' p. a.'} strong />
        <Row k="Amortisation" v={s.amort ? de(s.amort, 1) + ' Jahre' : '—'} />
      </dl>
      <ul className="mt-3 space-y-1 border-t border-line pt-2.5">
        {traits.map((t, i) => (
          <li key={i} className="text-2xs text-ink-soft leading-snug">{t}</li>
        ))}
      </ul>
    </div>
  );
}
function Row({ k, v, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-[13px] text-ink-soft">{k}</dt>
      <dd className={`tnum ${strong ? 'font-bold text-ink' : 'font-medium text-ink'}`}>{v}</dd>
    </div>
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
