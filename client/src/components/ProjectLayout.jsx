import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { ProjectProvider, useProject } from '../context/ProjectContext.jsx';
import { AppTopbar } from './Layout.jsx';
import { Spinner, StatusChip, ProgressBar, LogoMark } from './ui.jsx';
import { overall, currentPhase } from '../lib/phases.js';
import {
  LayoutDashboard, ListChecks, Building2, Users, BarChart3, Handshake,
  FileText, Activity, Settings, ChevronRight, AlertCircle, MapPin,
} from 'lucide-react';

const SECTIONS = [
  { to: 'uebersicht', label: 'Übersicht', icon: LayoutDashboard },
  { to: 'fahrplan', label: 'Fahrplan', icon: ListChecks },
  { to: 'gebaeude', label: 'Gebäude & Anlage', icon: Building2 },
  { to: 'gemeinschaft', label: 'Hausgemeinschaft', icon: Users },
  { to: 'wirtschaftlichkeit', label: 'Wirtschaftlichkeit', icon: BarChart3 },
  { to: 'verhandlung', label: 'Verhandlung', icon: Handshake },
  { to: 'dokumente', label: 'Dokumente', icon: FileText },
  { to: 'aktivitaet', label: 'Aktivität', icon: Activity },
  { to: 'einstellungen', label: 'Einstellungen', icon: Settings },
];
const LABEL = Object.fromEntries(SECTIONS.map((s) => [s.to, s.label]));

export default function ProjectLayout() {
  return (
    <ProjectProvider>
      <Shell />
    </ProjectProvider>
  );
}

function Shell() {
  const { project, loading, error, id } = useProject();
  const loc = useLocation();
  const seg = loc.pathname.split('/').pop();

  return (
    <div className="min-h-screen flex flex-col">
      <AppTopbar />

      {error ? (
        <div className="flex-1 wrap py-20 text-center max-w-md">
          <AlertCircle className="h-9 w-9 text-sun-deep mx-auto mb-3" />
          <h1 className="mb-1">Kein Zugriff</h1>
          <p className="text-ink-soft mb-6">{error}</p>
          <Link to="/start" className="btn-ghost mx-auto w-max">Zu meinen Projekten</Link>
        </div>
      ) : loading || !project ? (
        <div className="flex-1 wrap py-24"><Spinner label="Projekt wird geladen …" /></div>
      ) : (
        <div className="flex-1 wrap py-5 lg:py-7">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[12.5px] text-ink-faint mb-3">
            <Link to="/start" className="hover:text-ink">Meine Projekte</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink-soft truncate max-w-[40vw]">{project.name}</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink">{LABEL[seg] || 'Übersicht'}</span>
          </nav>

          {/* Mobile-Tabs */}
          <div className="lg:hidden -mx-4 px-4 mb-4 overflow-x-auto">
            <div className="flex gap-1.5 w-max">
              {SECTIONS.map((s) => (
                <NavLink key={s.to} to={s.to}
                  className={({ isActive }) => `whitespace-nowrap px-3 py-1.5 rounded-pill text-[13px] font-medium border ${isActive ? 'bg-grass-soft text-grass-ink border-grass/30' : 'bg-paper text-ink-soft border-line'}`}>
                  {s.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[244px_minmax(0,1fr)] lg:gap-7">
            <Sidebar project={project} />
            <div className="min-w-0 animate-risein"><Outlet /></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ project }) {
  const ov = overall(project);
  const cp = currentPhase(project);
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 space-y-4">
        <div className="card p-4">
          <div className="flex items-start gap-2.5">
            <LogoMark className="h-9 w-9" />
            <div className="min-w-0">
              <div className="font-display font-bold text-[15px] leading-tight truncate">{project.name}</div>
              <div className="text-2xs text-ink-faint flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="h-3 w-3" />
                {[project.street, project.hausnr].filter(Boolean).join(' ') || 'Adresse offen'}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <StatusChip status={project.status} />
            <span className="text-2xs text-ink-faint tnum">{ov.pct}% erledigt</span>
          </div>
          <div className="mt-2"><ProgressBar value={ov.pct} height={6} /></div>
          <div className="mt-2 text-2xs text-ink-faint">
            Aktuelle Phase: <span className="text-ink-soft font-medium">{cp.n}. {cp.title}</span>
          </div>
        </div>

        <nav className="card current-nav space-y-0.5">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <NavLink key={s.to} to={s.to}
                className={({ isActive }) => `navlink ${isActive ? 'navlink-active' : ''}`}>
                <Icon className="h-4 w-4 shrink-0" />{s.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
