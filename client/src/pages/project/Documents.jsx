import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext.jsx';
import { PageHead, InfoNote } from '../../components/ui.jsx';
import { committedQuote } from '../../lib/economics.js';
import { Download, Mail, Home, BarChart3 } from 'lucide-react';

const sanitize = (s) => (s || 'EnergieFlow').replace(/[^\w\s-]+/g, '').trim().replace(/\s+/g, '_').slice(0, 50);

export default function Documents() {
  const { project } = useProject();
  const [busy, setBusy] = useState('');
  const quote = committedQuote(project) || 100;
  const opts = { origin: typeof window !== 'undefined' ? window.location.origin : '', quotePct: quote, sharePct: project.share_pct };

  const invites = project.invites || [];
  const ownerInvites = invites.filter((i) => i.role === 'vermieter');
  const ownerOccupierInvites = invites.filter((i) => i.role === 'selbstnutzer');
  const tenantInvite = invites.find((i) => i.role === 'mieter') || null;

  async function gen(key, builder, filename) {
    setBusy(key);
    try {
      const docs = await import('../../lib/docs.js');
      const { Packer } = await import('docx');
      const doc = builder(docs);
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click();
      a.remove(); URL.revokeObjectURL(url);
    } catch (e) { alert('Konnte Dokument nicht erstellen: ' + e.message); }
    finally { setBusy(''); }
  }

  return (
    <div className="space-y-6">
      <PageHead eyebrow="Dokumente" title="Anschreiben & Analyse erzeugen"
        sub="Anschreiben und Wirtschaftlichkeitsanalyse entstehen aus den aktuellen Projektdaten als bearbeitbare Word-Datei. Sie sind Entwürfe und ersetzen keine Rechtsberatung." />

      <section>
        <div className="eyebrow mb-3">Schreiben & Analyse</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <DocCard icon={<BarChart3 className="h-5 w-5 text-grass-deep" />} title="Wirtschaftlichkeitsanalyse"
            desc="Kennzahlen, Annahmen und Ergebnis – ideal als Anhang für die Eigentümerseite."
            busy={busy === 'wirt'} onClick={() => gen('wirt', (d) => d.buildWirtschaftlichkeit(project, opts), `Wirtschaftlichkeit_${sanitize(project.name)}.docx`)} />

          <DocCard icon={<Home className="h-5 w-5 text-grass-deep" />} title="Anschreiben an Mitmieter"
            desc="Lädt die Nachbarschaft ein, der Hausgemeinschaft beizutreten."
            busy={busy === 'mit'} onClick={() => gen('mit', (d) => d.buildMitmieterLetter(project, tenantInvite, opts), `Anschreiben_Mitmieter_${sanitize(project.name)}.docx`)} />
        </div>
      </section>

      <section>
        <div className="eyebrow mb-3">Anschreiben an die Eigentümerseite</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {ownerInvites.length > 0 ? ownerInvites.map((inv, i) => (
            <DocCard key={inv.id} icon={<Mail className="h-5 w-5 text-sun-deep" />} sun
              title={`Anschreiben${inv.label ? ' · ' + inv.label : ' ' + (i + 1)}`}
              desc="Strukturierter Vorschlag mit persönlichem Beitritts-Link."
              busy={busy === 'own' + i} onClick={() => gen('own' + i, (d) => d.buildVermieterLetter(project, inv, opts), `Anschreiben_Eigentuemer_${sanitize(project.name)}.docx`)} />
          )) : (
            <DocCard icon={<Mail className="h-5 w-5 text-sun-deep" />} sun title="Anschreiben (ohne Link)"
              desc="Erzeuge zuerst einen Eigentümer-Link unter „Hausgemeinschaft“, um einen Beitritts-Zugang einzubetten."
              busy={busy === 'owngen'} onClick={() => gen('owngen', (d) => d.buildVermieterLetter(project, null, opts), `Anschreiben_Eigentuemer_${sanitize(project.name)}.docx`)} />
          )}
        </div>
      </section>

      <section>
        <div className="eyebrow mb-3">Anschreiben an selbstnutzende Eigentümer</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {ownerOccupierInvites.length > 0 ? ownerOccupierInvites.map((inv, i) => (
            <DocCard key={inv.id} icon={<Home className="h-5 w-5 text-sun-deep" />} sun
              title={`Anschreiben${inv.label ? ' · ' + inv.label : ' ' + (i + 1)}`}
              desc="Für Eigentümer, die selbst im Haus wohnen – mit Beitritts-Link und Verbrauchsabfrage."
              busy={busy === 'occ' + i} onClick={() => gen('occ' + i, (d) => d.buildSelbstnutzerLetter(project, inv, opts), `Anschreiben_Selbstnutzer_${sanitize(project.name)}.docx`)} />
          )) : (
            <DocCard icon={<Home className="h-5 w-5 text-sun-deep" />} sun title="Anschreiben (ohne Link)"
              desc="Erzeuge zuerst einen Selbstnutzer-Link unter „Hausgemeinschaft“, um einen Beitritts-Zugang einzubetten."
              busy={busy === 'occgen'} onClick={() => gen('occgen', (d) => d.buildSelbstnutzerLetter(project, null, opts), `Anschreiben_Selbstnutzer_${sanitize(project.name)}.docx`)} />
          )}
        </div>
      </section>

      <InfoNote>Diese Plattform endet bei der Empfehlung. Verträge, die Wahl eines Mieterstrom-Anbieters und der Anlagenbau sind aktuell nicht Teil – sie sind als künftige Ausbaustufe vorgesehen.</InfoNote>
    </div>
  );
}

function DocCard({ icon, title, desc, busy, onClick, sun }) {
  return (
    <div className="card p-4 flex flex-col">
      <div className="flex items-start gap-3">
        <span className="h-10 w-10 rounded-card grid place-items-center bg-paper-2 shrink-0">{icon}</span>
        <div className="min-w-0">
          <div className="font-medium text-[14px] text-ink">{title}</div>
          <p className="text-2xs text-ink-faint mt-0.5">{desc}</p>
        </div>
      </div>
      <button onClick={onClick} disabled={busy} className={`${sun ? 'btn-sun' : 'btn-primary'} btn-sm mt-3 w-full`}>
        <Download className="h-4 w-4" /> {busy ? 'Erstellt …' : 'Word-Datei erzeugen'}
      </button>
    </div>
  );
}
