import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext.jsx';
import { PageHead, Stat, InfoNote } from '../../components/ui.jsx';
import LeverChart from '../../components/LeverChart.jsx';
import ModelRecommendation from '../../components/ModelRecommendation.jsx';
import { paramsFromProject, committedQuote, modelScenario, consumptionStats, CONS_REF } from '../../lib/economics.js';
import { de, eur, ct, kwh, pct } from '../../lib/format.js';
import { BarChart3, Info, Database, RotateCcw } from 'lucide-react';

const QUOTES = [50, 75, 100];
const SHARES = [70, 80, 90, 100];

export default function Economics() {
  const { project } = useProject();
  const E = useMemo(() => paramsFromProject(project), [project]);
  const committed = committedQuote(project);
  const cs = useMemo(() => consumptionStats(project), [project]);
  const baseQuote = committed > 0 ? committed : 100;
  const [quote, setQuote] = useState(baseQuote);
  const [share, setShare] = useState(project.share_pct || 90);
  const [cons, setCons] = useState(cs.avg);
  const [metric, setMetric] = useState('irr'); // 'irr' | 'save'
  const [model, setModel] = useState('ggv');    // 'ggv' | 'mieterstrom'

  const cf = (cons || CONS_REF) / CONS_REF;
  const r = useMemo(() => modelScenario(E, { quotePct: quote, sharePct: share, consumptionFactor: cf }, model), [E, quote, share, cf, model]);
  const live = quote === baseQuote && cons === cs.avg && share === (project.share_pct || 90);
  const resetLive = () => { setQuote(baseQuote); setShare(project.share_pct || 90); setCons(cs.avg); };

  return (
    <div className="space-y-6">
      <PageHead eyebrow="Wirtschaftlichkeit" title="Szenarien durchrechnen"
        sub="Drei Stellschrauben bestimmen das Ergebnis: wie viele Wohnungen mitmachen, wie viel Strom sie verbrauchen und zu welchem Preis der Solarstrom geliefert wird. Mehr Beteiligung und mehr Verbrauch heißt: mehr Solarstrom wird direkt im Haus genutzt statt eingespeist." />

      {!project.feindaten && <InfoNote>Basis ist eine <strong>Schätzung</strong>. Mit Feindaten unter <Link to="../gebaeude" className="link">Gebäude & Anlage</Link> werden die Werte gebäudegenau.</InfoNote>}

      {/* Modellvergleich & Empfehlung (neutral) */}
      <ModelRecommendation E={E} quote={quote} share={share} cf={cf} />

      {/* Stellschrauben */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[13px] font-semibold text-ink">Modell:</span>
          <div className="flex rounded-pill border border-line p-0.5 text-2xs">
            <button onClick={() => setModel('ggv')} className={`px-3 py-1 rounded-pill font-semibold ${model === 'ggv' ? 'bg-grass-soft text-grass-deep' : 'text-ink-soft'}`}>GGV</button>
            <button onClick={() => setModel('mieterstrom')} className={`px-3 py-1 rounded-pill font-semibold ${model === 'mieterstrom' ? 'bg-sun-soft text-sun-deep' : 'text-ink-soft'}`}>Mieterstrom</button>
          </div>
          <span className="text-2xs text-ink-faint">Die folgenden Zahlen gelten für das gewählte Modell.</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-start gap-2 text-[13px] text-ink-soft">
            <Database className="h-4 w-4 text-grass-deep mt-0.5 shrink-0" />
            <div>
              Basis: <strong className="text-ink tnum">{cs.committed}</strong> von {project.we} WE zugesagt
              {cs.reported > 0
                ? <> · <strong className="text-ink tnum">{cs.reported}</strong> Verbrauchswert{cs.reported === 1 ? '' : 'e'} hinterlegt (Ø <span className="tnum">{kwh(cs.avg)}</span>)</>
                : <> · noch keine Verbrauchswerte – gerechnet mit <span className="tnum">{kwh(CONS_REF)}</span>/WE</>}
            </div>
          </div>
          {!live && <button onClick={resetLive} className="btn-quiet btn-sm shrink-0"><RotateCcw className="h-4 w-4" /> Auf Echtdaten</button>}
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          <Slider label="Beteiligung" value={quote} setValue={setQuote} min={10} max={100} step={5} suffix="% der WE"
            note={`${Math.round(quote / 100 * project.we)} von ${project.we} WE${quote === baseQuote && committed > 0 ? ' · echt' : ''}`} />
          <Slider label="Ø Verbrauch / Haushalt" value={cons} setValue={setCons} min={1000} max={6000} step={100} suffix="kWh/a"
            note={cons === cs.avg && cs.reported > 0 ? 'aus den Mieter-Angaben' : (cons === CONS_REF ? 'Referenzwert' : 'angenommen')} />
          <Slider label="Solarstrompreis" value={share} setValue={setShare} min={55} max={110} step={1} suffix="% Grundpreis"
            note={`${ct(E.gvpreis * share / 100)} pro kWh`} sun />
        </div>
      </div>

      {/* Ergebnis */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Solarstrompreis" tone="grass" value={ct(r.solarpreis)} sub={`${pct(share, 0)} des Grundpreises`} />
        <Stat label="Ersparnis je Haushalt" tone="grass" value={eur(r.tenantSavingsPerHH)} sub="pro Jahr" />
        <Stat label="Überschuss Eigentümer" tone="sun" value={eur(r.netto)} sub="pro Jahr nach Kosten" />
        <Stat label="Rendite Eigentümer" tone="sun" value={r.irr == null ? '—' : pct(r.irr * 100, 1)} sub={r.irr == null ? 'trägt sich nicht' : `p.a. · Amort. ${r.amort ? de(r.amort, 1) + ' J.' : '—'}`} />
      </div>

      {/* Hebel-Diagramm */}
      <section className="card p-5">
        <div className="flex items-center gap-2 mb-1"><BarChart3 className="h-4 w-4 text-grass-deep" /><h3>Der Preis-Hebel</h3></div>
        <p className="text-[13px] text-ink-soft mb-3">Wie sich die Rendite der Eigentümerseite mit dem Preis verändert – bei eurer Beteiligung und bei voller Beteiligung.</p>
        <LeverChart E={E} quote={quote} consumptionFactor={cf} height={240} model={model} />
      </section>

      {/* Sensitivitätsmatrix */}
      <section className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div><div className="flex items-center gap-2"><Info className="h-4 w-4 text-grass-deep" /><h3>Sensitivität</h3></div>
            <p className="text-[13px] text-ink-soft mt-0.5">Ergebnis je Kombination aus Beteiligung (Zeilen) und Preis (Spalten).</p></div>
          <div className="flex rounded-pill border border-line p-0.5 text-2xs">
            <button onClick={() => setMetric('irr')} className={`px-2.5 py-1 rounded-pill font-semibold ${metric === 'irr' ? 'bg-grass-soft text-grass-deep' : 'text-ink-soft'}`}>Rendite</button>
            <button onClick={() => setMetric('save')} className={`px-2.5 py-1 rounded-pill font-semibold ${metric === 'save' ? 'bg-grass-soft text-grass-deep' : 'text-ink-soft'}`}>Ersparnis/HH</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr><th>Beteiligung ↓ / Preis →</th>{SHARES.map((s) => <th key={s} className="text-center tnum">{s}%</th>)}</tr>
            </thead>
            <tbody>
              {QUOTES.map((q) => (
                <tr key={q}>
                  <td className="font-semibold tnum">{q}%</td>
                  {SHARES.map((s) => {
                    const sc = modelScenario(E, { quotePct: q, sharePct: s, consumptionFactor: cf }, model);
                    const sel = q === quote && s === share;
                    const val = metric === 'irr'
                      ? (sc.irr == null ? '–' : pct(sc.irr * 100, 1))
                      : eur(sc.tenantSavingsPerHH);
                    const tint = metric === 'irr'
                      ? (sc.irr == null ? 'text-ink-faint' : 'bg-grass-soft/50 text-grass-ink')
                      : 'bg-sun-soft/40 text-sun-ink';
                    return <td key={s} className={`text-center tnum ${tint} ${sel ? 'ring-2 ring-grass ring-inset font-bold' : ''}`}>{val}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-2xs text-ink-faint mt-2">„–“ bedeutet: amortisiert sich nicht innerhalb von {E.zeitraum} Jahren.</p>
      </section>

      {/* Aufschlüsselung */}
      <div className="grid md:grid-cols-2 gap-4">
        <Breakdown title="Energiefluss (pro Jahr)" rows={[
          ['Jahreserzeugung', kwh(r.erz)],
          ['Ø Verbrauch je Haushalt', kwh(cons)],
          ['davon direkt im Haus genutzt', kwh(r.solar)],
          ['Überschuss-Einspeisung', kwh(r.feed)],
          ['Direktverbrauchsquote', pct(r.direktquote, 1)],
          ['vermiedenes CO₂', de(r.co2) + ' kg'],
        ]} />
        <Breakdown title="Wirtschaft (pro Jahr)" rows={[
          ['Erlös Direktlieferung', eur(r.einnSolar)],
          ['Erlös Einspeisung', eur(r.einnFeed)],
          ...(model === 'mieterstrom'
            ? [['Mieterstromzuschlag', eur(r.zuschlag)], ['Marge Reststrom-Vollversorgung', eur(r.reststrom)]]
            : []),
          ['Betrieb & Versicherung', '− ' + eur(r.kosten)],
          ['Nettoüberschuss Eigentümer', eur(r.netto)],
          ['Ersparnis aller Mieter', eur(r.tenantSavingsTotal)],
        ]} highlight={model === 'mieterstrom' ? [5, 6] : [3, 4]} />
      </div>

      <InfoNote tone="info">
        Beide Modelle leben vor allem vom gemeinsamen Nutzen vor Ort, weniger von hoher Verzinsung.
        Auch <strong>Balkonkraftwerke</strong> sind eine einfache Alternative für Einzelne. Mehr dazu im <Link to="/wirtschaftlichkeit" className="link">Erklärbereich</Link>.
      </InfoNote>
    </div>
  );
}

function Slider({ label, value, setValue, min, max, step, suffix, note, sun }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="label !mb-0">{label}</span>
        <span className={`font-display font-bold tnum text-lg ${sun ? 'text-sun-deep' : 'text-grass-deep'}`}>{value}<span className="text-xs font-medium text-ink-faint ml-1">{suffix}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => setValue(Number(e.target.value))}
        className={`w-full ${sun ? 'sun' : ''}`} />
      {note && <div className="text-2xs text-ink-faint mt-1 tnum">{note}</div>}
    </div>
  );
}

function Breakdown({ title, rows, highlight = [] }) {
  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-line"><h3>{title}</h3></div>
      <dl className="divide-y divide-line">
        {rows.map(([k, v], i) => (
          <div key={k} className={`flex items-center justify-between px-4 py-2.5 ${highlight.includes(i) ? 'bg-paper-2' : ''}`}>
            <dt className={`text-[13.5px] ${highlight.includes(i) ? 'font-semibold text-ink' : 'text-ink-soft'}`}>{k}</dt>
            <dd className={`text-[14px] tnum ${highlight.includes(i) ? 'font-bold' : 'font-medium'}`}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
