import { Link } from 'react-router-dom';
import { PageHead, Stat, InfoNote } from '../components/ui.jsx';
import { paramsFromProject, scenario } from '../lib/economics.js';
import { eur, ct, kwh, pct } from '../lib/format.js';
import { Users, Tag, ArrowRight, AlertTriangle } from 'lucide-react';

export default function EconomicsExplainer() {
  const E = paramsFromProject({});           // Ariadne-Referenz: 30 kWp / 8 WE
  const r = scenario(E, { quotePct: 100, sharePct: 90 });

  return (
    <div className="wrap py-12 max-w-3xl">
      <PageHead eyebrow="Wirtschaftlichkeit" title="Wie wir rechnen"
        sub="Transparent und ohne Schönrechnerei. Wir rechnen beide Modelle – GGV und Mieterstrom – auf Basis des Ariadne-Referenzmodells (Fischer/Henger, IW Köln, 2025), hier am Beispiel einer 30-kWp-Anlage auf einem Haus mit acht Wohneinheiten." />

      <section className="mt-8">
        <h2 className="mb-3">Zwei Stellschrauben bestimmen alles</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-5">
            <span className="h-10 w-10 rounded-card bg-grass-soft text-grass-deep grid place-items-center"><Users className="h-5 w-5" /></span>
            <h3 className="mt-3">Beteiligung</h3>
            <p className="text-[13.5px] text-ink-soft mt-1">Wie viele Wohnungen mitmachen. Mehr Teilnehmer heißt mehr direkt genutzter Solarstrom – und damit bessere Wirtschaftlichkeit für alle.</p>
          </div>
          <div className="card p-5">
            <span className="h-10 w-10 rounded-card bg-sun-soft text-sun-deep grid place-items-center"><Tag className="h-5 w-5" /></span>
            <h3 className="mt-3">Solarstrompreis</h3>
            <p className="text-[13.5px] text-ink-soft mt-1">Der Preis je kWh, ausgedrückt als Anteil des örtlichen Grundpreises. Er verteilt den Nutzen zwischen Mieterschaft (Ersparnis) und Eigentümerseite (Rendite).</p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-1">Ein Rechenbeispiel (GGV-Variante)</h2>
        <p className="text-[14px] text-ink-soft mb-4">Referenzanlage, alle acht Wohnungen machen mit, Preis 90 % des Grundpreises. Beim Mieterstrom kämen Mieterstromzuschlag und Reststrommarge hinzu – die Unterschiede erklärt die <Link to="/modell" className="link">Modell-Seite</Link>:</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Solarstrompreis" tone="grass" value={ct(r.solarpreis)} sub="je kWh" />
          <Stat label="Ersparnis je HH" tone="grass" value={eur(r.tenantSavingsPerHH)} sub="pro Jahr" />
          <Stat label="Überschuss Eigentümer" tone="sun" value={eur(r.netto)} sub="pro Jahr" />
          <Stat label="Rendite" tone="sun" value={r.irr == null ? '—' : pct(r.irr * 100, 1)} sub="p.a." />
        </div>
        <div className="card mt-3">
          <dl className="divide-y divide-line text-[13.5px]">
            <Row k="Jahreserzeugung" v={kwh(r.erz)} />
            <Row k="direkt im Haus genutzt" v={`${kwh(r.solar)} (${pct(r.direktquote, 1)})`} />
            <Row k="Überschuss-Einspeisung" v={kwh(r.feed)} />
            <Row k="Betrieb & Versicherung" v={'− ' + eur(r.kosten) + ' / Jahr'} />
          </dl>
        </div>
        <p className="text-2xs text-ink-faint mt-2">Versicherung (200 €/a) ist – anders als in mancher Überschlagsrechnung – ausdrücklich enthalten.</p>
      </section>

      <section className="mt-10">
        <h2 className="mb-3">Was wir offen ansprechen</h2>
        <div className="space-y-3">
          <Honest title="Die Rendite ist niedrig">Im Referenzfall amortisiert sich die Anlage langsam – bei beiden Modellen, beim Mieterstrom etwas schneller als bei der GGV. Als reine Geldanlage bleibt sie wenig attraktiv; der Wert liegt im gemeinsamen Nutzen und günstigeren Strom.</Honest>
          <Honest title="Balkonkraftwerke sind eine echte Alternative">Für einzelne Haushalte sind sie günstig und unkompliziert (§554 BGB). Die gemeinsame Dachnutzung lohnt sich vor allem, wenn viele mitziehen und das ganze Dach genutzt wird.</Honest>
          <Honest title="Annahmen statt Versprechen">Erträge, Preise und Verbräuche schwanken real. Solange keine Feindaten vorliegen, rechnen wir mit belastbaren Durchschnitten – kenntlich gemacht als „Schätzung“.</Honest>
        </div>
        <InfoNote tone="sun"><AlertTriangle className="inline h-4 w-4 mr-1" /> Keine Renditeberatung: Die Zahlen sind Modellrechnungen zur Orientierung, keine Anlage- oder Steuerberatung.</InfoNote>
      </section>

      <div className="flex flex-wrap gap-3 mt-8">
        <Link to="/rechner" className="btn-primary">Für dein Haus rechnen <ArrowRight className="h-4 w-4" /></Link>
        <Link to="/modell" className="btn-ghost">Zum Rechtsrahmen</Link>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return <div className="flex items-center justify-between px-4 py-2.5"><dt className="text-ink-soft">{k}</dt><dd className="font-medium tnum">{v}</dd></div>;
}
function Honest({ title, children }) {
  return (
    <div className="card p-4">
      <h3 className="text-[14.5px]">{title}</h3>
      <p className="text-[13.5px] text-ink-soft mt-1">{children}</p>
    </div>
  );
}
