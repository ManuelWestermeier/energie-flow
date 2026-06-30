import { Link } from 'react-router-dom';
import { PageHead } from '../components/ui.jsx';
import { PHASES } from '../lib/phases.js';
import { ArrowRight, Check } from 'lucide-react';

export default function HowItWorks() {
  return (
    <div className="wrap py-12 max-w-3xl">
      <PageHead eyebrow="Ablauf" title="So funktioniert's"
        sub="EnergieFlow begleitet euch Schritt für Schritt – von der ersten Idee bis zur fundierten Empfehlung, welches Modell sich für euer Haus lohnt. Der Arbeitsbereich erkennt erledigte Schritte automatisch und hält die passenden Anschreiben bereit." />

      <div className="relative mt-8">
        <div className="absolute left-4 top-3 bottom-3 w-0.5 rounded-full current-charge" style={{ background: 'var(--flow-v)' }} aria-hidden />
        <ol className="space-y-5">
          {PHASES.map((ph) => (
            <li key={ph.id} className="relative pl-12">
              <span className="absolute left-0 top-0 h-8 w-8 rounded-full bg-paper ring-1 ring-line-strong grid place-items-center font-display font-bold text-[13px] text-ink z-10">{ph.n}</span>
              <div className="card p-4">
                <h3 className="text-[15px]">{ph.title}</h3>
                <p className="text-[13.5px] text-ink-soft mt-1">{ph.summary}</p>
                <ul className="mt-2 space-y-1">
                  {ph.tasks.map((t) => (
                    <li key={t.id} className="flex items-start gap-2 text-[13px] text-ink-soft">
                      <Check className="h-3.5 w-3.5 text-grass-deep mt-0.5 shrink-0" />{t.label}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="card p-5 mt-8 bg-paper-2">
        <h3>Was EnergieFlow für euch übernimmt</h3>
        <p className="text-[14px] text-ink-soft mt-2">Ehrliche Wirtschaftlichkeit für beide Modelle auf Knopfdruck, Anschreiben an Nachbarschaft und
        Eigentümerseite, eine faire Verhandlung mit klarer Zustimmung und am Ende eine begründete Empfehlung, welches Modell passt – alles aus euren Projektdaten.</p>
      </div>

      <div className="flex flex-wrap gap-3 mt-8">
        <Link to="/rechner" className="btn-primary">Jetzt starten <ArrowRight className="h-4 w-4" /></Link>
        <Link to="/modell" className="btn-ghost">Den Rechtsrahmen verstehen</Link>
      </div>
    </div>
  );
}
