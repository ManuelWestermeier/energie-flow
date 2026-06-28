import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext.jsx';
import { PageHead, Avatar, ProgressBar, Field, InfoNote, EmptyState } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { committedQuote, consumptionStats, paramsFromProject, scenario, selfPerHousehold, CONS_REF } from '../../lib/economics.js';
import { pct, kwh, ct, eur } from '../../lib/format.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Users, Copy, Check, UserPlus, Home, Mail, Zap, TrendingUp, MinusCircle } from 'lucide-react';

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
  const cs = consumptionStats(project);
  const E = paramsFromProject(project);
  const r = scenario(E, { quotePct: quote || 100, sharePct: project.share_pct, consumptionFactor: cs.factor });

  return (
    <div className="space-y-6">
      <PageHead eyebrow="Hausgemeinschaft" title="Wer macht mit"
        sub="Je mehr Wohnungen zusagen und je mehr Verbrauch sie einbringen, desto mehr Solarstrom wird direkt im Haus genutzt – das macht die Anlage wirtschaftlicher und eure Position stärker." />

      {/* Beteiligung + Verbrauch */}
      <div className="card p-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <div className="flex items-end justify-between mb-2">
              <div><div className="eyebrow">Beteiligung im Haus</div>
                <div className="font-display text-3xl font-bold tnum mt-1">{pct(quote, 0)}</div></div>
              <div className="text-right text-[13px] text-ink-soft">
                <div className="tnum"><strong className="text-ink">{zugesagt}</strong> von {project.we} WE</div>
                <div className="text-ink-faint text-2xs mt-0.5">{members.length} im Projekt</div></div>
            </div>
            <ProgressBar value={quote} />
            {quote < 50 && <p className="text-2xs text-ink-faint mt-2">Ziel für eine tragfähige Anlage: mindestens 50 % der Wohnungen.</p>}
          </div>
          <div>
            <div className="flex items-end justify-between mb-2">
              <div><div className="eyebrow">Erfasster Verbrauch</div>
                <div className="font-display text-3xl font-bold tnum mt-1">{cs.reported}<span className="text-base font-semibold text-ink-faint">/{tenants.length}</span></div></div>
              <div className="text-right text-[13px] text-ink-soft">
                <div className="tnum">Ø <strong className="text-ink">{kwh(cs.avg)}</strong></div>
                <div className="text-ink-faint text-2xs mt-0.5">je Haushalt/Jahr</div></div>
            </div>
            <ProgressBar value={tenants.length ? cs.reported / tenants.length * 100 : 0} />
            <p className="text-2xs text-ink-faint mt-2">{cs.reported < tenants.length ? 'Fehlende Werte werden mit ' + kwh(CONS_REF) + ' angenommen.' : (tenants.length ? 'Alle Mietparteien haben ihren Verbrauch hinterlegt.' : 'Noch keine Mietparteien.')}</p>
          </div>
        </div>

        {/* Live-Wirkung */}
        <div className="mt-5 pt-4 border-t border-line">
          <div className="flex items-center gap-1.5 mb-3"><Zap className="h-4 w-4 text-grass-deep" /><span className="label !mb-0">Wirkung auf die Anlage – jetzt gerade</span></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <LiveStat label="Direkt genutzt" value={pct(r.direktquote, 0)} sub="der Erzeugung" />
            <LiveStat label="Ersparnis je HH" value={eur(r.tenantSavingsPerHH)} sub="pro Jahr" tone="grass" />
            <LiveStat label="Solarstrompreis" value={ct(r.solarpreis)} sub={pct(project.share_pct, 0) + ' Grundpreis'} tone="grass" />
            <LiveStat label="Rendite Eigentümer" value={r.irr == null ? '—' : pct(r.irr * 100, 1)} sub="p.a." tone="sun" />
          </div>
          <p className="text-2xs text-ink-faint mt-2">Diese Werte ändern sich mit jeder Zusage und jeder Verbrauchsangabe. <Link to="../wirtschaftlichkeit" className="link">Szenarien durchrechnen →</Link></p>
        </div>
      </div>

      {/* Meine Daten */}
      {me && <MyData project={project} setProject={setProject} me={me} userName={user?.name} E={E} solarpreis={r.solarpreis} />}

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
                    {m.verbrauch ? ` · ${kwh(m.verbrauch)}/a` : (m.role !== 'vermieter' ? ' · Verbrauch offen' : '')}
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

function MyData({ project, setProject, me, userName, E, solarpreis }) {
  const [wohnung, setWohnung] = useState(me.wohnung || '');
  const [verbrauch, setVerbrauch] = useState(me.verbrauch || '');
  const [saving, setSaving] = useState('');
  const confirmed = me.status === 'zugesagt';
  const vNum = Number(verbrauch) || 0;
  const myself = vNum > 0 ? selfPerHousehold(E, vNum) : 0;
  const mySaving = myself * (E.gvpreis - solarpreis) / 100;
  const PERSONS = [['1 Pers.', 1500], ['2 Pers.', 2500], ['3 Pers.', 3600], ['4 Pers.', 4250], ['5+', 5200]];

  async function save({ status, confirmed: conf }) {
    setSaving(status === 'zugesagt' ? 'yes' : (status ? 'wd' : 'save'));
    try {
      setProject(await api.confirmMe(project.id, {
        wohnung, household: userName, verbrauch: verbrauch === '' ? null : Number(verbrauch),
        status: status ?? me.status, confirmed: conf ?? me.confirmed,
      }));
    } catch (e) { alert(e.message); } finally { setSaving(''); }
  }

  return (
    <section className="card p-5">
      <div className="flex items-center gap-2 mb-1"><Home className="h-4 w-4 text-grass-deep" /><h3>Meine Daten</h3>
        {confirmed && <span className="chip-grass ml-1"><Check className="h-3 w-3" /> zugesagt</span>}
      </div>
      <p className="text-[13px] text-ink-soft mb-4">Dein Jahresverbrauch macht die Wirtschaftlichkeit gebäudegenau – je mehr Strom im Haus verbraucht wird, desto mehr Solarstrom kann direkt geliefert werden.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Wohnung / Lage" hint="z. B. „2. OG links“">
          <input className="input" value={wohnung} onChange={(e) => setWohnung(e.target.value)} placeholder="2. OG links" />
        </Field>
        <Field label="Stromverbrauch pro Jahr (kWh)" hint="Steht auf der Jahresabrechnung.">
          <input type="number" className="input tnum" value={verbrauch} onChange={(e) => setVerbrauch(e.target.value)} placeholder="2500" />
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-2xs text-ink-faint mr-0.5">Unbekannt? Schätzen:</span>
            {PERSONS.map(([lbl, v]) => (
              <button key={lbl} type="button" onClick={() => setVerbrauch(String(v))}
                className="px-2 py-0.5 rounded-pill text-2xs font-medium border border-line bg-paper hover:border-grass/40 hover:bg-grass-soft/40 tnum">{lbl}</button>
            ))}
          </div>
        </Field>
      </div>

      {vNum > 0 && (
        <div className="mt-4 rounded-card bg-grass-soft/50 px-4 py-3 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-grass-deep shrink-0" />
          <div className="text-[13px] text-grass-ink">
            Bei deinem Verbrauch und dem aktuellen Preis sparst du etwa <strong className="tnum">{eur(mySaving)}</strong> pro Jahr.
            <span className="block text-2xs text-grass-ink/70 mt-0.5">Rund {kwh(myself)} deines Stroms kämen dann vom eigenen Dach. Schätzwert beim aktuellen Solarstrompreis.</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={() => save({})} disabled={!!saving} className="btn-ghost btn-sm">{saving === 'save' ? 'Speichert …' : 'Nur speichern'}</button>
        {!confirmed
          ? <button onClick={() => save({ status: 'zugesagt', confirmed: true })} disabled={!!saving} className="btn-primary btn-sm"><Check className="h-4 w-4" /> {saving === 'yes' ? 'Sagt zu …' : 'Daten bestätigen & zusagen'}</button>
          : <button onClick={() => save({ status: 'beigetreten' })} disabled={!!saving} className="btn-ghost btn-sm"><MinusCircle className="h-4 w-4" /> {saving === 'wd' ? 'Zieht zurück …' : 'Zusage zurückziehen'}</button>}
      </div>
    </section>
  );
}

function LiveStat({ label, value, sub, tone }) {
  const col = tone === 'grass' ? 'text-grass-deep' : tone === 'sun' ? 'text-sun-deep' : 'text-ink';
  return (
    <div className="rounded-card border border-line bg-paper-2 px-3 py-2.5">
      <div className="text-2xs text-ink-faint uppercase tracking-wide">{label}</div>
      <div className={`font-display text-xl font-bold tnum leading-tight mt-0.5 ${col}`}>{value}</div>
      <div className="text-2xs text-ink-faint">{sub}</div>
    </div>
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
