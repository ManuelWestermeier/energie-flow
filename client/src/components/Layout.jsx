import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, LayoutGrid, Calculator } from 'lucide-react';
import { Logo } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function navClass({ isActive }) {
  return `text-sm font-semibold px-3 py-2 rounded-lg transition ${
    isActive ? 'text-green-deep bg-green-soft' : 'text-ink-soft hover:text-ink hover:bg-paper-2'
  }`;
}

export function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <div className="wrap flex items-center justify-between h-16">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/rechner" className={navClass}>
            <span className="inline-flex items-center gap-1.5"><Calculator className="h-4 w-4" />Rechner</span>
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={navClass}>
              <span className="inline-flex items-center gap-1.5"><LayoutGrid className="h-4 w-4" />Projekte</span>
            </NavLink>
          )}
          {user ? (
            <div className="flex items-center gap-2 pl-1 sm:pl-2 sm:ml-1 sm:border-l border-line">
              <span className="hidden sm:inline text-sm text-ink-soft max-w-[140px] truncate">{user.name}</span>
              <button onClick={() => { logout(); nav('/'); }} className="btn-ghost !px-2.5 !py-2" title="Abmelden">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary !py-2">Anmelden</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-paper-2/70">
      <div className="wrap py-9 grid gap-6 sm:grid-cols-3 text-sm text-ink-soft">
        <div>
          <Logo compact />
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed">
            Mieter:innen organisieren gemeinsam eine Solaranlage aufs Mietshaus –
            über die gemeinschaftliche Gebäudeversorgung (GGV, §42b EnWG).
          </p>
        </div>
        <div>
          <div className="font-semibold text-ink mb-2">Rechtsrahmen</div>
          <ul className="space-y-1 text-[13px]">
            <li>§42b EnWG · GGV (freie Preisgestaltung)</li>
            <li>§42a EnWG · Mieterstrom (90-%-Grenze)</li>
            <li>Solarpaket I · seit 16.05.2024</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-ink mb-2">Hinweis</div>
          <p className="text-[13px] leading-relaxed">
            Alle Berechnungen sind Schätzungen auf Basis der Ariadne-Analyse (IW Köln, 2025).
            Erzeugte Schreiben und Verträge sind Entwürfe und ersetzen keine Rechts- oder Steuerberatung.
          </p>
        </div>
      </div>
    </footer>
  );
}
