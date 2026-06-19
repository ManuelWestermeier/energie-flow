import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page } from '../components/Layout.jsx';
import { Spinner } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { dateDE } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Plus, MapPin, Users, ArrowRight, Sparkles } from 'lucide-react';

const STATUS = {
  sammeln: { label: 'Daten sammeln', cls: 'pill' },
  verhandeln: { label: 'In Verhandlung', cls: 'pill pill-amber' },
  vereinbart: { label: 'Vereinbart', cls: 'pill' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [projects, setProjects] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.listProjects().then(setProjects).catch((e) => { setErr(e.message); setProjects([]); });
  }, []);

  return (
    <Page>
      <div className="wrap py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl">Hallo {user?.name?.split(' ')[0] || 'zusammen'} 👋</h1>
            <p className="text-ink-soft mt-1">Deine Solarprojekte auf einen Blick.</p>
          </div>
          <Link to="/rechner" className="btn-primary"><Plus className="h-4 w-4" /> Neues Projekt</Link>
        </div>

        {projects === null && <div className="py-16"><Spinner label="Projekte werden geladen …" /></div>}
        {err && <p className="text-amber-deep">{err}</p>}

        {projects && projects.length === 0 && (
          <div className="card p-10 text-center">
            <div className="inline-grid place-items-center h-14 w-14 rounded-2xl bg-green-soft text-green-deep mb-4">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="text-2xl mb-1">Noch kein Projekt</h2>
            <p className="text-ink-soft mb-6 max-w-md mx-auto">
              Starte mit dem Rechner: ein paar Angaben zu deinem Haus, und dein erstes Projekt steht.
            </p>
            <button onClick={() => nav('/rechner')} className="btn-primary mx-auto">
              Projekt erstellen <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {projects && projects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const st = STATUS[p.status] || STATUS.sammeln;
              return (
                <Link key={p.id} to={`/projekt/${p.id}`}
                      className="card p-5 hover:shadow-lift transition group">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg leading-snug group-hover:text-green-deep transition">{p.name}</h3>
                    <span className={st.cls}>{st.label}</span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-[13.5px] text-ink-soft">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-ink-faint" />
                      {[p.street, p.hausnr].filter(Boolean).join(' ') + (p.ort ? `, ${p.ort}` : '') || '—'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-ink-faint" />
                      {p.members} {p.members === 1 ? 'Teilnehmer:in' : 'Teilnehmer:innen'} · Preisanteil {Math.round(p.share_pct)} %
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[12px] text-ink-faint">
                    <span>Aktualisiert {dateDE(p.updated_at)}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
}
