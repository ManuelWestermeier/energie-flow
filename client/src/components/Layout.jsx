import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogoWide, LogoMark } from './ui.jsx';
import { Menu, X, LogOut, ArrowRight, LayoutGrid } from 'lucide-react';

const PUBLIC_NAV = [
  { to: '/so-funktioniert-es', label: 'So funktioniert\u2019s' },
  { to: '/modell', label: 'Die Modelle' },
  { to: '/wirtschaftlichkeit', label: 'Wirtschaftlichkeit' },
  { to: '/faq', label: 'FAQ' },
];

// ===========================================================================
//  Öffentliches Layout (Marketing/Wissen)
// ===========================================================================
export function PublicLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-line">
        <div className="wrap flex items-center justify-between h-16">
          <Link to="/" className="flex items-center" aria-label="EnergieFlow Startseite">
            <LogoWide className="h-8 hidden sm:block" />
            <LogoMark className="h-9 w-9 sm:hidden" />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {PUBLIC_NAV.map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) => `px-3 py-2 rounded-[9px] text-[14px] font-medium ${isActive ? 'text-grass-deep bg-grass-soft/70' : 'text-ink-soft hover:text-ink hover:bg-paper-2'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/start" className="btn-primary btn-sm">Meine Projekte <ArrowRight className="h-4 w-4" /></Link>
            ) : (
              <>
                <Link to="/login" className="btn-quiet btn-sm hidden sm:inline-flex">Anmelden</Link>
                <Link to="/rechner" className="btn-primary btn-sm">Projekt starten</Link>
              </>
            )}
            <button className="md:hidden btn-ghost btn-sm !px-2" onClick={() => setOpen((v) => !v)} aria-label="Menü">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="flowrule flowrule-charge" />
        {open && (
          <div className="md:hidden border-b border-line bg-paper">
            <nav className="wrap py-2 flex flex-col">
              {PUBLIC_NAV.map((n) => (
                <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
                  className="px-2 py-2.5 rounded-[9px] text-[15px] text-ink-soft hover:bg-paper-2">{n.label}</NavLink>
              ))}
              {!user && <Link to="/login" onClick={() => setOpen(false)} className="px-2 py-2.5 text-[15px] text-ink-soft">Anmelden</Link>}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-paper">
      <div className="flowrule flowrule-charge" />
      <div className="wrap py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <LogoWide className="h-9" />
          <p className="text-[13px] text-ink-soft mt-3 max-w-xs">
            Gemeinsam Solarstrom aufs Mietshaus bringen – mit dem passenden Modell:
            gemeinschaftliche Gebäudeversorgung (§42b) oder Mieterstrom (§42a).
          </p>
        </div>
        <FootCol title="Loslegen" links={[['Schnellrechner', '/rechner'], ['So funktioniert\u2019s', '/so-funktioniert-es'], ['Anmelden', '/login']]} />
        <FootCol title="Wissen" links={[['Die Modelle', '/modell'], ['Wirtschaftlichkeit', '/wirtschaftlichkeit'], ['Häufige Fragen', '/faq']]} />
        <div>
          <div className="eyebrow mb-3">Hinweis</div>
          <p className="text-[12.5px] text-ink-faint leading-relaxed">
            Alle Berechnungen sind Schätzungen; erzeugte Anschreiben sind Entwürfe und
            ersetzen keine Rechts- oder Steuerberatung.
          </p>
          <p className="text-[12.5px] text-ink-faint mt-3">Projekt für YES! Young Economic Solutions 2026.</p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="wrap py-4 text-2xs text-ink-faint flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} EnergieFlow</span>
          <span>Datengrundlage: Ariadne-Analyse (Fischer/Henger, IW Köln, 2025)</span>
        </div>
      </div>
    </footer>
  );
}
function FootCol({ title, links }) {
  return (
    <div>
      <div className="eyebrow mb-3">{title}</div>
      <ul className="space-y-2">
        {links.map(([label, to]) => (
          <li key={to}><Link to={to} className="text-[13.5px] text-ink-soft hover:text-ink">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}

// ===========================================================================
//  Topbar für angemeldete Bereiche
// ===========================================================================
export function AppTopbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 bg-paper border-b border-line">
      <div className="wrap flex items-center justify-between h-14">
        <div className="flex items-center gap-4">
          <Link to="/start" aria-label="Meine Projekte"><LogoWide className="h-7 hidden sm:block" /><LogoMark className="h-8 w-8 sm:hidden" /></Link>
          <Link to="/start" className="hidden sm:flex items-center gap-1.5 text-[13.5px] text-ink-soft hover:text-ink">
            <LayoutGrid className="h-4 w-4" /> Meine Projekte
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/modell" className="hidden sm:inline text-[13.5px] text-ink-soft hover:text-ink">Wissensbereich</Link>
          <div className="flex items-center gap-2 pl-3 sm:border-l border-line">
            <span className="text-[13px] text-ink-soft hidden md:inline max-w-[10rem] truncate">{user?.name}</span>
            <button onClick={() => { logout(); nav('/'); }} className="btn-ghost btn-sm !px-2.5" title="Abmelden">
              <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flowrule flowrule-charge" />
    </header>
  );
}

// Einfaches App-Layout (z. B. Dashboard) – Topbar + zentrierter Inhalt
export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppTopbar />
      <main className="flex-1 wrap py-8"><Outlet /></main>
    </div>
  );
}
