import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext.jsx';
import { PageHead, Stat, InfoNote, Avatar, ProgressBar } from '../../components/ui.jsx';
import LeverChart from '../../components/LeverChart.jsx';
import { api } from '../../lib/api.js';
import { paramsFromProject, committedQuote, scenario, consumptionStats } from '../../lib/economics.js';
import { eur, ct, pct, relTime } from '../../lib/format.js';
import { Handshake, Send, Check, X, RotateCcw, Scale, CheckCircle2, Inbox } from 'lucide-react';

export default function Negotiation() {
  const { project, setProject, me, isAdmin, isOwner } = useProject();
  const canApply = isAdmin || isOwner;
  const E = useMemo(() => paramsFromProject(project), [project]);
  const quote = committedQuote(project) || 100;
  const cs = useMemo(() => consumptionStats(project), [project]);
  const cf = cs.factor;
  const [share, setShare] = useState(project.share_pct || 90);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState('');

  const current = scenario(E, { quotePct: quote, sharePct: project.share_pct, consumptionFactor: cf });
  const draft = scenario(E, { quotePct: quote, sharePct: share, consumptionFactor: cf });
  const proposals = project.proposals || [];
  const pending = proposals.filter((p) => (p.status || 'approved') === 'pending');
  const history = isAdmin ? proposals.filter((p) => (p.status || 'approved') !== 'pending') : proposals;
  const consent = project.consent || { agreedCount: 0, activeCount: 0, consensus: false };

  async function sendProposal() {
    setSending(true);
    try {
      setProject(await api.propose(project.id, {
        share_pct: Number(share), quote_pct: quote, params: { ...E, consumptionFactor: cf }, result: draft, note: note || null,
      }));
      setNote('');
    } catch (e) { alert(e.message); } finally { setSending(false); }
  }
  async function decide(pid, decision) {
    setBusyId(pid + decision);
    try { setProject(await api.decideProposal(project.id, pid, decision)); }
    catch (e) { alert(e.message); } finally { setBusyId(''); }
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
            <div className="text-[13px] text-grass-ink/80">Alle Aktiven stimmen {pct(project.share_pct, 0)} des Grundpreises ({ct(current.solarpreis)}/kWh) zu. Weiter zu den <Link to="../dokumente" className="underline font-medium">Unterlagen</Link>.</div></div>
        </div>
      )}

      {/* Aktueller Stand */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Aktueller Preis" value={pct(project.share_pct, 0)} sub={`${ct(current.solarpreis)}/kWh`} />
        <Stat label="Ersparnis je Haushalt" tone="grass" value={eur(current.tenantSavingsPerHH)} sub="pro Jahr" />
        <Stat label="Rendite Eigentümer" tone="sun" value={current.irr == null ? '—' : pct(current.irr * 100, 1)} sub="p.a." />
        <Stat label="Zustimmung" value={`${consent.agreedCount}/${consent.activeCount}`} sub="Aktive stimmen zu" />
      </div>

      {isAdmin && pending.length > 0 && (
        <section className="card p-5 border-sun/30 bg-sun-soft/20">
          <div className="flex items-center gap-2 mb-1"><Inbox className="h-4 w-4 text-sun-deep" /><h3>Offene Vorschläge</h3>
            <span className="rounded-pill bg-sun-soft text-sun-deep text-2xs font-semibold px-2 py-0.5">{pending.length}</span></div>
          <p className="text-[13px] text-ink-soft mb-3">Vorschläge aus der Hausgemeinschaft. Erst nach deiner Freigabe werden sie aktiv und für alle sichtbar.</p>
          <ul className="space-y-2">
            {pending.map((p) => (
              <li key={p.id} className="rounded-card border border-line bg-paper p-3 flex items-start gap-3">
                <Avatar name={p.by_name} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px]"><span className="font-medium">{p.by_name}</span> <span className="text-ink-faint">schlägt vor:</span></div>
                  <ProposalSummary p={p} />
                  {p.note && <div className="text-2xs text-ink-soft mt-0.5">„{p.note}"</div>}
                  <div className="text-2xs text-ink-faint mt-0.5">{relTime(p.created_at)}</div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => decide(p.id, 'approve')} disabled={!!busyId} className="btn-primary btn-sm !py-1"><Check className="h-3.5 w-3.5" /> Genehmigen</button>
                  <button onClick={() => decide(p.id, 'reject')} disabled={!!busyId} className="btn-ghost btn-sm !py-1"><X className="h-3.5 w-3.5" /> Ablehnen</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vorschlag */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-3"><Handshake className="h-4 w-4 text-grass-deep" /><h3>{canApply ? 'Preis festlegen' : 'Preis vorschlagen'}</h3></div>
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
          <button onClick={sendProposal} disabled={sending} className="btn-primary btn-sm w-full mt-3"><Send className="h-4 w-4" /> {sending ? 'Wird gesendet …' : (canApply ? 'Preis festlegen' : 'Vorschlag einreichen')}</button>
          <p className="text-2xs text-ink-faint mt-2">{canApply ? 'Setzt den aktiven Preis und alle bisherigen Zustimmungen zurück.' : 'Geht an die Projektleitung zur Freigabe – erst nach Genehmigung wird er aktiv.'}</p>
        </section>

        {/* Hebel + Zustimmung */}
        <div className="space-y-6">
          <section className="card p-5">
            <h3 className="mb-2">Preis-Hebel</h3>
            <LeverChart E={E} quote={quote} consumptionFactor={cf} height={200} />
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
        {history.length === 0 ? (
          <div className="px-4 py-6 text-[13.5px] text-ink-soft">Noch keine Vorschläge. Macht den ersten – ein fairer Startwert sind 90 % des Grundpreises.</div>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((p) => (
              <li key={p.id} className="flex items-start gap-3 px-4 py-3">
                <Avatar name={p.by_name} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] flex items-center gap-2 flex-wrap">
                    <span><span className="font-medium">{p.by_name}</span> <span className="text-ink-faint">schlug vor:</span></span>
                    <ProposalStatusChip status={p.status} />
                  </div>
                  <ProposalSummary p={p} />
                  {p.note && <div className="text-2xs text-ink-soft mt-0.5">„{p.note}"</div>}
                  <div className="text-2xs text-ink-faint mt-0.5">{relTime(p.created_at)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <InfoNote>
        <span className="inline-flex items-start gap-1.5"><Scale className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Der Preis ist bei der GGV (§42b) <strong>frei verhandelbar</strong>; beim Mieterstrom (§42a) gilt die 90-%-Grenze. 90 % nutzen wir als freiwilligen Fairness-Maßstab. <Link to="/modell" className="link">Mehr zum Rechtsrahmen →</Link></span></span>
      </InfoNote>
    </div>
  );
}


const DATA_LABELS = { we: 'Wohneinheiten', kwp: 'kWp', ertrag: 'Ertrag', invest: 'Investition', gvpreis: 'Grundpreis', arbeitspreis: 'Arbeitspreis', einspeise: 'Einspeisung', opex: 'Betrieb', versicherung: 'Versicherung', zeitraum: 'Zeitraum' };
function ProposalSummary({ p }) {
  if (p.kind === 'data') {
    const patch = p.patch || {};
    const parts = Object.keys(patch).map((k) => `${DATA_LABELS[k] || k}: ${patch[k]}`);
    return <div className="text-[13px] text-ink mt-0.5">Anlagendaten – {parts.join(' · ') || 'keine Felder'}</div>;
  }
  return <div className="text-[13px] text-ink mt-0.5"><span className="font-semibold tnum">{pct(p.share_pct, 0)}</span> des Grundpreises</div>;
}
function ProposalStatusChip({ status }) {
  const s = status || 'approved';
  if (s === 'pending') return <span className="rounded-pill bg-sun-soft text-sun-deep text-2xs font-semibold px-2 py-0.5">wartet auf Freigabe</span>;
  if (s === 'rejected') return <span className="rounded-pill bg-paper-3 text-ink-faint text-2xs font-semibold px-2 py-0.5">abgelehnt</span>;
  return <span className="rounded-pill bg-grass-soft text-grass-deep text-2xs font-semibold px-2 py-0.5">freigegeben</span>;
}
