import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext.jsx';
import { PageHead, Modal, Field, InfoNote, StatusChip } from '../../components/ui.jsx';
import { api } from '../../lib/api.js';
import { paramsFromProject } from '../../lib/economics.js';
import { de, eur, ct, kwh } from '../../lib/format.js';
import { Pencil, MapPin, CheckCircle2, CircleDashed, Sun } from 'lucide-react';

const FIELDS = [
  { k: 'we', label: 'Wohneinheiten', unit: 'WE', step: 1 },
  { k: 'kwp', label: 'Anlagenleistung', unit: 'kWp', step: 0.5 },
  { k: 'ertrag', label: 'Spezifischer Ertrag', unit: 'kWh/kWp·a', step: 10 },
  { k: 'invest', label: 'Investition (inkl. Montage/Speicher)', unit: '€', step: 500 },
  { k: 'gvpreis', label: 'Örtlicher Grundpreis', unit: 'ct/kWh', step: 0.5 },
  { k: 'einspeise', label: 'Einspeisevergütung', unit: 'ct/kWh', step: 0.1 },
  { k: 'opex', label: 'Betriebskosten', unit: '€/Jahr', step: 50 },
  { k: 'versicherung', label: 'Versicherung', unit: '€/Jahr', step: 50 },
  { k: 'zeitraum', label: 'Betrachtungszeitraum', unit: 'Jahre', step: 1 },
];

export default function Building() {
  const { project, setProject, canEdit } = useProject();
  const E = paramsFromProject(project);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fmt = (k) => {
    const v = E[k];
    if (k === 'invest' || k === 'opex' || k === 'versicherung') return eur(v);
    if (k === 'gvpreis' || k === 'einspeise') return ct(v);
    if (k === 'ertrag') return kwh(v) + '/kWp';
    return de(v) + (k === 'we' ? ' WE' : k === 'kwp' ? ' kWp' : k === 'zeitraum' ? ' Jahre' : '');
  };

  function startEdit() {
    const f = {}; FIELDS.forEach(({ k }) => (f[k] = E[k]));
    setForm(f); setOpen(true);
  }
  async function save() {
    setSaving(true);
    try { setProject(await api.patchProject(project.id, form)); setOpen(false); }
    catch (e) { alert(e.message); }
    finally { setSaving(false); }
  }
  async function toggleFeindaten() {
    try { setProject(await api.patchProject(project.id, { feindaten: !project.feindaten })); }
    catch (e) { alert(e.message); }
  }

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="Gebäude & Anlage"
        title="Anlagendaten"
        sub="Grundlage aller Berechnungen. Solange keine Feindaten vorliegen, rechnet das System mit belastbaren Durchschnittswerten."
        actions={canEdit && <button onClick={startEdit} className="btn-ghost btn-sm"><Pencil className="h-4 w-4" /> Bearbeiten</button>}
      />

      {/* Adresse + Datenstand */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="eyebrow mb-2">Standort</div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-grass-deep mt-0.5" />
            <div className="text-[14px]">
              <div className="font-medium">{[project.street, project.hausnr].filter(Boolean).join(' ') || 'Adresse nicht angegeben'}</div>
              <div className="text-ink-soft">{[project.plz, project.ort].filter(Boolean).join(' ')}</div>
              <div className="text-ink-faint text-[13px] mt-0.5">{project.bundesland}</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="eyebrow">Datenstand</div>
            <StatusChip status={project.status} />
          </div>
          <div className="flex items-center gap-2 text-[14px]">
            {project.feindaten
              ? <><CheckCircle2 className="h-4 w-4 text-grass-deep" /> <span className="font-medium">Feindaten hinterlegt</span></>
              : <><CircleDashed className="h-4 w-4 text-sun-deep" /> <span className="font-medium">Erste Schätzung</span></>}
          </div>
          <p className="text-2xs text-ink-faint mt-1">
            {project.feindaten ? 'Belastbare Grundlage für Verhandlung und Verträge.' : 'Durchschnittswerte – mit echtem Angebot präzisierbar.'}
          </p>
          {canEdit && (
            <button onClick={toggleFeindaten} className="btn-quiet btn-sm mt-2 !px-2 -ml-1">
              {project.feindaten ? 'Auf Schätzung zurücksetzen' : 'Als Feindaten markieren'}
            </button>
          )}
        </div>
      </div>

      {/* Datenraster */}
      <div className="card">
        <div className="px-4 py-3 border-b border-line flex items-center gap-2">
          <Sun className="h-4 w-4 text-sun-deep" /><h3>Technische & wirtschaftliche Eckdaten</h3>
        </div>
        <dl className="divide-y divide-line">
          {FIELDS.map(({ k, label, unit }) => (
            <div key={k} className="flex items-center justify-between px-4 py-2.5">
              <dt className="text-[13.5px] text-ink-soft">{label}</dt>
              <dd className="text-[14px] font-medium tnum">{fmt(k)}<span className="sr-only">{unit}</span></dd>
            </div>
          ))}
        </dl>
      </div>

      {!canEdit && <InfoNote>Nur Admin oder Eigentümerseite können die Anlagendaten ändern. Deine Haushaltsdaten pflegst du unter <Link to="../gemeinschaft" className="link">Hausgemeinschaft</Link>.</InfoNote>}

      <Modal open={open} onClose={() => setOpen(false)} title="Anlagendaten bearbeiten" width="max-w-xl">
        <div className="grid sm:grid-cols-2 gap-4">
          {FIELDS.map(({ k, label, unit, step }) => (
            <Field key={k} label={`${label} (${unit})`}>
              <input type="number" step={step} className="input tnum" value={form[k] ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
            </Field>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setOpen(false)} className="btn-ghost btn-sm">Abbrechen</button>
          <button onClick={save} disabled={saving} className="btn-primary btn-sm">{saving ? 'Speichert …' : 'Speichern'}</button>
        </div>
      </Modal>
    </div>
  );
}
