import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Page } from '../components/Layout.jsx';
import { Spinner, Modal, Field, ProgressRing } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { paramsFromProject, scenario, committedQuote } from '../lib/economics.js';
import { AnalysisGrid, DataBanner } from '../components/Analysis.jsx';
import { NegotiationPanel } from '../components/Negotiation.jsx';
import { MemberPanel, InvitePanel, ConsentPanel, DocsPanel } from '../components/Panels.jsx';
import {
  MapPin, Settings2, AlertCircle, BarChart3, Sun, ChevronLeft,
} from 'lucide-react';

const STATUS = {
  sammeln: { label: 'Daten sammeln', cls: 'pill' },
  verhandeln: { label: 'In Verhandlung', cls: 'pill pill-amber' },
  vereinbart: { label: 'Vereinbart', cls: 'pill' },
};

function useProject(id) {
  const [project, setProject] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    setProject(null); setErr('');
    api.getProject(id).then((p) => alive && setProject(p)).catch((e) => alive && setErr(e.message));
    const s = getSocket();
    const onUpdate = (p) => { if (p && p.id === id) setProject(p); };
    if (s) { s.emit('project:join', id); s.on('project:update', onUpdate); }
    return () => {
      alive = false;
      if (s) { s.emit('project:leave', id); s.off('project:update', onUpdate); }
    };
  }, [id]);
  return { project, setProject, err };
}

export default function Project() {
  const { id } = useParams();
  const { user } = useAuth();
  const { project, setProject, err } = useProject(id);
  const [editOpen, setEditOpen] = useState(false);

  const me = useMemo(() => (project?.members || []).find((m) => m.userId === user?.id), [project, user]);
  const isAdmin = me?.role === 'admin';
  const canEdit = me?.role === 'admin' || me?.role === 'vermieter';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const view = useMemo(() => {
    if (!project) return null;
    const E = paramsFromProject(project);
    const committed = committedQuote(project);
    const quote = committed > 0 ? committed : 100; // vor erster Zusage: Planungsannahme
    return { E, committed, quote, planning: committed === 0, r: scenario(E, { quotePct: quote, sharePct: project.share_pct }) };
  }, [project]);

  // Handler – Server liefert i. d. R. den vollständigen Zustand zurück; Socket
  // synchronisiert zusätzlich alle anderen Teilnehmer:innen.
  const onConfirm = async (d) => setProject(await api.confirmMe(id, d));
  const onConsent = async (a) => setProject(await api.consent(id, a));
  const onPropose = async (p) => setProject(await api.propose(id, p));
  const onInvite = async (d) => { await api.createInvite(id, d); setProject(await api.getProject(id)); };

  if (err) return (
    <Page><div className="wrap py-24 text-center max-w-md">
      <AlertCircle className="h-9 w-9 text-amber-deep mx-auto mb-3" />
      <h1 className="text-2xl mb-1">Kein Zugriff</h1>
      <p className="text-ink-soft mb-6">{err}</p>
      <Link to="/dashboard" className="btn-ghost mx-auto">Zu meinen Projekten</Link>
    </div></Page>
  );
  if (!project || !view) return <div className="wrap py-24"><Spinner label="Projekt wird geladen …" /></div>;

  const st = STATUS[project.status] || STATUS.sammeln;

  return (
    <Page>
      <div className="wrap py-8 sm:py-10">
        {/* Kopf */}
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-[13px] text-ink-soft hover:text-ink mb-3"><ChevronLeft className="h-4 w-4" /> Projekte</Link>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl">{project.name}</h1>
              <span className={st.cls}>{st.label}</span>
            </div>
            <div className="flex items-center gap-2 text-ink-soft mt-2 text-[14px]">
              <MapPin className="h-4 w-4 text-ink-faint" />
              {[project.street, project.hausnr].filter(Boolean).join(' ') + (project.ort ? `, ${project.ort}` : '') || 'Adresse offen'}
              <span className="text-ink-faint">·</span>
              {Math.round(project.kwp)} kWp · {project.we} Wohneinheiten
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <ProgressRing value={view.committed} size={58} />
              <div className="text-[10.5px] text-ink-faint mt-1.5">Beteiligung</div>
            </div>
            {canEdit && (
              <button onClick={() => setEditOpen(true)} className="btn-ghost !px-3"><Settings2 className="h-4 w-4" /> Daten</button>
            )}
          </div>
        </div>

        {/* Analyse */}
        <div className="card p-5 sm:p-6 mb-5">
          <div className="flex items-center gap-2 mb-3"><BarChart3 className="h-5 w-5 text-green-deep" /><h2 className="text-xl">Wirtschaftlichkeit</h2></div>
          <div className="mb-4"><DataBanner project={project} /></div>
          {view.planning && (
            <p className="text-[12.5px] text-ink-faint mb-3 -mt-1">
              Noch hat niemand verbindlich zugesagt – gerechnet wird mit der Annahme, dass alle
              {` ${project.we} `}Wohnungen mitmachen. Mit jeder Zusage wird die Quote real.
            </p>
          )}
          <AnalysisGrid r={view.r} sharePct={project.share_pct} />
        </div>

        {/* Verhandlung + Konsens */}
        <div className="grid gap-5 lg:grid-cols-3 mb-5">
          <div className="lg:col-span-2">
            <NegotiationPanel project={project} E={view.E} quote={view.quote} role={me?.role} onPropose={onPropose} />
          </div>
          <div className="space-y-5">
            <ConsentPanel project={project} me={me} onConsent={onConsent} />
          </div>
        </div>

        {/* Mitglieder / Einladen / Dokumente */}
        <div className="grid gap-5 lg:grid-cols-3">
          <MemberPanel project={project} me={me} onConfirm={onConfirm} />
          <InvitePanel project={project} isAdmin={isAdmin} origin={origin} onInvite={onInvite} />
          <DocsPanel project={project} me={me} isAdmin={isAdmin} origin={origin} quote={view.quote} share={project.share_pct} />
        </div>
      </div>

      {canEdit && <EditModal open={editOpen} onClose={() => setEditOpen(false)} project={project}
        onSave={async (d) => { setProject(await api.patchProject(id, d)); setEditOpen(false); }} />}
    </Page>
  );
}

