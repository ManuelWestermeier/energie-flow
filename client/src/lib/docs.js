// ===========================================================================
//  docs.js — Erzeugung echter .docx-Dokumente (Bibliothek: docx)
//
//  Wichtig (Rechtslage, bewusst korrekt formuliert):
//   • Für die gemeinschaftliche Gebäudeversorgung (GGV, §42b EnWG) gilt FREIE
//     Preisgestaltung. Die 90-%-Grenze ist die Mieterstrom-Vorgabe (§42a Abs. 4
//     EnWG) und gilt für die GGV NICHT. Wir verwenden 90 % als freiwilligen
//     Fairness-Maßstab. Kein Dokument behauptet eine gesetzliche Preisdeckelung
//     für die GGV.
// ===========================================================================
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import { paramsFromProject, scenario, committedQuote } from './economics.js';
import { de, eur, ct, pct } from './format.js';

const INK = '1c2419';
const GREEN = '2f6b1e';
const FAINT = '6b7464';
const LINE = 'd9d3c4';

// ---- kleine Bausteine ------------------------------------------------------
const P = (text, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 120, before: o.before ?? 0, line: 276 },
  alignment: o.align,
  children: [new TextRun({ text, bold: o.bold, italics: o.italics, size: o.size ?? 21,
    color: o.color ?? INK, font: 'Calibri' })],
});
const Runs = (runs, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 120, line: 276 }, alignment: o.align,
  children: runs.map(r => new TextRun({ font: 'Calibri', size: 21, color: INK, ...r })),
});
const H1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing: { after: 160, before: 60 },
  children: [new TextRun({ text, bold: true, size: 34, color: INK, font: 'Calibri' })],
});
const H2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing: { after: 100, before: 200 },
  children: [new TextRun({ text, bold: true, size: 25, color: GREEN, font: 'Calibri' })],
});
const Spacer = () => new Paragraph({ text: '', spacing: { after: 60 } });

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const thin = { style: BorderStyle.SINGLE, size: 4, color: LINE };

function dataTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: thin, bottom: thin, left: noBorder, right: noBorder, insideHorizontal: thin, insideVertical: noBorder },
    rows: rows.map(([k, v], i) => new TableRow({
      children: [
        new TableCell({
          width: { size: 58, type: WidthType.PERCENTAGE },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: k, size: 21, color: FAINT, font: 'Calibri' })] })],
        }),
        new TableCell({
          width: { size: 42, type: WidthType.PERCENTAGE },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: String(v), size: 21, bold: true, color: INK, font: 'Calibri' })] })],
        }),
      ],
    })),
  });
}

function bullets(items) {
  return items.map(t => new Paragraph({
    bullet: { level: 0 }, spacing: { after: 60, line: 276 },
    children: [new TextRun({ text: t, size: 21, color: INK, font: 'Calibri' })],
  }));
}

function brandHeader() {
  return [
    Runs([{ text: 'EnergieFlow', bold: true, size: 26, color: GREEN }, { text: '  ·  SolarGemeinschaft', size: 20, color: FAINT }], { after: 40 }),
    new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE } }, children: [new TextRun({ text: '', size: 2 })] }),
  ];
}

function adresse(project) {
  const a = [project.street, project.hausnr].filter(Boolean).join(' ');
  const b = [project.plz, project.ort].filter(Boolean).join(' ');
  return [a, b].filter(Boolean).join(', ');
}

function makeDoc(children) {
  return new Document({
    creator: 'EnergieFlow', title: 'EnergieFlow Dokument',
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{ properties: { page: { margin: { top: 1100, bottom: 1100, left: 1200, right: 1200 } } }, children }],
  });
}

