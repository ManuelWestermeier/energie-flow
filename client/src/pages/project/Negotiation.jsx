import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext.jsx';
import { PageHead, Stat, InfoNote, Avatar, ProgressBar } from '../../components/ui.jsx';
import LeverChart from '../../components/LeverChart.jsx';
import { api } from '../../lib/api.js';
import { paramsFromProject, committedQuote, scenario } from '../../lib/economics.js';
import { eur, ct, pct, relTime } from '../../lib/format.js';
import { Handshake, Send, Check, RotateCcw, Scale, CheckCircle2 } from 'lucide-react';

export default function Negotiation() {
  const { project, setProject, me } = useProject();
  const E = useMemo(() => paramsFromProject(project), [project]);
  const quote = committedQuote(project) || 100;
  const [share, setShare] = useState(project.share_pct || 90);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const current = scenario(E, { quotePct: quote, sharePct: project.share_pct });
  const draft = scenario(E, { quotePct: quote, sharePct: share });
  const proposals = project.proposals || [];
  const consent = project.consent || { agreedCount: 0, activeCount: 0, consensus: false };

  async function sendProposal() {
    setSending(true);
    try {
      setProject(await api.propose(project.id, {
        share_pct: Number(share), quote_pct: quote, params: E, result: draft, note: note || null,
      }));
      setNote('');
    } catch (e) { alert(e.message); } finally { setSending(false); }
  }
  async function setConsent(agreed) {
    try { setProject(await api.consent(project.id, agreed)); } catch (e) { alert(e.message); }
  }

  return (
    <div className="space-y-6">
      <PageHead eyebrow="Verhandlung" title="Den fairen Preis finden"
        sub="Ein Preis, der die Anlage für die Eigentümerseite trägt und für die Mieterschaft klar günstiger ist als der Grundpreis." />

      {project.status === 'vereinbart' && consent.consensus && (
        <div className="card p-4 bg-grass-soft/50 border-grass/30 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-grass-deep shrink-0" />
          <div><div className="font-display font-bold text-grass-ink">Einigung erreicht</div>
            <div className="text-[13px] text-grass-ink/80">Alle Aktiven stimmen {pct(project.share_pct, 0)} des Grundpreises ({ct(current.solarpreis)}/kWh) zu. Weiter zu den <Link to="../dokumente" className="underline font-medium">Verträgen</Link>.</div></div>
        </div>
      )}

      {/* Aktueller Stand */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Aktueller Preis" value={pct(project.share_pct, 0)} sub={`${ct(current.solarpreis)}/kWh`} />
        <Stat label="Ersparnis je Haushalt" tone="grass" value={eur(current.tenantSavingsPerHH)} sub="pro Jahr" />
        <Stat label="Rendite Eigentümer" tone="sun" value={current.irr == null ? '—' : pct(current.irr * 100, 1)} sub="p.a." />
        <Stat label="Zustimmung" value={`${consent.agreedCount}/${consent.activeCount}`} sub="Aktive stimmen zu" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vorschlag */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-3"><Handshake className="h-4 w-4 text-grass-deep" /><h3>Neuen Preis vorschlagen</h3></div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="label !mb-0">Solarstrompreis</span>
            <span className="font-display font-bold tnum text-2xl text-grass-deep">{share}<span className="text-sm font-medium text-ink-faint ml-1">% des Grundpreises</span></span>
          </div>
          <input type="range" min={55} max={110} step={1} value={share} onChange={(e) => setShare(Number(e.target.value))} className="w-full accent-grass" />
          <div className="flex justify-between text-2xs text-ink-faint mt-1"><span>günstiger für Mieter</span><span>mehr Rendite für Eigentümer</span></div>

          {/* Trade-off */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-card bg-grass-soft/60 p-3">
              <div className="text-2xs text-grass-ink/70 font-semibold uppercase tracking-wide">Mieter spart/HH</div>
              <div className="font-display text-xl font-bold tnum text-grass-ink mt-0.5">{eur(draft.tenantSavingsPerHH)}</div>
              <div className="text-2xs text-grass-ink/70">{ct(draft.solarpreis)}/kWh statt {ct(E.gvpreis)}</div>
            </div>
            <div className="rounded-card bg-sun-soft/60 p-3">
              <div className="text-2xs text-sun-ink/70 font-semibold uppercase tracking-wide">Eigentümer-Rendite</div>
              <div className="font-display text-xl font-bold tnum text-sun-ink mt-0.5">{draft.irr == null ? '—' : pct(draft.irr * 100, 1)}</div>
              <div className="text-2xs text-sun-ink/70">{eur(draft.netto)} Überschuss/a</div>
            </div>
          </div>

          <textarea className="input mt-3" rows={2} placeholder="Begründung (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button onClick={sendProposal} disabled={sending} className="btn-primary btn-sm w-full mt-3"><Send className="h-4 w-4" /> {sending ? 'Wird gesendet …' : 'Vorschlag senden'}</button>
          <p className="text-2xs text-ink-faint mt-2">Ein neuer Vorschlag setzt den aktiven Preis und alle bisherigen Zustimmungen zurück.</p>
        </section>

        {/* Hebel + Zustimmung */}
        <div className="space-y-6">
          <section className="card p-5">
            <h3 className="mb-2">Preis-Hebel</h3>
            <LeverChart E={E} quote={quote} height={200} />
          </section>

          <section className="card p-5">
            <h3 className="mb-2">Zustimmung zum aktuellen Preis</h3>
            <div className="flex items-center justify-between text-2xs text-ink-faint mb-1">
              <span>{pct(project.share_pct, 0)} des Grundpreises</span><span className="tnum">{consent.agreedCount}/{consent.activeCount}</span>
            </div>
            <ProgressBar value={consent.activeCount ? consent.agreedCount / consent.activeCount * 100 : 0} />
            <div className="mt-3">
              {me?.agreed
                ? <button onClick={() => setConsent(false)} className="btn-ghost btn-sm w-full"><RotateCcw className="h-4 w-4" /> Zustimmung zurückziehen</button>
                : <button onClick={() => setConsent(true)} className="btn-primary btn-sm w-full"><Check className="h-4 w-4" /> Diesem Preis zustimmen</button>}
            </div>
          </section>
        </div>
      </div>

      {/* Verlauf */}
      <section className="card">
        <div className="px-4 py-3 border-b border-line"><h3>Verlauf der Vorschläge</h3></div>
        {proposals.length === 0 ? (
          <div className="px-4 py-6 text-[13.5px] text-ink-soft">Noch keine Vorschläge. Mach den ersten – ein fairer Startwert sind 90 % des Grundpreises.</div>
        ) : (
          <ul className="divide-y divide-line">
            {proposals.map((p) => (
              <li key={p.id} className="flex items-start gap-3 px-4 py-3">
                <Avatar name={p.by_name} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px]"><span className="font-medium">{p.by_name}</span> <span className="text-ink-faint">schlug</span> <span className="font-semibold tnum">{pct(p.share_pct, 0)}</span> <span className="text-ink-faint">vor</span></div>
                  {p.note && <div className="text-2xs text-ink-soft mt-0.5">„{p.note}“</div>}
                  <div className="text-2xs text-ink-faint mt-0.5">{relTime(p.created_at)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <InfoNote>
        <span className="inline-flex items-start gap-1.5"><Scale className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Bei der GGV nach §42b EnWG ist der Preis <strong>frei verhandelbar</strong> – die 90-%-Grenze gilt nur für Mieterstrom. 90 % nutzen wir als freiwilligen Fairness-Maßstab. <Link to="/modell" className="link">Mehr zum Rechtsrahmen →</Link></span></span>
      </InfoNote>
    </div>
  );
}
