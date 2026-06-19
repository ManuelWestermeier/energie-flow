import { useState } from 'react';
import { ProgressRing } from './ui.jsx';
import { de } from '../lib/format.js';
// docx-Erzeugung wird erst bei Bedarf nachgeladen (schlankerer Start).
const genDoc = async (name, ...args) => {
  const m = await import('../lib/docs.js');
  return m[name](...args);
};
import {
  Users, UserPlus, Link2, Check, Copy, KeyRound, Home, CheckCircle2,
  FileText, FileSignature, Download, ThumbsUp, Lock, Mail, Building2,
} from 'lucide-react';

const ROLE = {
  admin: { label: 'Initiator:in', cls: 'pill' },
  mieter: { label: 'Mieter:in', cls: 'pill pill-ghost' },
  vermieter: { label: 'Eigentümerseite', cls: 'pill pill-amber' },
};
const initials = (n = '?') => n.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();

// ===========================================================================
//  Mitglieder + eigene Daten bestätigen
// ===========================================================================
export function MemberPanel({ project, me, onConfirm }) {
  const [wohnung, setWohnung] = useState(me?.wohnung || '');
  const [verbrauch, setVerbrauch] = useState(me?.verbrauch ?? '');
  const [busy, setBusy] = useState(false);
  const needsConfirm = me && me.role !== 'vermieter' && !me.confirmed;

  const save = async () => {
    setBusy(true);
    try { await onConfirm({ wohnung, verbrauch: verbrauch === '' ? undefined : +verbrauch, status: 'zugesagt', confirmed: true }); }
    finally { setBusy(false); }
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Users className="h-5 w-5 text-green-deep" /><h2 className="text-xl">Hausgemeinschaft</h2></div>
        <span className="text-[13px] text-ink-soft">{(project.members || []).length} dabei</span>
      </div>

      {needsConfirm && (
        <div className="rounded-xl border border-green/40 bg-green-soft/50 p-4 mb-4">
          <div className="font-semibold text-ink text-sm mb-2 flex items-center gap-1.5"><Home className="h-4 w-4 text-green-deep" />Bestätige kurz deine Daten</div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <input className="input !py-2 text-sm" value={wohnung} onChange={(e) => setWohnung(e.target.value)} placeholder="Wohnung (z. B. 2. OG)" />
            <input className="input !py-2 text-sm" type="number" value={verbrauch} onChange={(e) => setVerbrauch(e.target.value)} placeholder="Jahresverbrauch kWh" />
          </div>
          <button onClick={save} disabled={busy} className="btn-primary w-full mt-2.5 !py-2">
            {busy ? 'Speichere …' : 'Daten bestätigen & mitmachen'} <Check className="h-4 w-4" />
          </button>
        </div>
      )}

      <ul className="divide-y divide-line">
        {(project.members || []).map((m) => {
          const role = ROLE[m.role] || ROLE.mieter;
          const isMe = me && m.userId === me.userId;
          return (
            <li key={m.id} className="flex items-center gap-3 py-2.5">
              {m.picture
                ? <img src={m.picture} alt="" className="h-9 w-9 rounded-full object-cover" />
                : <span className="h-9 w-9 rounded-full bg-green-soft text-green-deep grid place-items-center text-[12px] font-bold">{initials(m.name)}</span>}
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] text-ink truncate">{m.name}{isMe && <span className="text-ink-faint"> (du)</span>}</div>
                <div className="text-[12px] text-ink-faint">
                  {m.wohnung || '—'}{m.verbrauch != null ? ` · ${de(m.verbrauch)} kWh/a` : ''}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {m.confirmed && <CheckCircle2 className="h-4 w-4 text-green-deep" title="Daten bestätigt" />}
                <span className={role.cls}>{role.label}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ===========================================================================
//  Einladungen (Mieter-Link + individuelle Vermieter-Links)
// ===========================================================================
function CopyLink({ url, tone = 'green' }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch {}
    setOk(true); setTimeout(() => setOk(false), 1600);
  };
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 text-[12px] text-ink-soft bg-paper-2 rounded-lg px-2.5 py-2 truncate">{url}</code>
      <button onClick={copy} className={`btn-soft !px-3 !py-2 ${tone === 'amber' ? '!bg-amber-soft !text-amber-deep' : ''}`}>
        {ok ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function InvitePanel({ project, isAdmin, origin, onInvite }) {
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const link = (t) => `${origin}/join/${t}`;
  const mieterInvite = (project.invites || []).find((i) => i.role === 'mieter');
  const vermieterInvites = (project.invites || []).filter((i) => i.role === 'vermieter');

  const add = async (role, lbl) => {
    setBusy(true);
    try { await onInvite({ role, label: lbl || undefined }); setLabel(''); }
    finally { setBusy(false); }
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4"><UserPlus className="h-5 w-5 text-green-deep" /><h2 className="text-xl">Einladen</h2></div>

      {/* Mieter */}
      <div className="mb-5">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint mb-2 flex items-center gap-1.5"><Home className="h-3.5 w-3.5" />Nachbar:innen</div>
        {mieterInvite ? (
          <CopyLink url={link(mieterInvite.token)} />
        ) : isAdmin ? (
          <button onClick={() => add('mieter')} disabled={busy} className="btn-ghost w-full"><Link2 className="h-4 w-4" /> Einladungslink für Mieter:innen erstellen</button>
        ) : <p className="text-[13px] text-ink-faint">Noch kein Link vorhanden.</p>}
      </div>

      {/* Vermieter */}
      <div>
        <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint mb-2 flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" />Eigentümerseite</div>
        {vermieterInvites.length > 0 && (
          <ul className="space-y-2.5 mb-3">
            {vermieterInvites.map((i) => (
              <li key={i.id}>
                <div className="text-[13px] text-ink mb-1 flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-amber-deep" />{i.label || 'Eigentümer:in'}{i.used > 0 && <span className="text-green-deep text-[11px]">· beigetreten</span>}</div>
                <CopyLink url={link(i.token)} tone="amber" />
              </li>
            ))}
          </ul>
        )}
        {isAdmin ? (
          <div className="flex gap-2">
            <input className="input !py-2 text-sm" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name (z. B. Hausverwaltung Müller)" />
            <button onClick={() => add('vermieter', label)} disabled={busy} className="btn-amber !px-3 !py-2 shrink-0"><UserPlus className="h-4 w-4" /></button>
          </div>
        ) : vermieterInvites.length === 0 && <p className="text-[13px] text-ink-faint">Noch keine Eigentümer-Einladung.</p>}
        <p className="text-[11.5px] text-ink-faint mt-2">Pro Vermieter:in ein eigener Link – so lässt sich jede:r einzeln ansprechen.</p>
      </div>
    </div>
  );
}

// ===========================================================================
//  Zustimmung / Konsens
// ===========================================================================
export function ConsentPanel({ project, me, onConsent }) {
  const [busy, setBusy] = useState(false);
  const c = project.consent || { agreedCount: 0, activeCount: 0, consensus: false };
  const share = Math.round(project.share_pct);

  const toggle = async (agreed) => {
    setBusy(true);
    try { await onConsent(agreed); } finally { setBusy(false); }
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4"><ThumbsUp className="h-5 w-5 text-green-deep" /><h2 className="text-xl">Einigung</h2></div>

      {c.consensus ? (
        <div className="rounded-xl bg-green-soft p-4 text-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-deep mx-auto mb-1.5" />
          <div className="font-display text-lg text-green-ink">Alle sind sich einig!</div>
          <div className="text-[13px] text-green-deep">Preis: {share} % des Grundpreises. Die Verträge können erstellt werden.</div>
        </div>
      ) : (
        <div className="flex items-center gap-4 mb-4">
          <ProgressRing value={c.activeCount ? (c.agreedCount / c.activeCount) * 100 : 0} size={64} />
          <div className="text-[13.5px] text-ink-soft">
            <strong className="text-ink">{c.agreedCount} von {c.activeCount}</strong> stimmen dem aktuellen
            Preis von <strong className="text-ink">{share} %</strong> zu.
          </div>
        </div>
      )}

      {me && (
        me.agreed ? (
          <button onClick={() => toggle(false)} disabled={busy} className="btn-ghost w-full">Zustimmung zurückziehen</button>
        ) : (
          <button onClick={() => toggle(true)} disabled={busy} className="btn-primary w-full">
            {busy ? '…' : `Ich stimme ${share} % zu`} <ThumbsUp className="h-4 w-4" />
          </button>
        )
      )}
    </div>
  );
}

// ===========================================================================
//  Dokumente
// ===========================================================================
export function DocsPanel({ project, me, isAdmin, origin, quote, share }) {
  const opts = { origin, quotePct: quote, sharePct: share };
  const consensus = project.consent?.consensus;
  const vermieterInvites = (project.invites || []).filter((i) => i.role === 'vermieter');
  const tenants = (project.members || []).filter((m) => m.role !== 'vermieter' && m.status !== 'abgelehnt');

  const Btn = ({ icon, onClick, children, tone }) => (
    <button onClick={onClick} className={`btn-ghost w-full justify-start ${tone === 'green' ? '!border-green/40' : ''}`}>
      <span className="text-green-deep">{icon}</span><span className="flex-1 text-left">{children}</span><Download className="h-4 w-4 text-ink-faint" />
    </button>
  );

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1"><FileText className="h-5 w-5 text-green-deep" /><h2 className="text-xl">Dokumente</h2></div>
      <p className="text-[13px] text-ink-soft mb-4">Echte Word-Dateien (.docx) – mit euren aktuellen Zahlen.</p>

      <div className="space-y-2.5">
        <Btn icon={<FileText className="h-4 w-4" />} onClick={() => genDoc('buildWirtschaftlichkeit', project, opts)}>Wirtschaftlichkeitsanalyse</Btn>

        {isAdmin && (
          <Btn icon={<Mail className="h-4 w-4" />} onClick={() => genDoc('buildMitmieterLetter', project, null, opts)}>Anschreiben an Mitmieter:innen</Btn>
        )}

        {isAdmin && (vermieterInvites.length > 0 ? (
          vermieterInvites.map((inv) => (
            <Btn key={inv.id} icon={<Mail className="h-4 w-4" />} onClick={() => genDoc('buildVermieterLetter', project, inv, opts)}>
              Anschreiben: {inv.label || 'Eigentümer:in'}
            </Btn>
          ))
        ) : (
          <Btn icon={<Mail className="h-4 w-4" />} onClick={() => genDoc('buildVermieterLetter', project, null, opts)}>Anschreiben an Vermieter:in</Btn>
        ))}
      </div>

      {/* Verträge: erst nach Einigung */}
      <div className="mt-4 pt-4 border-t border-line">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint mb-2.5 flex items-center gap-1.5">
          {consensus ? <FileSignature className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />} GGV-Verträge
        </div>
        {consensus ? (
          <div className="space-y-2.5">
            {isAdmin
              ? tenants.map((m) => (
                  <Btn key={m.id} tone="green" icon={<FileSignature className="h-4 w-4" />} onClick={() => genDoc('buildVertrag', project, m, opts)}>Vertrag: {m.name}</Btn>
                ))
              : me && me.role !== 'vermieter' && (
                  <Btn tone="green" icon={<FileSignature className="h-4 w-4" />} onClick={() => genDoc('buildVertrag', project, me, opts)}>Meinen Vertrag herunterladen</Btn>
                )}
          </div>
        ) : (
          <p className="text-[13px] text-ink-faint">Werden freigeschaltet, sobald sich alle auf einen Preis geeinigt haben.</p>
        )}
      </div>
    </div>
  );
}
