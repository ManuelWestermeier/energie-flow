import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { PageHead, Spinner, StatusChip, EmptyState, LogoMark } from '../components/ui.jsx';
import { relTime } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Plus, ArrowRight, Users, Zap, FolderOpen, BookOpen } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.listProjects().then(setProjects).catch((e) => { setErr(e.message); setProjects([]); });
  }, []);

  return (
    <div>
      <PageHead
        eyebrow={`Hallo, ${user?.name?.split(' ')[0] || ''}`}
        title="Meine Projekte"
        sub="Deine Solar-Initiativen im Überblick. Jedes Projekt ist ein eigener Arbeitsbereich für die Hausgemeinschaft."
        actions={<Link to="/rechner" className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Neues Projekt</Link>}
      />

      {err && <div className="chip-danger mb-4">{err}</div>}
      {projects === null ? <Spinner label="Projekte werden geladen …" />
        : projects.length === 0 ? (
          <div className="card">
            <EmptyState icon={<FolderOpen className="h-5 w-5" />} title="Noch kein Projekt">
              Starte mit dem Schnellrechner: ein paar Eckdaten zum Haus genügen für die erste Schätzung.
            </EmptyState>
            <div className="px-5 pb-6 text-center">
              <Link to="/rechner" className="btn-primary btn-sm mx-auto w-max"><Plus className="h-4 w-4" /> Projekt starten</Link>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Link key={p.id} to={`/projekt/${p.id}`} className="card p-4 hover:shadow-raise hover:border-line-strong transition group">
                <div className="flex items-start gap-3">
                  <LogoMark className="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-[15px] leading-tight truncate">{p.name}</div>
                    <div className="text-2xs text-ink-faint truncate mt-0.5">{[p.street, p.hausnr].filter(Boolean).join(' ') || p.ort || '—'}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-faint group-hover:text-grass-deep transition shrink-0" />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <StatusChip status={p.status} />
                  <div className="flex items-center gap-3 text-2xs text-ink-faint tnum">
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{p.members}</span>
                    <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3" />{p.kwp} kWp</span>
                  </div>
                </div>
                <div className="text-2xs text-ink-faint mt-2">Zuletzt {relTime(p.updated_at)}</div>
              </Link>
            ))}
          </div>
        )}

      <div className="mt-8 card p-4 flex items-center gap-3">
        <span className="h-9 w-9 rounded-card bg-grass-soft grid place-items-center shrink-0"><BookOpen className="h-4 w-4 text-grass-deep" /></span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium">Wie funktioniert das Modell?</div>
          <div className="text-2xs text-ink-faint">Rechtsrahmen (§42b EnWG), Ablauf und ehrliche Wirtschaftlichkeit im Wissensbereich.</div>
        </div>
        <Link to="/modell" className="btn-ghost btn-sm shrink-0">Öffnen</Link>
      </div>
    </div>
  );
}