async function download(doc, filename) {
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

const heute = () => new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
const link = (origin, token) => `${origin || ''}/join/${token}`;

// Szenario aus Projekt + (optional übergebenen) Verhandlungswerten ableiten
function calc(project, opts = {}) {
  const E = paramsFromProject(project);
  const quotePct = opts.quotePct != null ? opts.quotePct : (committedQuote(project) || 100);
  const sharePct = opts.sharePct != null ? opts.sharePct : project.share_pct;
  return { E, quotePct, sharePct, r: scenario(E, { quotePct, sharePct }) };
}

// Liste der noch sinnvollen „Feindaten" (für die Vermieter-Anfrage)
const FEINDATEN = [
  'Genaue nutzbare Dachfläche, Ausrichtung und Neigung (für die exakte Anlagengröße).',
  'Vorliegende Angebote bzw. Investitionskosten der Anlage inkl. Montage und ggf. Speicher.',
  'Aktueller Grundversorgungstarif am Standort (Cent/kWh) als Vergleichsmaßstab.',
  'Zuständiger Netzbetreiber und vorhandenes Zähler-/Messkonzept.',
  'Bestehende Wartungs-/Versicherungsverträge, die mitgenutzt werden könnten.',
  'Geplanter Umsetzungszeitraum aus Sicht der Eigentümerseite.',
];

// ---------------------------------------------------------------------------
//  1) Anschreiben an einen Vermieter (individuell, mit Einladungslink)
// ---------------------------------------------------------------------------
export function buildVermieterLetter(project, invite, opts = {}) {
  const { quotePct, sharePct, r } = calc(project, opts);
  const ziel = invite?.label ? invite.label : 'Eigentümerseite';
  const c = [
    ...brandHeader(),
    Runs([{ text: 'An: ', color: FAINT }, { text: ziel, bold: true }], { after: 20 }),
    P(`Objekt: ${adresse(project) || project.name}`, { after: 20, color: FAINT }),
    P(heute(), { align: AlignmentType.RIGHT, after: 160, color: FAINT }),

    H1('Gemeinsame Solaranlage für unser Gebäude'),
    P(`sehr geehrte Damen und Herren,`, { after: 120 }),
    P(`wir – mehrere Mieter Ihres Hauses – möchten gemeinsam eine ` +
      `Photovoltaikanlage auf dem Dach realisieren. Wir treten dabei nicht einzeln, ` +
      `sondern als organisierte Hausgemeinschaft an Sie heran. Bereits ${pct(quotePct, 0)} ` +
      `der Wohneinheiten haben Interesse signalisiert.`),
    P(`Rechtlich stützen wir uns auf die gemeinschaftliche Gebäudeversorgung (GGV) nach ` +
      `§42b EnWG, die seit dem Solarpaket I (Mai 2024) gilt. Der vor Ort erzeugte Strom ` +
      `wird direkt im Gebäude verbraucht, der Rest ins Netz eingespeist. Anders als beim ` +
      `Mieterstrom (§42a EnWG) ist die GGV bewusst schlank gehalten – ohne Lieferantenpflichten ` +
      `für die volle Reststrommenge.`),

    H2('Was wir vorschlagen'),
    ...bullets([
      `Sie als Eigentümer bleiben Betreiber der Anlage; wir Mieter beziehen den ` +
        `Solarstrom direkt und zahlen dafür einen vereinbarten Preis.`,
      `Als fairen Ausgangspunkt schlagen wir ${pct(sharePct, 0)} des örtlichen ` +
        `Grundversorgungstarifs für den Solarstrom vor. Dieser Preis ist frei verhandelbar – ` +
        `die GGV schreibt keine Obergrenze vor.`,
      `Den Reststrom bezieht weiterhin jede Partei selbst von ihrem eigenen Anbieter. ` +
        `Es entsteht keine Voll­versorgungspflicht für Sie.`,
    ]),

    H2('Erste Wirtschaftlichkeits-Einschätzung'),
    P(`Auf Basis der bisher bekannten Daten (Schätzwerte, u. a. nach der Ariadne-Analyse ` +
      `des IW Köln, 2025):`, { after: 120, color: FAINT }),
    dataTable([
      ['Anlagengröße (Annahme)', `${de(project.kwp)} kWp`],
      ['Beteiligte Wohneinheiten', `${de(r.teil, 1)} von ${de(project.we)}`],
      ['Direkt genutzter Solarstrom', `${de(r.solar)} kWh/Jahr`],
      ['Solarstrompreis (Vorschlag)', `${ct(r.solarpreis)} / kWh`],
      ['Jährlicher Überschuss (Eigentümer)', `${eur(r.netto)} / Jahr`],
      ['Rendite über ' + de(project.zeitraum) + ' Jahre', r.irr == null ? 'rechnet sich im Zeitraum noch nicht' : pct(r.irr * 100, 1) + ' p.a.'],
      ['Ersparnis aller Mieter', `${eur(r.tenantSavingsTotal)} / Jahr`],
      ['Vermiedenes CO₂', `${de(r.co2)} kg / Jahr`],
    ]),
    P(`Hinweis: Die Anlagen­rendite der GGV ist für sich genommen moderat. Ihr Vorteil liegt ` +
      `vor allem in einer aktivierten, mittragenden Mieterschaft, planbarer Dachnutzung und ` +
      `einem Beitrag zur energetischen Aufwertung des Gebäudes.`, { italics: true, color: FAINT, after: 160 }),

    H2('Wir brauchen noch ein paar genaue Angaben von Ihnen'),
    P(`Damit aus der Schätzung eine belastbare, gebäudegenaue Rechnung wird, bitten wir Sie um:`, { after: 100 }),
    ...bullets(FEINDATEN),

    H2('Alles transparent online'),
    P(`Wir haben das Vorhaben auf einer gemeinsamen Plattform organisiert. Über den folgenden ` +
      `Link können Sie dem Projekt beitreten, sämtliche Daten und die laufende ` +
      `Wirtschaftlichkeitsanalyse einsehen, eigene Angaben ergänzen und – wenn Sie möchten – ` +
      `einen abweichenden Preisanteil vorschlagen:`),
    invite ? Runs([{ text: 'Ihr persönlicher Zugang: ', bold: true }, { text: link(opts.origin, invite.token), color: GREEN, bold: true }], { after: 160 })
           : P('(Einladungslink wird beim Versand ergänzt.)', { italics: true, color: FAINT, after: 160 }),

    P(`Über ein Gespräch würden wir uns sehr freuen.`, { after: 40 }),
    P(`Mit freundlichen Grüßen`, { after: 200 }),
    P(`Die Hausgemeinschaft ${adresse(project) || project.name}`, { bold: true }),
    Spacer(),
    P(`Dieses Schreiben ist ein Entwurf und ersetzt keine Rechts- oder Steuerberatung.`, { size: 16, color: FAINT, italics: true }),
  ];
  return download(makeDoc(c), `Anschreiben_Vermieter_${(invite?.label || 'Eigentuemer').replace(/\s+/g, '_')}.docx`);
}

// ---------------------------------------------------------------------------
//  2) Anschreiben an Mitmieter (Einladung ins Projekt)
// ---------------------------------------------------------------------------
export function buildMitmieterLetter(project, invite, opts = {}) {
  const { quotePct, sharePct, r } = calc(project, opts);
  const c = [
    ...brandHeader(),
    P(`An alle Mitmieterinnen und Mitmieter`, { color: FAINT, after: 20 }),
    P(`Objekt: ${adresse(project) || project.name}`, { color: FAINT, after: 160 }),

    H1('Machen wir gemeinsam Solar aufs Dach'),
    P(`liebe Nachbarinnen und Nachbarn,`),
    P(`ich möchte erreichen, dass auf unser Hausdach eine Photovoltaikanlage kommt – und dass ` +
      `wir den Strom günstiger bekommen als aus dem Netz. Allein ist das schwer, gemeinsam ` +
      `nicht: Je mehr von uns mitmachen, desto besser rechnet es sich und desto mehr ` +
      `Verhandlungsgewicht haben wir gegenüber der Eigentümerseite.`),

    H2('Wie es funktioniert'),
    ...bullets([
      `Wir nutzen die gemeinschaftliche Gebäudeversorgung (GGV, §42b EnWG). Der Strom vom ` +
        `Dach wird direkt bei uns im Haus verbraucht.`,
      `Wir zahlen für den Solarstrom einen vereinbarten Preis – als fairen Startpunkt ` +
        `${pct(sharePct, 0)} des Grundversorgungstarifs. Den Reststrom behält jeder beim ` +
        `eigenen Anbieter.`,
      `Niemand muss Geld investieren: Betreiber der Anlage bleibt die Eigentümerseite.`,
    ]),

    H2('Was bisher gerechnet ist'),
    dataTable([
      ['Beteiligung aktuell', `${pct(quotePct, 0)} der Wohnungen`],
      ['Solarstrompreis (Startwert)', `${ct(r.solarpreis)} / kWh`],
      ['Ersparnis je Haushalt', `rund ${eur(r.tenantSavingsPerHH)} / Jahr`],
      ['Vermiedenes CO₂', `${de(r.co2)} kg / Jahr`],
    ]),
    P(`Diese Zahlen werden genauer, je mehr von euch die eigenen Verbrauchsdaten bestätigen.`, { color: FAINT, italics: true, after: 160 }),

    H2('Mitmachen in zwei Minuten'),
    P(`Tritt unserem Projekt bei, sieh dir alle Daten an und bestätige kurz deinen ` +
      `Stromverbrauch. Hier ist der Link:`),
    invite ? Runs([{ text: 'Beitreten: ', bold: true }, { text: link(opts.origin, invite.token), color: GREEN, bold: true }], { after: 160 })
           : P('(Einladungslink wird ergänzt.)', { italics: true, color: FAINT, after: 160 }),
    P(`Viele Grüße`, { after: 40 }),
    P(`Deine Nachbarin / dein Nachbar`, { bold: true }),
  ];
  return download(makeDoc(c), 'Anschreiben_Mitmieter.docx');
}

// ---------------------------------------------------------------------------
//  2b) Anschreiben an selbstnutzende Eigentümer (Eigentümer, die selbst im Haus wohnen)
// ---------------------------------------------------------------------------
export function buildSelbstnutzerLetter(project, invite, opts = {}) {
  const { quotePct, sharePct, r } = calc(project, opts);
  const ziel = invite?.label ? invite.label : 'Eigentümer im Haus';
  const c = [
    ...brandHeader(),
    Runs([{ text: 'An: ', color: FAINT }, { text: ziel, bold: true }], { after: 20 }),
    P(`Objekt: ${adresse(project) || project.name}`, { color: FAINT, after: 160 }),

    H1('Solar aufs Dach – Sie wohnen und besitzen hier'),
    P(`sehr geehrte Eigentümerin, sehr geehrter Eigentümer,`, { after: 120 }),
    P(`als Eigentümer, der selbst im Haus wohnt, profitieren Sie doppelt von einer gemeinsamen ` +
      `Photovoltaikanlage: Als Bewohner beziehen Sie den Solarstrom günstiger als aus dem Netz, ` +
      `und als Miteigentümer entscheiden Sie über die Dachnutzung mit. Bereits ${pct(quotePct, 0)} ` +
      `der Wohneinheiten zeigen Interesse.`),
    P(`Für die Umsetzung gibt es zwei Wege – die gemeinschaftliche Gebäudeversorgung (§42b EnWG) ` +
      `und den Mieterstrom (§42a EnWG). Wir rechnen beide neutral durch und wählen gemeinsam das ` +
      `Modell, das für unser Gebäude am besten passt. In beiden Fällen wird der Strom vom Dach ` +
      `direkt im Haus verbraucht.`),

    H2('Was das für Sie heißt'),
    ...bullets([
      `Als Bewohner zahlen Sie für den Solarstrom einen vereinbarten Preis – als fairen ` +
        `Startpunkt ${pct(sharePct, 0)} des örtlichen Grundpreises.`,
      `Als Miteigentümer reden Sie bei Anlage, Modellwahl und Preis mit.`,
      `Bei der GGV behalten Sie den Reststrom bei Ihrem eigenen Anbieter. Eigenkapital ist nicht nötig.`,
    ]),

    H2('Wir brauchen Ihren Jahresverbrauch'),
    P(`Damit die Rechnung gebäudegenau wird, geben Sie beim Beitritt bitte Ihren ` +
      `Jahresstromverbrauch an (steht auf der Stromrechnung). Je mehr Verbrauch im Haus direkt ` +
      `gedeckt wird, desto wirtschaftlicher ist die Anlage für alle.`, { after: 120 }),

    H2('So treten Sie bei'),
    P(`Über den folgenden Link treten Sie dem Projekt bei, sehen alle Daten und die laufende ` +
      `Wirtschaftlichkeitsanalyse und hinterlegen Ihren Verbrauch:`),
    invite ? Runs([{ text: 'Ihr Zugang: ', bold: true }, { text: link(opts.origin, invite.token), color: GREEN, bold: true }], { after: 160 })
           : P('(Einladungslink wird beim Versand ergänzt.)', { italics: true, color: FAINT, after: 160 }),
    P(`Mit freundlichen Grüßen`, { after: 40 }),
    P(`Die Hausgemeinschaft ${adresse(project) || project.name}`, { bold: true }),
    Spacer(),
    P(`Dieses Schreiben ist ein Entwurf und ersetzt keine Rechts- oder Steuerberatung.`, { size: 16, color: FAINT, italics: true }),
  ];
  return download(makeDoc(c), `Anschreiben_Selbstnutzer_${(invite?.label || 'Eigentuemer').replace(/\s+/g, '_')}.docx`);
}

// ---------------------------------------------------------------------------
//  3) Wirtschaftlichkeitsanalyse (zum Anhängen / Archivieren)
// ---------------------------------------------------------------------------
export function buildWirtschaftlichkeit(project, opts = {}) {
  const { E, quotePct, sharePct, r } = calc(project, opts);
  const c = [
    ...brandHeader(),
    H1('Wirtschaftlichkeitsanalyse'),
    P(`${adresse(project) || project.name} · Stand ${heute()}`, { color: FAINT, after: 160 }),

    H2('Angenommene Eingangsdaten'),
    dataTable([
      ['Standort / Bundesland', project.bundesland || '—'],
      ['Wohneinheiten im Haus', de(project.we)],
      ['Anlagengröße', `${de(project.kwp)} kWp`],
      ['Spezifischer Ertrag', `${de(E.ertrag)} kWh/kWp·a`],
      ['Investition', eur(E.invest)],
      ['Betriebskosten', `${eur(E.opex)} / Jahr`],
      ['Versicherung', `${eur(E.versicherung)} / Jahr`],
      ['Grundversorgungstarif', `${ct(E.gvpreis)} / kWh`],
      ['Einspeisevergütung', `${ct(E.einspeise)} / kWh`],
      ['Betrachtungszeitraum', `${de(E.zeitraum)} Jahre`],
    ]),

    H2('Verhandlungsparameter'),
    dataTable([
      ['Beteiligungsquote', `${pct(quotePct, 0)} (${de(r.teil, 1)} von ${de(project.we)} WE)`],
      ['Solarstrompreis', `${pct(sharePct, 0)} des Grundpreises = ${ct(r.solarpreis)} / kWh`],
    ]),

    H2('Ergebnis'),
    dataTable([
      ['Jahreserzeugung', `${de(r.erz)} kWh`],
      ['Direkt genutzter Solarstrom', `${de(r.solar)} kWh (${pct(r.direktquote)})`],
      ['Netzeinspeisung', `${de(r.feed)} kWh`],
      ['Erlös Direktlieferung', `${eur(r.einnSolar)} / Jahr`],
      ['Erlös Einspeisung', `${eur(r.einnFeed)} / Jahr`],
      ['Betriebskosten gesamt', `${eur(r.kosten)} / Jahr`],
      ['Überschuss Eigentümerseite', `${eur(r.netto)} / Jahr`],
      ['Amortisation', r.amort == null ? '> Betrachtungszeitraum' : `${de(r.amort, 1)} Jahre`],
      ['Interne Rendite (IRR)', r.irr == null ? 'rechnet sich im Zeitraum nicht' : `${pct(r.irr * 100, 1)} p.a.`],
      ['Ersparnis aller Mieter', `${eur(r.tenantSavingsTotal)} / Jahr`],
      ['Ersparnis je Haushalt', `${eur(r.tenantSavingsPerHH)} / Jahr`],
      ['Vermiedenes CO₂', `${de(r.co2)} kg / Jahr`],
    ]),

    Spacer(),
    P(`Methodik & Ehrlichkeitshinweis`, { bold: true, color: GREEN, after: 60 }),
    P(`Die Direktverbrauchsquote ist auf maximal ${pct(E.qmax)} begrenzt (Referenzwert der ` +
      `Ariadne-Analyse, IW Köln 2025, 30 kWp / 8 WE). Versicherungskosten sind hier explizit ` +
      `enthalten – in der Ariadne-Basis sind sie es nicht, weshalb unsere Rendite bewusst ` +
      `etwas vorsichtiger ausfällt. Für die GGV (§42b EnWG) gilt freie Preisgestaltung; die ` +
      `90-%-Marke ist ein freiwilliger Fairness-Maßstab, keine gesetzliche Vorgabe.`,
      { size: 18, color: FAINT, italics: true }),
  ];
  return download(makeDoc(c), 'Wirtschaftlichkeitsanalyse.docx');
}
