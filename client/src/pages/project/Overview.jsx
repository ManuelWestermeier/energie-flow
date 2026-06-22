import { Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext.jsx';
import { Stat, ProgressBar, InfoNote, EmptyState } from '../../components/ui.jsx';
import { paramsFromProject, committedQuote, scenario } from '../../lib/economics.js';
import { overall, currentPhase, nextActions, PHASES, phaseComplete } from '../../lib/phases.js';
import { eur, ct, pct, irrText, relTime } from '../../lib/format.js';
import {
  ArrowRight, CircleDot, Activity as ActIcon, Building2, Users, BarChart3,
  Handshake, FileText, ListChecks, Sun,
} from 'lucide-react';

export default function Overview() {
  const { project } = useProject();
  const E = paramsFromProject(project);
  const committed = committedQuote(project);
  const quote = committed > 0 ? committed : 100;
  const r = scenario(E, { quotePct: quote, sharePct: project.share_pct });
  const ov = overall(project);
  const cp = currentPhase(project);
  const todo = nextActions(project, 4);
  const acts = project.activity || [];

  return (
    <div className="space-y-6">
      {/* Phasen-Banner */}
      <div className="card overflow-hidden">
        <div className="p-5 sm:flex items-center gap-5">
          <div className="flex-1">
            <div className="eyebrow">Phase {cp.n} von {PHASES.length}</div>
            <h2 className="mt-1">{cp.title}</h2>
            <p className="text-ink-soft text-[14px] mt-1 max-w-prose2">{cp.summary}</p>
          </div>
          <div className="mt-4 sm:mt-0 sm:w-64 shrink-0">
            <div className="flex items-center justify-between text-2xs text-ink-faint mb-1">
              <span>Gesamtfortschritt</span><span className="tnum">{ov.done}/{ov.total} Schritte</span>
            </div>
            <ProgressBar value={ov.pct} />
            <Link to="../fahrplan" className="btn-primary btn-sm w-full mt-3">Zum Fahrplan <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
        <PhaseStrip project={project} />
      </div>

      {project.feindaten ? (
        <InfoNote tone="grass">Diese Zahlen beruhen auf <strong>hinterlegten Feindaten</strong> – belastbare Grundlage für Verhandlung und Verträge.</InfoNote>
      ) : (
        <InfoNote>Aktuell <strong>erste Schätzung</strong> auf Basis von Durchschnittswerten. Mit Feindaten der Eigentümerseite werden die Zahlen gebäudegenau. <Link to="../gebaeude" className="link">Feindaten erfassen →</Link></InfoNote>
      )}

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Solarstrompreis" tone="grass" value={ct(r.solarpreis)} sub={`${pct(project.share_pct, 0)} des Grundpreises`} />
        <Stat label="Ersparnis je Haushalt" tone="grass" value={eur(r.tenantSavingsPerHH)} sub="pro Jahr (Schnitt)" />
        <Stat label="Beteiligung" value={pct(quote, 0)} sub={`${Math.round(quote / 100 * project.we)} von ${project.we} WE`} />
        <Stat label="Rendite Eigentümer" tone="sun" value={r.irr == null ? '—' : pct(r.irr * 100, 1)} sub={r.irr == null ? 'trägt sich (noch) nicht' : 'p.a. über ' + E.zeitraum + ' J.'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Nächste Schritte */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="h-4 w-4 text-grass-deep" /><h3>Nächste Schritte</h3>
          </div>
          {todo.length === 0 ? (
            <EmptyState title="Alles offene erledigt" >Die manuellen Aufgaben sind abgehakt. Schau in den Fahrplan für den Gesamtstand.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {todo.map((t) => (
                <li key={t.id}>
                  <Link to={`../${t.to || t.phase.to}`} className="flex items-start gap-3 rounded-[10px] border border-line p-3 hover:border-line-strong hover:bg-paper-2 transition">
                    <CircleDot className="h-4 w-4 text-ink-faint mt-0.5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium text-ink">{t.label}</span>
                      <span className="block text-2xs text-ink-faint mt-0.5">Phase {t.phase.n}: {t.phase.title}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-ink-faint ml-auto mt-0.5 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Letzte Aktivität */}
        <section className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><ActIcon className="h-4 w-4 text-grass-deep" /><h3>Letzte Aktivität</h3></div>
            <Link to="../aktivitaet" className="link-muted text-[13px]">Alle</Link>
          </div>
          {acts.length === 0 ? (
            <EmptyState title="Noch nichts passiert">Sobald jemand beitritt oder Daten ändert, erscheint es hier.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {acts.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-grass shrink-0" />
                  <span className="text-[13.5px] text-ink-soft">
                    {a.actor_name && <span className="font-medium text-ink">{a.actor_name} </span>}{a.text}
                    <span className="block text-2xs text-ink-faint mt-0.5">{relTime(a.created_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Schnellzugriff */}
      <section>
        <div className="eyebrow mb-3">Schnellzugriff</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            ['gebaeude', 'Gebäude', Building2], ['gemeinschaft', 'Gemeinschaft', Users],
            ['wirtschaftlichkeit', 'Wirtschaft', BarChart3], ['verhandlung', 'Verhandlung', Handshake],
            ['dokumente', 'Dokumente', FileText], ['fahrplan', 'Fahrplan', ListChecks],
          ].map(([to, label, Icon]) => (
            <Link key={to} to={`../${to}`} className="panel p-3.5 hover:border-line-strong hover:bg-paper-2 transition flex flex-col items-start gap-2">
              <Icon className="h-5 w-5 text-grass-deep" />
              <span className="text-[13px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

// kompakte Phasenleiste (Mini-Flussschiene)
function PhaseStrip({ project }) {
  const cp = currentPhase(project);
  return (
    <div className="border-t border-line bg-paper-2/60 px-5 py-3 flex items-center gap-1.5 overflow-x-auto">
      {PHASES.map((ph, i) => {
        const done = phaseComplete(ph, project);
        const cur = ph.id === cp.id && !done;
        return (
          <div key={ph.id} className="flex items-center gap-1.5 shrink-0">
            <span className={`h-2 w-2 rounded-full ${done ? 'bg-grass' : cur ? 'bg-sun' : 'bg-line-strong'}`} />
            <span className={`text-2xs ${cur ? 'text-ink font-semibold' : 'text-ink-faint'} whitespace-nowrap`}>{ph.title}</span>
            {i < PHASES.length - 1 && <span className="w-5 h-px bg-line-strong mx-0.5" />}
          </div>
        );
      })}
    </div>
  );
}
