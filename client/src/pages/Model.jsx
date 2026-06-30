import { Link } from 'react-router-dom';
import { PageHead, InfoNote } from '../components/ui.jsx';
import { Scale, Check, X, ArrowRight } from 'lucide-react';

export default function Model() {
  return (
    <div className="wrap py-12 max-w-4xl">
      <PageHead eyebrow="Rechtsrahmen" title="Die beiden Modelle: GGV und Mieterstrom"
        sub="Mit dem Solarpaket I (2024) gibt es zwei Wege, Solarstrom ins Mietshaus zu bringen: die gemeinschaftliche Gebäudeversorgung (§42b EnWG) und Mieterstrom (§42a EnWG). EnergieFlow vergleicht beide neutral und empfiehlt das für euer Haus passende." />

      <Section title="Was ist die GGV?">
        <p>Bei der gemeinschaftlichen Gebäudeversorgung erzeugt eine PV-Anlage Strom auf dem Gebäude, der direkt
        an die Bewohner geliefert wird. Anders als bei einem Vollversorgungsmodell beziehen die Haushalte
        ihren <strong>Reststrom weiterhin frei</strong> von einem Lieferanten ihrer Wahl – die GGV liefert nur den
        vor Ort erzeugten Solarstrom. Das hält die Teilnahme einfach und das Risiko gering.</p>
      </Section>

      <Section title="GGV oder Mieterstrom – der Unterschied">
        <p className="mb-4">Beide Modelle bringen Solarstrom ins Mietshaus, unterscheiden sich aber deutlich. Welches besser passt, hängt vom Gebäude und der Eigentümerseite ab – EnergieFlow rechnet beide durch und empfiehlt.</p>
        <div className="card overflow-x-auto">
          <table className="tbl min-w-[520px]">
            <thead><tr><th>Merkmal</th><th>GGV (§42b)</th><th>Mieterstrom (§42a)</th></tr></thead>
            <tbody>
              <Tr c="Rechtsgrundlage" a="§42b EnWG" b="§42a EnWG" />
              <Tr c="Preisgestaltung" a={<><Check className="inline h-3.5 w-3.5 text-grass-deep" /> frei verhandelbar</>} b={<><X className="inline h-3.5 w-3.5 text-danger" /> max. 90 % des Grundpreises</>} />
              <Tr c="Reststrombezug" a="frei beim eigenen Lieferanten" b="durch den Mieterstromanbieter" />
              <Tr c="Eigenkapital Mieter" a="keines erforderlich" b="keines erforderlich" />
              <Tr c="Administrativer Aufwand" a="geringer" b="höher (Lieferantenpflichten)" />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Die 90-%-Grenze gilt hier nicht">
        <p>Ein häufiges Missverständnis: Die bekannte Obergrenze von 90 % des örtlichen Grundversorgungstarifs
        stammt aus dem <strong>Mieterstrom</strong> (§42a Abs. 4 EnWG). Die GGV verweist in §42b nur auf §42a
        Abs. 2 und 3 – <strong>nicht</strong> auf Abs. 4. Für die GGV gilt daher <strong>freie Preisgestaltung</strong>.</p>
        <p className="mt-3">EnergieFlow nutzt die 90 % deshalb nur als <strong>freiwilligen Fairness-Maßstab</strong> und
        Startwert für die Verhandlung – nach oben wie unten verhandelbar.</p>
        <InfoNote tone="grass"><Scale className="inline h-4 w-4 mr-1" /> Frei verhandelbar bedeutet auch Verantwortung: Der Preis sollte für die Eigentümerseite tragen und für die Mieterschaft klar günstiger sein als der Grundpreis.</InfoNote>
      </Section>

      <Section title="Wer macht was?">
        <ul className="space-y-2">
          <Li t="Hausgemeinschaft (Initiative)">organisiert sich, sammelt Zusagen und tritt gemeinsam auf.</Li>
          <Li t="Eigentümerseite">stellt das Dach bereit, ist i. d. R. Betreiber der Anlage und Vertragspartner.</Li>
          <Li t="EnergieFlow">bündelt Daten, rechnet beide Modelle ehrlich, erzeugt Anschreiben und spricht eine Empfehlung aus. Die Umsetzung – Verträge, Anbieterwahl, Anlagenbau – ist aktuell nicht Teil der Plattform.</Li>
        </ul>
      </Section>

      <div className="flex flex-wrap gap-3 mt-10">
        <Link to="/rechner" className="btn-primary">Eigene Schätzung starten <ArrowRight className="h-4 w-4" /></Link>
        <Link to="/wirtschaftlichkeit" className="btn-ghost">Wirtschaftlichkeit verstehen</Link>
        <Link to="/faq" className="btn-quiet">Häufige Fragen</Link>
      </div>
      <p className="text-2xs text-ink-faint mt-6">Diese Darstellung dient der Orientierung und ersetzt keine Rechtsberatung.</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-10 first:mt-6">
      <h2 className="mb-3">{title}</h2>
      <div className="text-[14.5px] text-ink-soft leading-relaxed [&_strong]:text-ink">{children}</div>
    </section>
  );
}
function Tr({ c, a, b }) {
  return <tr><td className="font-medium text-ink">{c}</td><td>{a}</td><td className="text-ink-soft">{b}</td></tr>;
}
function Li({ t, children }) {
  return <li className="flex gap-2"><Check className="h-4 w-4 text-grass-deep mt-1 shrink-0" /><span><strong className="text-ink">{t}</strong> – {children}</span></li>;
}
