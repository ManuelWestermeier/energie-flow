import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext.jsx';
import { PageHead, Donut, InfoNote } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import {
  PHASES, isAuto, taskDone, phaseCounts, phaseComplete, currentPhase, overall,
} from '../../lib/phases.js';
import { Check, ArrowRight, Lock, Zap } from 'lucide-react';

export default function Roadmap() {
  const { project, setProject } = useProject();
  const [busy, setBusy] = useState(null);
  const ov = overall(project);
  const cp = currentPhase(project);

  async function toggle(t) {
    if (isAuto(t) || busy) return;
    const done = !taskDone(t, project);
    setBusy(t.id);
    try { setProject(await api.toggleTask(project.id, t.id, done, t.label)); }
    catch (e) { alert(e.message); }
    finally { setBusy(null); }
  }

  return (
    <div>
      <PageHead
        eyebrow="Fahrplan"
        title="Von der Idee zur Anlage"
        sub="Sechs Phasen begleiten euch Schritt für Schritt. Automatische Häkchen erkennt das System selbst, die übrigen hakt ihr ab, wenn ihr sie erledigt habt."
        actions={<div className="hidden sm:block"><Donut value={ov.pct} size={64} /></div>}
      />

      <div className="relative">
        {/* Flussschiene */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 rounded-full current-charge" style={{ background: 'var(--flow-v)' }} aria-hidden />
        <ol className="space-y-6">
          {PHASES.map((ph) => {
            const done = phaseComplete(ph, project);
            const cur = ph.id === cp.id && !done;
            const cnt = phaseCounts(ph, project);
            return (
              <li key={ph.id} className="relative pl-12">
                {/* Knoten */}
                <span className={`absolute left-0 top-0 h-8 w-8 grid place-items-center rounded-full text-[12px] font-bold z-10
                  ${done ? 'bg-grass text-white' : cur ? 'bg-paper text-sun-deep ring-2 ring-sun' : 'bg-paper text-ink-faint ring-1 ring-line-strong'}`}>
                  {done ? <Check className="h-4 w-4" /> : ph.n}
                </span>

                <div className={`card p-4 ${cur ? 'ring-1 ring-grass/25' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px]">{ph.title}</h3>
                        {cur && <span className="chip-sun">Aktuell</span>}
                        {done && <span className="chip-grass">Erledigt</span>}
                      </div>
                      <p className="text-[13px] text-ink-soft mt-0.5">{ph.summary}</p>
                    </div>
                    <span className="text-2xs text-ink-faint tnum shrink-0 mt-1">{cnt.done}/{cnt.total}</span>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {ph.tasks.map((t) => {
                      const d = taskDone(t, project);
                      const auto = isAuto(t);
                      return (
                        <li key={t.id} className="flex items-start gap-3 rounded-[10px] px-2 py-2 hover:bg-paper-2/70">
                          <button
                            onClick={() => toggle(t)} disabled={auto || busy === t.id}
                            aria-label={d ? 'erledigt' : 'offen'}
                            className={`mt-0.5 h-5 w-5 rounded-[6px] grid place-items-center shrink-0 transition
                              ${d ? 'bg-grass text-white' : 'bg-paper border border-line-strong'}
                              ${auto ? 'cursor-default opacity-90' : 'hover:border-grass'}`}>
                            {d && <Check className="h-3.5 w-3.5" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[13.5px] ${d ? 'text-ink-soft line-through decoration-line-strong' : 'text-ink font-medium'}`}>{t.label}</span>
                              {auto ? (
                                <span className="chip-muted !py-0.5 gap-1"><Zap className="h-3 w-3" /> automatisch</span>
                              ) : !d ? (
                                <span className="text-2xs text-ink-faint">manuell</span>
                              ) : null}
                            </div>
                            {t.hint && !d && <div className="text-2xs text-ink-faint mt-0.5">{t.hint}</div>}
                          </div>
                          {t.to && (
                            <Link to={`../${t.to}`} className="text-2xs text-grass-deep hover:underline shrink-0 mt-0.5 flex items-center gap-0.5">
                              Öffnen <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-6">
        <InfoNote>
          <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Die Reihenfolge ist eine Empfehlung – ihr könnt jederzeit vor- und zurückspringen. Nichts wird erzwungen.</span>
        </InfoNote>
      </div>
    </div>
  );
}
