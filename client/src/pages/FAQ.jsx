import { Link } from 'react-router-dom';
import { PageHead } from '../components/ui.jsx';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  ['Müssen Mieter Geld investieren?', 'Nein. Bei beiden Modellen – GGV (§42b) und Mieterstrom (§42a) – ist die Eigentümerseite in der Regel Betreiber der Anlage. Die Mietparteien beziehen den Solarstrom zu einem vereinbarten Preis, ohne Eigenkapital und ohne Kreditaufnahme.'],
  ['Was passiert mit meinem bisherigen Stromvertrag?', 'Das hängt vom Modell ab: Bei der GGV (§42b) bleibt dein Vertrag bestehen – geliefert wird nur der Solarstrom vom Dach, den Reststrom beziehst du weiterhin frei vom eigenen Lieferanten. Beim Mieterstrom (§42a) übernimmt der Mieterstromanbieter die Vollversorgung; die Teilnahme ist freiwillig und gesetzlich geschützt.'],
  ['Gilt die 90-%-Preisgrenze?', 'Sie betrifft nur den Mieterstrom (§42a Abs. 4 EnWG): dort ist der Preis auf höchstens 90 % des Grundpreises gedeckelt. Die GGV (§42b) verweist nicht auf Abs. 4 – dort ist der Preis frei verhandelbar. In beiden Fällen nutzen wir 90 % als fairen Startwert.'],
  ['Wie viele Wohnungen müssen mitmachen?', 'Je mehr, desto besser. Als Faustregel sollten mindestens etwa die Hälfte der Wohnungen zusagen, damit der erzeugte Solarstrom gut im Haus genutzt wird und sich die Anlage trägt.'],
  ['Was ist mit der Eigentümerseite, wenn sie skeptisch ist?', 'Genau dafür erzeugt EnergieFlow eine Wirtschaftlichkeitsanalyse für beide Modelle und ein strukturiertes Anschreiben. Ihr tretet nicht als Einzelne, sondern als organisierte Hausgemeinschaft mit fertigem Vorschlag auf.'],
  ['Welche Unterlagen erstellt EnergieFlow?', 'Anschreiben an die Nachbarschaft und an die Eigentümerseite sowie eine nachvollziehbare Wirtschaftlichkeitsanalyse mit einer Empfehlung, welches Modell passt. Verträge, Anbieterwahl und Anlagenbau gehören aktuell nicht dazu – die Umsetzung liegt nach der Empfehlung bei euch.'],
  ['Lohnt sich nicht ein Balkonkraftwerk mehr?', 'Für einzelne Haushalte ist ein Balkonkraftwerk eine einfache, günstige Option. Die gemeinsame Dachnutzung – ob GGV oder Mieterstrom – spielt ihre Stärke aus, wenn das ganze Dach genutzt wird und viele Wohnungen gemeinsam profitieren.'],
  ['Was kostet EnergieFlow?', 'EnergieFlow ist ein Projekt für den Wettbewerb YES! Young Economic Solutions 2026 und demonstriert den Ablauf einer gemeinsamen Solar-Initiative im Mietshaus.'],
];

export default function FAQ() {
  return (
    <div className="wrap py-12 max-w-3xl">
      <PageHead eyebrow="Hilfe" title="Häufige Fragen"
        sub="Die wichtigsten Fragen rund um Solarstrom im Mietshaus – GGV und Mieterstrom – und EnergieFlow." />
      <div className="space-y-2 mt-6">
        {FAQS.map(([q, a]) => (
          <details key={q} className="card group">
            <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-4 py-3.5">
              <span className="font-medium text-[14.5px] text-ink">{q}</span>
              <ChevronDown className="h-4 w-4 text-ink-faint shrink-0 transition group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 text-[14px] text-ink-soft leading-relaxed">{a}</div>
          </details>
        ))}
      </div>
      <div className="card p-5 mt-8 text-center bg-paper-2">
        <p className="text-[14px] text-ink-soft">Noch offen? Der Wissensbereich erklärt Modell und Wirtschaftlichkeit im Detail.</p>
        <div className="flex justify-center gap-3 mt-3">
          <Link to="/modell" className="btn-ghost btn-sm">Die Modelle</Link>
          <Link to="/wirtschaftlichkeit" className="btn-ghost btn-sm">Wirtschaftlichkeit</Link>
        </div>
      </div>
    </div>
  );
}
