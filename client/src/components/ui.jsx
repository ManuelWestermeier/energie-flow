import { useEffect } from 'react';
import { Loader2, X } from 'lucide-react';

// ---- Marke (echte Logo-Dateien, kein Schrift-Logo) ------------------------
export const LogoWide = ({ className = 'h-8' }) => (
  <img src="/logo-wide.jpeg" alt="EnergieFlow" className={className} draggable="false" />
);
export const LogoMark = ({ className = 'h-9 w-9' }) => (
  <img src="/logo-mark.jpeg" alt="EnergieFlow" className={`${className} rounded-[8px]`} draggable="false" />
);

export function Spinner({ label }) {
  return (
    <div className="flex items-center justify-center gap-2 text-ink-faint py-8">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export const Eyebrow = ({ children }) => <div className="eyebrow">{children}</div>;

export function PageHead({ eyebrow, title, sub, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-1">{title}</h1>
        {sub && <p className="text-ink-soft mt-1.5 max-w-prose2 text-[14.5px]">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, tone, icon }) {
  const t = tone === 'grass' ? 'text-grass-deep' : tone === 'sun' ? 'text-sun-deep' : 'text-ink';
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <div className="kpi-label">{label}</div>
        {icon && <span className="text-ink-faint">{icon}</span>}
      </div>
      <div className={`font-display text-[1.7rem] leading-none font-bold tnum mt-1.5 tracking-tight ${t}`}>{value}</div>
      {sub && <div className="text-[12px] text-ink-faint mt-0.5">{sub}</div>}
    </div>
  );
}

export function Metric({ value, unit, tone, className = '' }) {
  const t = tone === 'grass' ? 'text-grass-deep' : tone === 'sun' ? 'text-sun-deep' : '';
  return <span className={`metric ${t} ${className}`}>{value}{unit ? <span className="metric-unit"> {unit}</span> : null}</span>;
}

// Fortschrittsbalken in der Markenfarbe (grün -> orange „Flussschiene")
export function ProgressBar({ value = 0, height = 8 }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="rounded-pill bg-line overflow-hidden" style={{ height }}>
      <div className="h-full rounded-pill transition-all" style={{ width: `${v}%`, background: 'var(--flow)', boxShadow: v > 0 ? '0 0 10px rgba(120,160,40,.45)' : 'none' }} />
    </div>
  );
}

// Ring mit Markenverlauf
export function Donut({ value = 0, size = 64, stroke = 7, label }) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const id = 'g' + Math.round(size) + Math.round(v);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3f8f2c" />
          <stop offset="100%" stopColor="#e3851d" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e8e1" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        className="font-display font-bold fill-ink" style={{ fontSize: size * 0.28 }}>
        {label != null ? label : `${Math.round(v)}%`}
      </text>
    </svg>
  );
}

const initials = (n = '?') => n.trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
export function Avatar({ name, size = 36 }) {
  return (
    <span className="rounded-full bg-grass-soft text-grass-deep grid place-items-center font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(name)}
    </span>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="block text-2xs text-ink-faint mt-1">{hint}</span>}
    </label>
  );
}

const STATUS = {
  sammeln: { label: 'Daten sammeln', cls: 'chip-info' },
  verhandeln: { label: 'In Verhandlung', cls: 'chip-sun' },
  vereinbart: { label: 'Vereinbart', cls: 'chip-grass' },
};
export function StatusChip({ status }) {
  const s = STATUS[status] || STATUS.sammeln;
  return <span className={s.cls}>{s.label}</span>;
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink/30 backdrop-blur-[2px]" onClick={onClose}>
      <div className={`card shadow-pop w-full ${width} max-h-[90vh] overflow-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line sticky top-0 bg-paper">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button onClick={onClose} className="btn-quiet btn-sm !px-2"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, children }) {
  return (
    <div className="text-center py-10 px-4">
      {icon && <div className="mx-auto mb-3 h-11 w-11 grid place-items-center rounded-full bg-paper-2 text-ink-faint">{icon}</div>}
      <div className="font-display font-semibold text-ink">{title}</div>
      {children && <div className="text-[13.5px] text-ink-soft mt-1 max-w-md mx-auto">{children}</div>}
    </div>
  );
}

export function InfoNote({ children, tone = 'info' }) {
  const map = { info: 'bg-info-soft text-info', grass: 'bg-grass-soft text-grass-ink', sun: 'bg-sun-soft text-sun-ink' };
  return <div className={`rounded-card p-3.5 text-[13px] ${map[tone] || map.info}`}>{children}</div>;
}
