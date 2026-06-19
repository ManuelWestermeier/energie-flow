import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Page } from '../components/Layout.jsx';
import { Pill } from '../components/ui.jsx';
import {
  Sun, Users, FileSignature, ArrowRight, Handshake, LineChart,
  ShieldCheck, Building2, Zap, Scale,
} from 'lucide-react';

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' }, transition: { duration: 0.5, delay: d },
});

export default function Landing() {
  return (
    <Page>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="wrap pt-14 pb-16 sm:pt-20 sm:pb-20">
          <div className="max-w-3xl">
            <Pill>§42b EnWG · gemeinschaftliche Gebäudeversorgung</Pill>
            <h1 className="mt-5 text-[2.6rem] sm:text-6xl leading-[1.04]">
              73 % der Menschen mieten.<br />
              <span className="text-green-deep">Fast niemand kann Solar bauen.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-soft max-w-2xl">
              EnergieFlow ändert das. Statt einzeln gegen eine Wand zu laufen, organisiert ihr
              euch als Hausgemeinschaft, rechnet gemeinsam, tretet geschlossen an die Eigentümer­seite
              heran – und einigt euch transparent auf einen fairen Solarstrompreis.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/rechner" className="btn-primary !px-6 !py-3 text-[15px]">
                Projekt starten <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="btn-ghost !py-3">Anmelden</Link>
            </div>
            <p className="mt-4 text-[13px] text-ink-faint">
              Kein Eigenkapital nötig · keine Anmeldung für den Rechner · Zahlen nach Ariadne-Analyse (IW Köln, 2025)
            </p>
          </div>
        </div>
        <Sun className="hidden md:block absolute -right-10 -top-6 h-72 w-72 text-amber/15" strokeWidth={1} />
      </section>

      {/* So funktioniert es */}
      <section className="wrap py-6">
        <motion.div {...fade()} className="grid gap-4 md:grid-cols-3">
          <Step icon={<Sun />} n="01" title="Rechnen">
            Ein:e Mieter:in gibt im Rechner die Eckdaten des Hauses ein. Sofort steht eine
            erste, ehrliche Wirtschaftlichkeits-Schätzung.
          </Step>
          <Step icon={<Users />} n="02" title="Gemeinsam werden">
            Daraus wird ein Projekt. Per Link kommen die Nachbar:innen dazu, bestätigen ihren
            Verbrauch – die Analyse wird gebäudegenau.
          </Step>
          <Step icon={<FileSignature />} n="03" title="Einigen & unterschreiben">
            Vermieter:in tritt bei, ihr verhandelt den Preis live. Bei Zustimmung erzeugt die
            Plattform für jede:n den GGV-Vertrag.
          </Step>
        </motion.div>
      </section>

      {/* Das Verhandlungs-Prinzip */}
      <section className="wrap py-14">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <motion.div {...fade()}>
            <Pill tone="amber">Der Kern: faire Verhandlung</Pill>
            <h2 className="mt-4 text-3xl sm:text-4xl">Mehr Beteiligung = mehr Spielraum.</h2>
            <p className="mt-4 text-ink-soft">
              Je mehr Wohnungen mitmachen, desto mehr Solarstrom wird direkt im Haus verbraucht –
              und desto eher trägt sich die Anlage auch bei einem niedrigeren Preis. Genau diesen
              Zusammenhang macht EnergieFlow sichtbar: Ihr seht in Echtzeit, wie sich euer
              Preis-Vorschlag auf die Rendite der Eigentümer­seite auswirkt.
            </p>
            <ul className="mt-6 space-y-3">
              <Bullet icon={<LineChart className="h-4 w-4" />}>
                Live-Hebel: Preisanteil schieben, Wirkung sofort sehen.
              </Bullet>
              <Bullet icon={<Handshake className="h-4 w-4" />}>
                Beide Seiten dürfen Vorschläge machen – nach unten und nach oben.
              </Bullet>
              <Bullet icon={<ShieldCheck className="h-4 w-4" />}>
                Jede alte Analyse bleibt gespeichert und vergleichbar.
              </Bullet>
            </ul>
          </motion.div>

          <motion.div {...fade(0.1)} className="card p-6 sm:p-8">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Beispielhafter Zusammenhang</div>
            <div className="mt-5 space-y-5">
              <Lever label="Beteiligung 40 %" v={40} note="Anlage trägt sich knapp" />
              <Lever label="Beteiligung 70 %" v={70} note="solider Spielraum beim Preis" tone="mid" />
              <Lever label="Beteiligung 100 %" v={100} note="auch günstige Preise tragfähig" tone="full" />
            </div>
            <p className="mt-6 text-[12.5px] text-ink-faint">
              Schematische Darstellung. Die echten Werte berechnet der Rechner aus euren Hausdaten.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Rechtsrahmen – ehrlich */}
      <section className="wrap pb-14">
        <motion.div {...fade()} className="card p-7 sm:p-9">
          <div className="flex items-center gap-2.5 mb-4">
            <Scale className="h-5 w-5 text-green-deep" />
            <h2 className="text-2xl">Der rechtliche Rahmen – ohne Schönfärberei</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3 text-[14.5px] text-ink-soft">
            <div>
              <div className="font-semibold text-ink mb-1.5 inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-green-deep" />GGV · §42b EnWG</div>
              <p>Seit dem Solarpaket I (Mai 2024). Strom vom Dach wird direkt im Haus genutzt.
                Schlank, ohne Vollversorgungspflicht. <strong className="text-ink">Freie Preisgestaltung.</strong></p>
            </div>
            <div>
              <div className="font-semibold text-ink mb-1.5 inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-amber-deep" />Mieterstrom · §42a EnWG</div>
              <p>Das ältere Modell. Hier – und nur hier – gilt die Grenze von max. 90 % des
                Grundversorgungstarifs. Für die GGV gilt sie <strong className="text-ink">nicht</strong>.</p>
            </div>
            <div>
              <div className="font-semibold text-ink mb-1.5 inline-flex items-center gap-1.5"><Handshake className="h-4 w-4 text-green-deep" />Unsere 90 %</div>
              <p>Wir setzen 90 % als <strong className="text-ink">freiwilligen Fairness-Maßstab</strong> –
                ein guter Startpunkt, den beide Seiten frei nach oben oder unten verhandeln können.</p>
            </div>
          </div>
          <p className="mt-6 text-[13px] text-ink-faint">
            Alle Berechnungen sind Schätzungen. Erzeugte Schreiben und Verträge sind Entwürfe und
            ersetzen keine Rechts- oder Steuerberatung.
          </p>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="wrap pb-20">
        <motion.div {...fade()} className="rounded-3xl bg-green-deep text-white p-9 sm:p-12 text-center shadow-lift">
          <h2 className="text-3xl sm:text-4xl text-white">Bringt die Sonne auf euer Dach.</h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">
            In wenigen Minuten zum eigenen Projekt – ehrlich gerechnet, gemeinsam getragen.
          </p>
          <Link to="/rechner" className="mt-7 inline-flex btn bg-white text-green-ink !px-6 !py-3 hover:bg-paper-2">
            Jetzt Rechner öffnen <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>
    </Page>
  );
}

function Step({ icon, n, title, children }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <span className="inline-grid place-items-center h-11 w-11 rounded-xl bg-green-soft text-green-deep">{icon}</span>
        <span className="font-display text-2xl text-line">{n}</span>
      </div>
      <h3 className="mt-4 text-xl">{title}</h3>
      <p className="mt-1.5 text-[14.5px] text-ink-soft">{children}</p>
    </div>
  );
}

function Bullet({ icon, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-grid place-items-center h-7 w-7 shrink-0 rounded-lg bg-green-soft text-green-deep">{icon}</span>
      <span className="text-[14.5px] text-ink-soft">{children}</span>
    </li>
  );
}

function Lever({ label, v, note, tone }) {
  const bar = tone === 'full' ? 'bg-green-deep' : tone === 'mid' ? 'bg-green' : 'bg-amber';
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="text-[12.5px] text-ink-faint">{note}</span>
      </div>
      <div className="h-2.5 rounded-full bg-paper-2 overflow-hidden">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
