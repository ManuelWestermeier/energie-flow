import { Link } from 'react-router-dom';
import { Sun, Building2, Users, ArrowRight, Check, Scale, Calculator, FileText, Handshake, ShieldCheck } from 'lucide-react';

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="wrap pt-12 pb-14 lg:pt-20 lg:pb-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div>
          <div className="eyebrow">Solarstrom für die Mietergemeinschaft</div>
          <h1 className="mt-4 text-display">Solarstrom vom eigenen Dach –<br className="hidden sm:block" /> <span className="flowtext">organisiert von der Hausgemeinschaft</span>.</h1>
          <p className="text-ink-soft text-[15.5px] mt-4 max-w-prose2">
            Mieter waren bei der Energiewende lange außen vor. EnergieFlow führt euch Schritt für Schritt von der ersten
            Idee bis zur fundierten Empfehlung, welches Modell sich für euer Haus lohnt – ohne Eigenkapital der Mietparteien.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link to="/rechner" className="btn-primary"><Calculator className="h-4 w-4" /> Projekt starten</Link>
            <Link to="/so-funktioniert-es" className="btn-ghost">So funktioniert's <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-2xs text-ink-faint">
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-grass-deep" /> Kein Eigenkapital der Mieter</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-grass-deep" /> Beide Modelle im Vergleich</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-grass-deep" /> Rechtssicher nach EnWG</span>
          </div>
        </div>
        <FlowVisual />
      </section>

      {/* Problem -> Lösung */}
      <section className="bg-paper border-y border-line">
        <div className="flowrule" />
        <div className="wrap py-14 grid md:grid-cols-3 gap-6">
          <Feature icon={<Building2 className="h-5 w-5" />} title="Das Dach gehört nicht euch">
            Im Mietshaus entscheidet die Eigentümerseite über das Dach – einzelne Mietparteien kommen an diese Fläche kaum heran.
          </Feature>
          <Feature icon={<Users className="h-5 w-5" />} title="Gemeinsam seid ihr stark">
            Als organisierte Hausgemeinschaft tretet ihr mit einem fertigen, fairen Vorschlag auf – das überzeugt.
          </Feature>
          <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Zwei tragfähige Wege">
            Mit dem Solarpaket I (2024) gibt es Mieterstrom und die gemeinschaftliche Gebäudeversorgung. EnergieFlow vergleicht beide neutral für euer Haus.
          </Feature>
        </div>
      </section>

      {/* Ablauf */}
      <section className="wrap py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="eyebrow">Schritt für Schritt</div>
          <h2 className="mt-2">Von der Idee bis zur Modell-Empfehlung</h2>
          <p className="text-ink-soft mt-2">Der Arbeitsbereich führt euch durch jede Phase, erkennt erledigte Schritte automatisch und hält die passenden Anschreiben bereit.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            [Users, 'Hausgemeinschaft bilden', 'Nachbarn einladen, Verbrauch und Zusagen sammeln.'],
            [Handshake, 'Eigentümerseite einbinden', 'Mit Analyse und Anschreiben überzeugen.'],
            [Calculator, 'Beide Modelle rechnen', 'GGV und Mieterstrom – belastbar statt schöngerechnet.'],
            [Scale, 'Fair einordnen', 'Preis und Beteiligung, die für beide Seiten tragen.'],
            [FileText, 'Anschreiben erzeugen', 'Einladungen an Mieter und Eigentümer auf Knopfdruck.'],
            [Sun, 'Informiert entscheiden', 'Klare Empfehlung, welches Modell zum Haus passt.'],
          ].map(([Icon, t, d], i) => (
            <div key={t} className="panel p-5 transition-colors duration-200 hover:border-grass-deep/40">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-grass-deep" />
                <span className="text-2xs font-display font-semibold text-ink-faint tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-3">{t}</h3>
              <p className="text-[13.5px] text-ink-soft mt-1">{d}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8"><Link to="/so-funktioniert-es" className="link text-[14px]">Den ganzen Ablauf ansehen →</Link></div>
      </section>

      {/* Ehrlichkeit */}
      <section className="bg-paper border-y border-line">
        <div className="wrap py-14 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="eyebrow">Ehrlich gerechnet</div>
            <h2 className="mt-2">Kein Renditeversprechen – ein gemeinsamer Nutzen</h2>
            <p className="text-ink-soft mt-3 text-[14.5px]">
              Wir rechnen beide Modelle auf einer belastbaren Datengrundlage und beschönigen nichts: Die Rendite ist im
              Standardfall überschaubar, und Balkonkraftwerke sind für Einzelne eine einfache Alternative. Der Wert entsteht
              durch günstigeren Strom für viele und eine sinnvolle Nutzung des Daches.
            </p>
            <Link to="/wirtschaftlichkeit" className="link text-[14px] mt-4 inline-block">Wie wir rechnen →</Link>
          </div>
          <div className="card p-6">
            <div className="kpi-label mb-3">Darauf legen wir Wert</div>
            <ul className="space-y-2.5">
              {[
                'GGV und Mieterstrom im direkten, neutralen Vergleich',
                'Datengrundlage: Ariadne-Analyse des IW Köln',
                'Kein Eigenkapital der Mietparteien',
                'Nachvollziehbare Rechnung statt Schönfärberei',
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-[14px] text-ink-soft"><Check className="h-4 w-4 text-grass-deep mt-0.5 shrink-0" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="wrap py-16 text-center">
        <h2>Bereit, das Dach in Bewegung zu bringen?</h2>
        <p className="text-ink-soft mt-2 max-w-xl mx-auto">Beginne mit einer unverbindlichen Schätzung. Ein paar Eckdaten zum Haus genügen.</p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link to="/rechner" className="btn-primary"><Calculator className="h-4 w-4" /> Schnellrechner öffnen</Link>
          <Link to="/modell" className="btn-ghost">Die beiden Modelle verstehen</Link>
        </div>
      </section>
    </div>
  );
}

/**
 * Hero visual — a quiet, schematic-style process card. Reads like a
 * technical one-line diagram (sun → building → tenants) rather than a
 * marketing graphic: hairline rule, flat numbered nodes, no glow or motion.
 */
function FlowVisual() {
  const steps = [
    { icon: Sun, num: '01', title: 'Sonne trifft aufs Dach', sub: 'PV-Anlage auf dem Mietshaus' },
    { icon: Building2, num: '02', title: 'Strom direkt im Gebäude', sub: 'vor Ort genutzt, ohne Umweg übers Netz' },
    { icon: Users, num: '03', title: 'Günstiger Strom für alle', sub: 'jede teilnehmende Wohnung profitiert' },
  ];

  return (
    <div className="rounded-card-lg border border-line bg-paper p-6 sm:p-7">
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-line">
        <span className="text-2xs font-semibold uppercase tracking-[.16em] text-ink-faint">Energiefluss im Gebäude</span>
        <span className="text-2xs text-ink-faint">Schema</span>
      </div>

      <div className="relative space-y-0">
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-line" aria-hidden />
        {steps.map(({ icon: Icon, num, title, sub }, i) => (
          <div key={num} className={`relative flex items-start gap-4 py-4 ${i !== steps.length - 1 ? 'border-b border-line/60' : ''}`}>
            <span className="relative z-10 h-10 w-10 shrink-0 rounded-full border border-line bg-paper grid place-items-center">
              <Icon className="h-4 w-4 text-grass-deep" />
            </span>
            <div className="pt-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xs font-display font-semibold text-ink-faint tabular-nums">{num}</span>
                <div className="font-display font-semibold text-[14px] text-ink">{title}</div>
              </div>
              <div className="text-[13px] text-ink-soft mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-5 border-t border-line">
        <p className="text-[13px] text-ink-soft leading-relaxed">Zwei Wege ins Haus: gemeinschaftliche Gebäudeversorgung oder Mieterstrom – EnergieFlow vergleicht beide und empfiehlt das passende.</p>
      </div>
    </div>
  );
}

function Feature({ icon, title, children }) {
  return (
    <div>
      <span className="h-10 w-10 rounded-card bg-grass-soft text-grass-deep grid place-items-center">{icon}</span>
      <h3 className="mt-3">{title}</h3>
      <p className="text-[14px] text-ink-soft mt-1.5">{children}</p>
    </div>
  );
}