function EditModal({ open, onClose, project, onSave }) {
  const seed = () => ({
    we: project.we, kwp: project.kwp, ertrag: project.ertrag, invest: project.invest,
    gvpreis: project.gvpreis, einspeise: project.einspeise, opex: project.opex,
    versicherung: project.versicherung, zeitraum: project.zeitraum,
  });
  const [f, setF] = useState(seed);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setF(seed()); /* eslint-disable-next-line */ }, [open]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    const num = {};
    for (const k of Object.keys(f)) num[k] = f[k] === '' ? undefined : +f[k];
    try { await onSave(num); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Anlagendaten anpassen" width="max-w-xl">
      <p className="text-[13.5px] text-ink-soft mb-4">
        Genauere Werte verbessern die Analyse für alle. Änderungen sind sofort für die ganze
        Gemeinschaft sichtbar.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Wohneinheiten"><input type="number" className="input" value={f.we} onChange={set('we')} /></Field>
        <Field label="Anlagengröße (kWp)"><input type="number" className="input" value={f.kwp} onChange={set('kwp')} /></Field>
        <Field label="Spez. Ertrag (kWh/kWp·a)"><input type="number" className="input" value={f.ertrag} onChange={set('ertrag')} /></Field>
        <Field label="Investition (€)"><input type="number" className="input" value={f.invest} onChange={set('invest')} /></Field>
        <Field label="Grundpreis (ct/kWh)"><input type="number" step="0.1" className="input" value={f.gvpreis} onChange={set('gvpreis')} /></Field>
        <Field label="Einspeisung (ct/kWh)"><input type="number" step="0.01" className="input" value={f.einspeise} onChange={set('einspeise')} /></Field>
        <Field label="Betriebskosten (€/a)"><input type="number" className="input" value={f.opex} onChange={set('opex')} /></Field>
        <Field label="Versicherung (€/a)"><input type="number" className="input" value={f.versicherung} onChange={set('versicherung')} /></Field>
        <Field label="Betrachtungszeitraum (Jahre)"><input type="number" className="input" value={f.zeitraum} onChange={set('zeitraum')} /></Field>
      </div>
      <div className="flex items-center justify-end gap-3 mt-5">
        <button onClick={onClose} className="btn-ghost">Abbrechen</button>
        <button onClick={save} disabled={busy} className="btn-primary">{busy ? 'Speichere …' : 'Speichern'}</button>
      </div>
    </Modal>
  );
}
