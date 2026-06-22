import { useState } from 'react';
import { useProject } from '../../context/ProjectContext.jsx';
import { PageHead, Field, InfoNote, StatusChip } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { dateDE } from '../../lib/format.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Settings as Cog, Check } from 'lucide-react';

const ROLE_LABEL = { admin: 'Admin (Initiative)', mieter: 'Mieter:in', vermieter: 'Eigentümerseite' };

export default function Settings() {
  const { project, setProject, canEdit, me } = useProject();
  const { user } = useAuth();
  const [name, setName] = useState(project.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const members = project.members || [];
  const counts = members.reduce((a, m) => { a[m.role] = (a[m.role] || 0) + 1; return a; }, {});

  async function save() {
    if (!name.trim() || name === project.name) return;
    setSaving(true);
    try { setProject(await api.patchProject(project.id, { name: name.trim() })); setSaved(true); setTimeout(() => setSaved(false), 1500); }
    catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHead eyebrow="Einstellungen" title="Projekt verwalten" />

      <section className="card p-5">
        <div className="flex items-center gap-2 mb-3"><Cog className="h-4 w-4 text-grass-deep" /><h3>Projektname</h3></div>
        {canEdit ? (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1"><Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field></div>
            <button onClick={save} disabled={saving || !name.trim() || name === project.name} className="btn-primary btn-sm">
              {saved ? <><Check className="h-4 w-4" /> Gespeichert</> : saving ? 'Speichert …' : 'Speichern'}
            </button>
          </div>
        ) : (
          <p className="text-[14px]">{project.name} <span className="text-2xs text-ink-faint">(nur Admin/Eigentümerseite kann umbenennen)</span></p>
        )}
      </section>

      <section className="card">
        <div className="px-4 py-3 border-b border-line"><h3>Projektübersicht</h3></div>
        <dl className="divide-y divide-line text-[14px]">
          <Row k="Status"><StatusChip status={project.status} /></Row>
          <Row k="Deine Rolle">{ROLE_LABEL[me?.role] || '—'}</Row>
          <Row k="Mitglieder">{members.length} ({Object.entries(counts).map(([r, n]) => `${n}× ${ROLE_LABEL[r] || r}`).join(', ')})</Row>
          <Row k="Wohneinheiten">{project.we}</Row>
          <Row k="Angelegt am">{dateDE(project.created_at)}</Row>
          <Row k="Projekt-ID"><span className="tnum text-ink-faint text-2xs">{project.id}</span></Row>
        </dl>
      </section>

      <InfoNote>Mitglieder verwaltest du unter <span className="font-medium">Hausgemeinschaft</span>. Eine Funktion zum Entfernen von Mitgliedern oder Löschen des Projekts ist bewusst noch nicht enthalten, um versehentlichen Datenverlust zu vermeiden.</InfoNote>
    </div>
  );
}

function Row({ k, children }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <dt className="text-ink-soft">{k}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
