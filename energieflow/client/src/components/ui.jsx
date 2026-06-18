import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';

export function Logo({ to = '/', compact = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5 group" aria-label="EnergieFlow Startseite">
      <img src="/logo-mark.jpeg" alt="" className="h-9 w-9 rounded-lg object-cover shadow-soft" />
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[19px] text-ink tracking-tight">EnergieFlow</span>
          <span className="block text-[11px] font-semibold text-green-deep tracking-wide uppercase">SolarGemeinschaft</span>
        </span>
      )}
    </Link>
  );
}

export function Pill({ children, tone = 'green' }) {
  const c = tone === 'amber' ? 'pill pill-amber' : tone === 'ghost' ? 'pill pill-ghost' : 'pill';
  return <span className={c}>{children}</span>;
}

export function Stat({ label, value, sub, tone }) {
  const color = tone === 'amber' ? 'text-amber-deep' : tone === 'green' ? 'text-green-deep' : 'text-ink';
  return (
    <div className="card p-4">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={`stat-num mt-1.5 ${color}`}>{value}</div>
      {sub && <div className="text-[12.5px] text-ink-soft mt-1">{sub}</div>}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="block text-[12px] text-ink-faint mt-1">{hint}</span>}
    </label>
  );
}

export function Spinner({ label }) {
  return (
    <div className="flex items-center gap-2 text-ink-soft text-sm">
      <Loader2 className="h-4 w-4 animate-spin" /> {label || 'Lädt …'}
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6"
         onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" />
      <div className={`relative w-full ${width} card p-5 sm:p-6 animate-[floaty_0s]`}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-xl">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-paper-2 text-ink-soft" aria-label="Schließen">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Kleiner Fortschrittsring (für Beteiligungsquote / Datenstand)
export function ProgressRing({ value = 0, size = 64, label }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e6dfcd" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#4f9d2e" strokeWidth="6"
                strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
                style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <span className="absolute font-display text-sm text-ink tnum">{Math.round(value)}%</span>
      {label && <span className="absolute -bottom-5 text-[11px] text-ink-faint whitespace-nowrap">{label}</span>}
    </div>
  );
}
