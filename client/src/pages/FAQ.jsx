import { Link } from 'react-router-dom';
import { PageHead } from '../components/ui.jsx';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  ['Müssen Mieter:innen Geld investieren?', 'Nein. Bei der GGV nach §42b EnWG ist die Eigentümerseite in der Regel Betreiberin der Anlage. Die Mietparteien beziehen den Solarstrom zu einem vereinbarten Preis – ohne Eigenkapital und ohne Kreditaufnahme.'],
  ['Was passiert mit meinem bisherigen Stromvertrag?', 'Er bleibt bestehen. Die GGV liefert nur den Solarstrom vom Dach; den Reststrom bezieht jede Wohnung weiterhin frei vom eigenen Lieferanten. Du bist an keinen neuen Vollversorger gebunden.'],
  ['Gilt die 90-%-Preisgrenze?', 'Nein – diese Grenze betrifft den Mieterstrom (§42a Abs. 4 EnWG). Die GGV verweist nur auf §42a Abs. 2 und 3, nicht auf Abs. 4. Der Preis ist frei verhandelbar; wir nutzen 90 % nur als fairen Startwert.'],
  ['Wie viele Wohnungen müssen mitmachen?', 'Je mehr, desto besser. Als Faustregel sollten mindestens etwa die Hälfte der Wohnungen zusagen, damit der erzeugte Solarstrom gut im Haus genutzt wird und sich die Anlage trägt.'],
  ['Was ist mit der Eigentümerseite, wenn sie skeptisch ist?', 'Genau dafür erzeugt EnergieFlow eine Wirtschaftlichkeitsanalyse und ein strukturiertes Anschreiben. Ihr tretet nicht als Einzelne, sondern als organisierte Hausgemeinschaft mit fertigem Vorschlag auf.'],
  ['Sind die erzeugten Verträge rechtsverbindlich?', 'Sie sind sorgfältige Vorlagen, die die GGV nach §42b EnWG abbilden. Vor der Unterzeichnung empfiehlt sich eine rechtliche Prüfung – EnergieFlow ersetzt keine Rechtsberatung.'],
  ['Lohnt sich nicht ein Balkonkraftwerk mehr?', 'Für einzelne Haushalte ist ein Balkonkraftwerk eine einfache, günstige Option. Die GGV spielt ihre Stärke aus, wenn das ganze Dach genutzt wird und viele Wohnungen gemeinsam profitieren.'],
  ['Was kostet EnergieFlow?', 'EnergieFlow ist ein Projekt für den Wettbewerb YES! Young Economic Solutions 2026 und demonstriert den Ablauf einer GGV-Initiative.'],
];

export default function FAQ() {
  return (
    <div className="wrap py-12 max-w-3xl">
      <PageHead eyebrow="Hilfe" title="Häufige Fragen"
        sub="Die wichtigsten Fragen rund um die gemeinschaftliche Gebäudeversorgung und EnergieFlow." />
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
          <Link to="/modell" className="btn-ghost btn-sm">Das GGV-Modell</Link>
          <Link to="/wirtschaftlichkeit" className="btn-ghost btn-sm">Wirtschaftlichkeit</Link>
        </div>
      </div>
    </div>
  );
}
