import { Link } from 'react-router-dom';
import { paramsFromProject, scenario } from '../lib/economics.js';
import { ct, eur } from '../lib/format.js';
import { Sun, Building2, Users, ArrowRight, Check, Scale, Calculator, FileText, Handshake, ShieldCheck } from 'lucide-react';

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="wrap pt-12 pb-14 lg:pt-20 lg:pb-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div>
          <div className="eyebrow">Gemeinschaftliche Gebäudeversorgung · §42b EnWG</div>
          <h1 className="mt-4 text-display">Solarstrom vom eigenen Dach –<br className="hidden sm:block" /> <span className="flowtext">organisiert von der Hausgemeinschaft</span>.</h1>
          <p className="text-ink-soft text-[15.5px] mt-4 max-w-prose2">
            Mieter:innen waren bei der Energiewende lange außen vor. EnergieFlow führt euch Schritt für Schritt
            von der Idee bis zum Vertrag – ohne Eigenkapital der Mietparteien, mit fairem Preis und fertigen Unterlagen.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link to="/rechner" className="btn-primary"><Calculator className="h-4 w-4" /> Projekt starten</Link>
            <Link to="/so-funktioniert-es" className="btn-ghost">So funktioniert's <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-2xs text-ink-faint">
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-grass-deep" /> Kein Eigenkapital der Mieter:innen</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-grass-deep" /> Frei verhandelbarer Preis</span>
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
          <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Der passende Rechtsrahmen">
            Die GGV nach §42b EnWG (Solarpaket I, 2024) macht die gemeinsame Versorgung praktikabel – ohne Eigenkapital der Mieter:innen.
          </Feature>
        </div>
      </section>

      {/* Ablauf */}
      <section className="wrap py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="eyebrow">In sechs Phasen</div>
          <h2 className="mt-2">Von der Idee bis zur Anlage – begleitet</h2>
          <p className="text-ink-soft mt-2">Der Arbeitsbereich führt euch durch jede Phase, erkennt erledigte Schritte automatisch und hält fertige Schreiben bereit.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            [Users, 'Hausgemeinschaft bilden', 'Nachbar:innen einladen und Zusagen sammeln.'],
            [Handshake, 'Eigentümerseite gewinnen', 'Mit Analyse und Anschreiben überzeugen.'],
            [Scale, 'Fair verhandeln', 'Preis finden, der für beide Seiten trägt.'],
            [FileText, 'Verträge erzeugen', 'GGV-Verträge je Wohnung auf Knopfdruck.'],
            [Calculator, 'Ehrlich rechnen', 'Belastbare Zahlen statt Schönrechnerei.'],
            [Sun, 'Umsetzen', 'Anlage beauftragen – Solarstrom fließt.'],
          ].map(([Icon, t, d]) => (
            <div key={t} className="panel p-5">
              <Icon className="h-5 w-5 text-grass-deep" />
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
              Wir rechnen mit dem Ariadne-Referenzmodell und beschönigen nichts: Die Rendite der Anlage ist im
              Standardfall niedrig, und Balkonkraftwerke sind für Einzelne eine einfache Alternative. Der Wert
              entsteht durch günstigeren Strom für viele und eine sinnvolle Nutzung des Daches.
            </p>
            <Link to="/wirtschaftlichkeit" className="link text-[14px] mt-4 inline-block">Wie wir rechnen →</Link>
          </div>
          <div className="card p-6">
            <div className="grid grid-cols-2 gap-4">
              <Mini label="Referenzanlage" value="30 kWp" sub="8 Wohneinheiten" />
              <Mini label="Datengrundlage" value="Ariadne" sub="IW Köln, 2025" />
              <Mini label="Preisgestaltung" value="frei" sub="GGV nach §42b" />
              <Mini label="Eigenkapital Mieter" value="0 €" sub="keine Einlage" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="wrap py-16 text-center">
        <h2>Bereit, das Dach in Bewegung zu bringen?</h2>
        <p className="text-ink-soft mt-2 max-w-xl mx-auto">Beginne mit einer unverbindlichen Schätzung. Ein paar Eckdaten zum Haus genügen.</p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link to="/rechner" className="btn-primary"><Calculator className="h-4 w-4" /> Schnellrechner öffnen</Link>
          <Link to="/modell" className="btn-ghost">Das GGV-Modell verstehen</Link>
        </div>
      </section>
    </div>
  );
}

function FlowVisual() {
  const E = paramsFromProject({});
  const r = scenario(E, { quotePct: 100, sharePct: 90 });
  const Node = ({ icon, title, sub, ring, glow }) => (
    <div className="relative flex items-center gap-3 pl-12">
      <span className={`absolute left-0 h-9 w-9 rounded-full grid place-items-center z-10 ${ring}`} style={glow ? { boxShadow: '0 0 22px 2px rgba(227,133,29,.6)' } : undefined}>{icon}</span>
      <div><div className="font-display font-semibold text-[14px] text-white">{title}</div><div className="text-2xs text-white/55">{sub}</div></div>
    </div>
  );
  return (
    <div className="nightpanel gridbg rounded-card-lg p-6 sm:p-7 shadow-glow relative overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-grass-live animate-glowpulse" />
        <span className="text-2xs font-semibold uppercase tracking-[.16em] text-white/55">So fließt die Energie</span>
      </div>
      <div className="relative space-y-7">
        <div className="absolute left-[18px] top-3 bottom-3 w-[3px] rounded-full current-charge" style={{ background: 'var(--flow-v)', boxShadow: '0 0 16px rgba(120,160,40,.5)' }} aria-hidden />
        <Node icon={<Sun className="h-4 w-4 text-white" />} ring="bg-sun" glow title="Sonne trifft aufs Dach" sub="PV-Anlage auf dem Mietshaus" />
        <Node icon={<Building2 className="h-4 w-4 text-white" />} ring="bg-grass" title="Strom im Gebäude" sub="gemeinschaftliche Versorgung (GGV)" />
        <Node icon={<Users className="h-4 w-4 text-white" />} ring="bg-grass-deep" title="Günstiger Strom für alle" sub="jede teilnehmende Wohnung spart" />
      </div>
      <div className="mt-7 pt-5 border-t border-night-line grid grid-cols-2 gap-4">
        <Readout label="Solarstrompreis" value={ct(r.solarpreis)} />
        <Readout label="Ersparnis je Haushalt" value={`${eur(r.tenantSavingsPerHH)}/a`} />
      </div>
      <p className="text-2xs text-white/40 mt-3">Referenz: 30 kWp · 8 Wohnungen · 90 % des Grundpreises</p>
    </div>
  );
}

function Readout({ label, value }) {
  return (
    <div>
      <div className="text-2xs font-semibold uppercase tracking-[.12em] text-white/45">{label}</div>
      <div className="font-display font-bold text-2xl text-white tnum tracking-tight mt-1">{value}</div>
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
function Mini({ label, value, sub }) {
  return (
    <div className="rounded-card bg-paper-2 p-3">
      <div className="kpi-label">{label}</div>
      <div className="font-display text-xl font-bold mt-0.5">{value}</div>
      <div className="text-2xs text-ink-faint">{sub}</div>
    </div>
  );
}
