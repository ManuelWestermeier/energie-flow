import { useState } from 'react';
import { useProject } from '../../context/ProjectContext.jsx';
import { PageHead, Avatar, ProgressBar, Field, InfoNote, EmptyState } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { committedQuote } from '../../lib/economics.js';
import { pct, kwh } from '../../lib/format.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Users, Copy, Check, UserPlus, Home, Mail } from 'lucide-react';

const ROLE = {
  admin: { label: 'Admin', cls: 'chip-grass' },
  mieter: { label: 'Mieter:in', cls: 'chip-muted' },
  vermieter: { label: 'Eigentümerseite', cls: 'chip-sun' },
};
const origin = () => (typeof window !== 'undefined' ? window.location.origin : '');

export default function Community() {
  const { project, setProject, me, isAdmin } = useProject();
  const { user } = useAuth();
  const members = project.members || [];
  const tenants = members.filter((m) => m.role !== 'vermieter');
  const zugesagt = tenants.filter((m) => m.status === 'zugesagt').length;
  const quote = committedQuote(project);

  return (
    <div className="space-y-6">
      <PageHead eyebrow="Hausgemeinschaft" title="Wer macht mit"
        sub="Je mehr Wohnungen zusagen, desto wirtschaftlicher die Anlage und desto stärker eure Verhandlungsposition." />

      {/* Beteiligung */}
      <div className="card p-5">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="eyebrow">Beteiligung im Haus</div>
            <div className="font-display text-3xl font-bold tnum mt-1">{pct(quote, 0)}</div>
          </div>
          <div className="text-right text-[13px] text-ink-soft">
            <div className="tnum"><strong className="text-ink">{zugesagt}</strong> von {project.we} WE zugesagt</div>
            <div className="text-ink-faint text-2xs mt-0.5">{members.length} Mitglieder im Projekt</div>
          </div>
        </div>
        <ProgressBar value={quote} />
        {quote < 50 && <p className="text-2xs text-ink-faint mt-2">Ziel für eine tragfähige Anlage: mindestens 50 % der Wohnungen.</p>}
      </div>

      {/* Meine Daten */}
      {me && <MyData project={project} setProject={setProject} me={me} userName={user?.name} />}

      {/* Mitgliederliste */}
      <section className="card">
        <div className="px-4 py-3 border-b border-line flex items-center gap-2"><Users className="h-4 w-4 text-grass-deep" /><h3>Mitglieder</h3></div>
        <ul className="divide-y divide-line">
          {members.map((m) => {
            const role = ROLE[m.role] || ROLE.mieter;
            const mine = m.userId === user?.id;
            return (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={m.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium truncate">{m.name}{mine && <span className="text-ink-faint font-normal"> (du)</span>}</span>
                    <span className={role.cls}>{role.label}</span>
                  </div>
                  <div className="text-2xs text-ink-faint mt-0.5">
                    {m.wohnung ? `Wohnung ${m.wohnung}` : 'Wohnung offen'}
                    {m.verbrauch ? ` · ${kwh(m.verbrauch)}/a` : ''}
                  </div>
                </div>
                {m.role !== 'vermieter' && (
                  m.status === 'zugesagt'
                    ? <span className="chip-grass"><Check className="h-3 w-3" /> Zugesagt</span>
                    : <span className="chip-muted">Beigetreten</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Einladungen */}
      {isAdmin ? <Invites project={project} setProject={setProject} />
        : <InfoNote>Nur der/die Admin kann Einladungslinks erstellen. Teile den erhaltenen Link gern weiter, damit mehr Wohnungen mitmachen.</InfoNote>}
    </div>
  );
}

function MyData({ project, setProject, me, userName }) {
  const [wohnung, setWohnung] = useState(me.wohnung || '');
  const [verbrauch, setVerbrauch] = useState(me.verbrauch || '');
  const [saving, setSaving] = useState(false);
  const confirmed = me.status === 'zugesagt';

  async function save(zusagen) {
    setSaving(true);
    try {
      setProject(await api.confirmMe(project.id, {
        wohnung, household: userName, verbrauch: verbrauch === '' ? null : Number(verbrauch),
        status: zusagen ? 'zugesagt' : me.status, confirmed: zusagen ? true : me.confirmed,
      }));
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  return (
    <section className="card p-5">
      <div className="flex items-center gap-2 mb-3"><Home className="h-4 w-4 text-grass-deep" /><h3>Meine Daten</h3>
        {confirmed && <span className="chip-grass ml-1"><Check className="h-3 w-3" /> zugesagt</span>}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Wohnung / Lage" hint="z. B. „2. OG links“">
          <input className="input" value={wohnung} onChange={(e) => setWohnung(e.target.value)} placeholder="2. OG links" />
        </Field>
        <Field label="Stromverbrauch pro Jahr (kWh)" hint="Optional – macht die Analyse gebäudegenau.">
          <input type="number" className="input tnum" value={verbrauch} onChange={(e) => setVerbrauch(e.target.value)} placeholder="2200" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={() => save(false)} disabled={saving} className="btn-ghost btn-sm">Nur speichern</button>
        {!confirmed && <button onClick={() => save(true)} disabled={saving} className="btn-primary btn-sm"><Check className="h-4 w-4" /> Daten bestätigen & zusagen</button>}
      </div>
    </section>
  );
}

function Invites({ project, setProject }) {
  const invites = project.invites || [];
  const tenantLinks = invites.filter((i) => i.role === 'mieter');
  const ownerLinks = invites.filter((i) => i.role === 'vermieter');
  const [busy, setBusy] = useState('');

  async function create(role) {
    setBusy(role);
    try { await api.createInvite(project.id, { role }); setProject(await api.getProject(project.id)); }
    catch (e) { alert(e.message); } finally { setBusy(''); }
  }

  return (
    <section className="grid md:grid-cols-2 gap-4">
      <InviteCol
        icon={<UserPlus className="h-4 w-4 text-grass-deep" />} title="Nachbar:innen einladen"
        desc="Ein Link für alle Mietparteien – beliebig oft teilbar." links={tenantLinks}
        onCreate={() => create('mieter')} busy={busy === 'mieter'} cta="Mieter-Link erstellen"
      />
      <InviteCol
        icon={<Mail className="h-4 w-4 text-sun-deep" />} title="Eigentümerseite einladen"
        desc="Persönlicher Zugang für die Vermieter- oder Eigentümerseite." links={ownerLinks}
        onCreate={() => create('vermieter')} busy={busy === 'vermieter'} cta="Eigentümer-Link erstellen" sun
      />
    </section>
  );
}

function InviteCol({ icon, title, desc, links, onCreate, busy, cta, sun }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">{icon}<h3>{title}</h3></div>
      <p className="text-[13px] text-ink-soft mb-3">{desc}</p>
      {links.length === 0 ? (
        <EmptyState title="Noch kein Link" />
      ) : (
        <ul className="space-y-2 mb-3">{links.map((i) => <CopyRow key={i.id} link={`${origin()}/join/${i.token}`} used={i.used} />)}</ul>
      )}
      <button onClick={onCreate} disabled={busy} className={`${sun ? 'btn-sun' : 'btn-primary'} btn-sm`}>{busy ? 'Erstellt …' : cta}</button>
    </div>
  );
}

function CopyRow({ link, used }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(link); setDone(true); setTimeout(() => setDone(false), 1500); }
    catch { /* ignore */ }
  }
  return (
    <li className="flex items-center gap-2 rounded-[10px] border border-line bg-paper-2 px-2.5 py-1.5">
      <span className="text-2xs text-ink-soft truncate flex-1 tnum">{link}</span>
      {used > 0 && <span className="text-2xs text-ink-faint shrink-0">{used}×</span>}
      <button onClick={copy} className="btn-quiet btn-sm !px-1.5 shrink-0">{done ? <Check className="h-4 w-4 text-grass-deep" /> : <Copy className="h-4 w-4" />}</button>
    </li>
  );
}
