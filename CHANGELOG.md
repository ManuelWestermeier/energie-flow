# Changelog

## 4.6.0 – Design-Feinschliff (Systemebene)

Eine kohaerente Verfeinerungsschicht ueber Tokens und geteilte Komponenten – wirkt site-weit,
im bestehenden Charakter (Solar-Palette, „Strom"-Signature), ohne Layout-Bruch.

### Geaendert
- **Elevation**: Karten-Schatten von flach auf weich-geschichtet umgestellt – Karten heben sich
  ruhiger von der Flaeche ab (Token `shadow-card`), neuer `shadow-card-hover` fuer interaktive Flaechen.
- **Seitenkopf**: vor jeder Ueberschrift eine kleine Marken-Flussmarkierung (gruen→orange),
  als wiederkehrendes, gegruendetes Detail.
- **Hinweisboxen**: farbiger Akzentstreifen links (Info/Gruen/Orange) statt flachem Kasten.
- **Buttons**: dezenter Hover-Lift und feinere Schatten fuer mehr Haptik (primaer/orange).
- **Textsatz**: schoenere Absatzumbrueche (`text-wrap: pretty`) und bessere Schriftglaettung.
- **Eingaben/Modal/Avatar**: weicherer Fokus-Uebergang, ruhigerer Modal-Hintergrund, feiner
  Avatar-Ring.

### Hinweis
- Bewusst maßvoll und systemweit gehalten. Einzelne Schluesselflaechen (Startseite-Hero,
  Dashboard) lassen sich auf Wunsch gezielt weiter zuspitzen.

## 4.5.0 – Scope: Ende bei der Empfehlung (Vertraege entfernt, Fahrplan angepasst)

Die Plattform endet bei der Modell-Empfehlung an die Eigentuemerseite. Die Vertrags-/
Umsetzungsfunktionen wurden entfernt; Anschreiben und Wirtschaftlichkeitsanalyse bleiben als
Aktivierungs- und Empfehlungs-Unterlagen erhalten.

### Entfernt
- **Vertragsgenerator** (`buildVertrag`, GGV-Stromliefervertrag je Wohnung) aus `docs.js` und
  der zugehoerige Bereich „GGV-Vertraege je Wohnung" auf der Dokumente-Seite.

### Geaendert
- **Dokumente-Seite**: Kopf „Anschreiben & Analyse erzeugen"; nur noch Wirtschaftlichkeits-
  analyse und Anschreiben (Mitmieter, Eigentuemerseite, selbstnutzende Eigentuemer). Hinweis
  benennt jetzt den Scope (Verträge/Anbieter/Anlagenbau = kuenftige Ausbaustufe).
- **Fahrplan** (`phases.js`): Phase 6 „Verträge & Umsetzung" → „Modell empfehlen & entscheiden"
  (Modellvergleich ansehen, Analyse als Unterlage erzeugen, Modellentscheidung treffen).
- **Roadmap-Seite**: Titel „Von der Idee zur Modell-Empfehlung"; neuer **Ausblick** auf die
  kuenftige Ausbaustufe (GGV-Weiterbetreuung bzw. Vermittlung an Mieterstrom-Anbieter und
  Anlagenbauer) – klar als noch nicht Teil der Plattform gekennzeichnet.

## 4.4.0 – Selbstnutzende Eigentuemer als Teilnehmertyp

Eigentuemer, die selbst im Haus wohnen, sind zugleich Miteigentuemer und verbrauchende
Haushalte. Sie haben jetzt eine eigene Rolle (`selbstnutzer`) mit eigenen Einladungs-Links
und Anschreiben und werden – wie Mieter – nach ihrem Jahresverbrauch gefragt. Anders als die
reine Eigentuemerseite (`vermieter`) zaehlen sie als Verbraucher in die Analyse und in die
Beteiligung.

### Neu
- **Rolle „selbstnutzende Eigentuemer"**: eigener Einladungs-Link unter „Hausgemeinschaft"
  (dritte Spalte), eigenes Rollen-Label in der Mitgliederliste, rollengerechte Texte auf der
  Beitritts-Seite.
- **Anschreiben** fuer selbstnutzende Eigentuemer (`buildSelbstnutzerLetter`) mit Beitritts-Link
  und Verbrauchsabfrage, modell-neutral; als eigener Bereich auf der Dokumente-Seite.
- **Verbrauchsabfrage** greift fuer Selbstnutzer wie fuer Mieter (Beitritts-Flow); sie zaehlen
  ueber `consumptionStats` und `committedQuote` als verbrauchende, beteiligte Haushalte.

### Hinweis
- Rechte: Selbstnutzer schlagen Anlagendaten/Preis vor (wie Mieter) und stimmen zu; direkte
  Aenderungen bleiben Admin und Eigentuemerseite vorbehalten.

## 4.3.0 – Genehmigungs-Workflow fuer Mietervorschlaege

Eingeladene Mieter koennen Anlagen-/Hausdaten und den Preis nur noch **vorschlagen**; der
**Admin (Projektleitung) gibt frei oder lehnt ab**, bevor ein Vorschlag wirksam und fuer die
anderen Mieter sichtbar wird. Admin und Eigentuemerseite wirken weiterhin direkt.

### Neu
- **Vorschlaege mit Status**: Datenmodell erweitert um `kind` (price/data) und `status`
  (pending/approved/rejected) sowie `patch` fuer Datenvorschlaege. Mietervorschlaege sind
  `pending`, Vorschlaege von Admin/Eigentuemerseite direkt `approved`.
- **Betrachter-Filter** in `fullProject`: Der Admin sieht alle Vorschlaege (Review-Queue),
  alle anderen nur freigegebene plus die eigenen – offene Vorschlaege bleiben fuer die uebrige
  Hausgemeinschaft unsichtbar.
- **Freigabe-Endpunkt** (`PATCH /proposals`, nur Admin): genehmigt (wendet Preis bzw.
  Datenaenderung an) oder lehnt ab; bei Preisfreigabe werden die Zustimmungen zurueckgesetzt.
- **Verhandlung**: rollenabhaengiges Preis-Panel (festlegen vs. vorschlagen), Admin-Review-Queue
  „Offene Vorschlaege" mit Genehmigen/Ablehnen, Status-Kennzeichnung im Verlauf.
- **Gebaeude**: Mieter koennen Anlagendaten **vorschlagen** (nur geaenderte Felder), mit Hinweis
  auf den ausstehenden Freigabestatus; Admin/Eigentuemerseite bearbeiten weiterhin direkt.

### Hinweis
- Der Fahrplan-Auto-Schritt „Preis verhandelt" zaehlt jetzt nur noch freigegebene Preisvorschlaege.

## 4.2.2 – Neutralisierung der uebrigen Seiten

Die GGV-Bevorzugung wurde auf den verbleibenden Flaechen entfernt; beide Modelle (GGV §42b
und Mieterstrom §42a) werden ueberall gleichwertig dargestellt. Vertragsversprechen in der
oeffentlichen Darstellung sind ersetzt (Scope endet bei der Empfehlung).

### Geaendert
- **FAQ**: Antworten zu Investition, bestehendem Stromvertrag, 90-%-Grenze und Balkonkraftwerk
  auf beide Modelle umgestellt; die Vertrags-Frage durch eine Frage zu den erstellten Unterlagen
  ersetzt (Anschreiben + Analyse statt Vertraege).
- **So funktioniert's**: Intro und "Was EnergieFlow uebernimmt" modell-neutral und scope-ehrlich.
- **Wie wir rechnen**: Rechenbeispiel als GGV-Variante gekennzeichnet, Mieterstrom-Unterschiede
  benannt; GGV-bevorzugende Formulierungen entfernt.
- **Footer & Navigation**: "Das GGV-Modell" → "Die Modelle"; Footer nennt beide Modelle;
  Vertrags-Hinweis entfernt.
- **Projektseiten** (Ueberblick, Verhandlung, Gebaeude): Preis-Hinweis nennt beide Modelle;
  "Vertraege" → "Empfehlung"/"Unterlagen" in der Verlinkung.

### Hinweis
- Die Seite "Dokumente" und der Fahrplan (phases.js) bleiben bewusst unveraendert – ihre
  Neutralisierung erfolgt zusammen mit dem Entfernen des Vertrags-/Dokumententeils (Punkt 4).

## 4.2.1 – Verbrauchsabfrage bei Erstellung und Beitritt

Der eigene Jahresstromverbrauch wird jetzt direkt beim **Anlegen** eines Projekts (Schnell-
rechner, Schritt "Dach & Module") und beim **Beitritt** ueber einen Einladungslink abgefragt –
statt erst nachtraeglich auf der Hausgemeinschaft-Seite. Er wird am Mitglied gespeichert und
fliesst unmittelbar in die Wirtschaftlichkeitsanalyse ein (consumptionStats → consumptionFactor).

### Neu
- **Verbrauchsfeld** im Erstellungs-Flow (fuer die anlegende Person) und im Beitritts-Flow
  (fuer beitretende Mieter), jeweils mit Schaetz-Presets nach Haushaltsgroesse.
- Backend: `addMember` nimmt `verbrauch` entgegen; Erstellung und Beitritt reichen ihn durch
  und protokollieren ihn in der Aktivitaet.
- Die Eigentuemerseite wird bewusst nicht nach Verbrauch gefragt (kein verbrauchender Haushalt;
  selbstnutzende Eigentuemer folgen als eigener Teilnehmertyp).

## 4.2.0 – Dual-Modell & neutrale Positionierung

Die Plattform rechnet jetzt **beide Modelle** (GGV und Mieterstrom) fuer dasselbe Gebaeude
und positioniert sich durchgehend **neutral** zwischen beiden. Die Arbeit der Plattform
endet bei der **Modell-Empfehlung an die Eigentuemerseite** – Vertraege, Anbieterwahl und
Anlagenbau sind aktuell nicht Teil (geplante Zukunfts-Ausbaustufe: GGV-Weiterbetreuung bzw.
Vermittlung an Mieterstrom-Anbieter und Anlagenbauer).

### Neu
- **Mieterstrom-Modell** in der Wirtschaftlichkeits-Engine, an der Ariadne-Basisvariante
  (Tabelle 9, 30 kWp / 8 WE) kalibriert: reproduziert Ueberschuss, internen Zinsfuss
  (1,4 % GGV / 3,6 % Mieterstrom) und Amortisation (17,3 / 14,0 Jahre). Mieterstromzuschlag
  (rd. 2,1 ct/kWh auf direkt gelieferten PV-Strom) und Reststrom-Nettomarge (rd. 76,5 € je
  teilnehmendem Haushalt) als dokumentierte, quellenbasierte Annahmen.
- **GGV/Mieterstrom-Schalter** auf der Wirtschaftlichkeitsseite: Kennzahlen, Hebel-Diagramm,
  Sensitivitaetsmatrix und Aufschluesselung rechnen fuer das gewaehlte Modell; beim Mieterstrom
  zusaetzliche Zeilen fuer Zuschlag und Reststrommarge.
- **Neutraler Modellvergleich** (vormals einseitige Empfehlung): beide Modelle mit echten
  Zahlen nebeneinander, faktenbasierte Empfehlung je Gebaeude und der ehrliche Hinweis, dass
  Mieterstrom meist renditestaerker ist, waehrend die Faktoren ueber die Eignung entscheiden.

### Geaendert
- **Neutrale Positionierung** site-weit begonnen: GGV-Bevorzugung ("Rueckgrat/Speerspitze/
  tragfaehigere Grundlage") entfernt auf Startseite, Modell-Seite und Wirtschaftlichkeit.
- **Startseite ohne Zahlen**: alle werblichen Kennzahlen entfernt, qualitative Darstellung.
- **Scope-Korrektur**: keine Vertragsversprechen mehr in der oeffentlichen Darstellung.
- **Nicht gendern**: alle gegenderten Formen site-weit entfernt (generisches Maskulinum).

### Offen (naechste Durchgaenge)
- Verbrauchsabfrage bei Projekterstellung und Beitritt
- Genehmigungs-Workflow: Mietervorschlaege zu Anlagen-/Hausdaten und Preis, vom Admin freigegeben
- Selbstnutzende Eigentuemer als Teilnehmertyp inkl. Anschreiben/Links
- Vertrags-/Dokumentenerzeugung entfernen (Scope), Roadmap/Phasen anpassen
- Restliche Seiten neutralisieren, Design-Ueberarbeitung

## 4.1.0 – Modellempfehlung: GGV oder Mieterstrom je Gebäude (beratend)

Die Wirtschaftlichkeit zeigt jetzt zuerst eine **beratende Empfehlung**, welches Modell
zum konkreten Gebäude passt – die Eigentümerseite entscheidet informiert. Die GGV bleibt
**operativ das Rückgrat** der Plattform: Engine, Dokumentenerzeugung und Verträge sind
unverändert, es wurde kein zweites Abrechnungs-/Vertragsregime gebaut.

### Neu
- **Modellempfehlung** auf der Seite „Wirtschaftlichkeit“: empfiehlt je Gebäude GGV oder
  Mieterstrom, mit sichtbarer Begründung (Faktoren für beide Seiten) und der ehrlichen
  Trade-off-Aussage – Zugänglichkeit/niedrige Hürde der GGV gegen die höhere Rendite des
  Mieterstroms. Pro Gebäude ist es ein Entweder-oder, kein Sowohl-als-auch.
- Entscheidungsfaktoren als **lokale Eingaben** (nichts wird gespeichert): Eigentümertyp
  (privat/WEG/Unternehmen), Bereitschaft zur Vollversorgung samt Reststromrisiko,
  Mieterstromzuschlag-Wunsch, Erhalt der erweiterten Gewerbesteuerkürzung. Die
  Gebäudegröße kommt aus den Projektdaten.
- **Referenz-Einordnung mit Quelle:** interner Zinsfuß GGV 1,4 % vs. Mieterstrom 3,6 %
  (Ariadne-Analyse, Basisvariante 8 WE / 30 kWp, Tabelle 9 / S. 56–58).

### Technik
- Neu: `client/src/lib/modelRecommendation.js` (reine, nachvollziehbare Entscheidungslogik)
  und `client/src/components/ModelRecommendation.jsx`. Eingebunden mit zwei Zeilen in
  `client/src/pages/project/Economics.jsx`. Sonst keine Änderungen.

## 4.0.0 – Umzug auf Cloudflare Pages (Functions + KV)

Das gesamte Backend läuft jetzt **serverlos auf Cloudflare Pages**: Die API ist als
**Pages Functions** (`onRequest`) implementiert, die Daten liegen in **Cloudflare KV**.
Der bisherige Node-Server (Express + Socket.IO + Datei-JSON-Store) entfällt vollständig.
Das React/Vite-Frontend bleibt funktional unverändert – Anmeldung, Hub, PV-Planer,
Wirtschaftlichkeit und Vertragsentwürfe verhalten sich wie zuvor.

### Architektur
- **API → Pages Functions.** Jede Route ist eine Datei unter `functions/api/…` mit
  `onRequest`/`onRequestGet`/`onRequestPost` (file-based routing). Die gemeinsame Logik
  liegt in `functions/_lib/` (`store.js`, `auth.js`, `http.js`, `ids.js`, `upstream.js`).
- **Persistenz → Cloudflare KV.** Der Datenbestand ist ein JSON-Blob unter dem Schlüssel
  `db` (Binding `env.DB`); pro Request wird einmal geladen und einmal gespeichert. Die
  Store-Logik ist ein **1:1-Port** der bisherigen Funktionen – gleiche Felder, gleiche
  Konsens-Berechnung, gleicher `fullProject`-Aufbau.
- **Auth → PBKDF2 (Web Crypto).** Statt bcrypt werden Passwörter mit PBKDF2 (SHA-256,
  100 000 Iterationen) gehasht – nativ, ohne Abhängigkeit, CPU-budget-tauglich. Weiterhin
  **HTTP Basic ohne Token/Session**; Vergleich in konstanter Zeit.
- **Live-Sync → Polling.** Da Pages Functions keine dauerhaften WebSockets bieten, ersetzt
  kurzes Polling (7 s + beim Zurückwechseln in den Tab) die Socket.IO-Synchronisation. Die
  handelnde Person sieht ihre Änderungen sofort (jede Mutation liefert den vollen Zustand
  zurück).
- **Planer-Proxy → fetch.** Die externen Dienste (Nominatim, Overpass, PVGIS) laufen über
  das globale `fetch` statt über das Node-`https`-Modul.
- **IDs → Web Crypto.** Eigener URL-sicherer Generator über `crypto.getRandomValues`
  (ersetzt `nanoid`).

### Konfiguration
- **`wrangler.toml`** mit `pages_build_output_dir = "dist"` und KV-Binding `DB`.
- **`_routes.json`** (Functions nur für `/api/*`) und **`_redirects`** (SPA-Fallback auf
  `index.html`) im Build.
- **Scripts:** `npm run dev` (Vite-HMR + `wrangler pages dev` + lokaler KV),
  `npm run build`, `npm run preview`, `npm run deploy`.
- Entfernt: `express`, `socket.io`, `socket.io-client`, `bcryptjs`, `nanoid`, `dotenv`,
  `nodemon`; das `server/`-Verzeichnis und `scripts/dev.mjs`. Node-Anforderung jetzt ≥ 18.

### Ehrliche Einordnung
- KV mit **einem JSON-Blob** ist bei vielen gleichzeitigen Schreibzugriffen nicht
  kollisionsfrei (Lesen-Ändern-Schreiben). Für die Projektgröße unkritisch; der saubere
  Upgrade-Pfad bei echter Nebenläufigkeit ist **D1**.
- Vor dem ersten Deploy die **KV-Namespace-IDs** in `wrangler.toml` eintragen (bzw. das
  Binding `DB` im Pages-Dashboard setzen). Die PBKDF2-Iterationen lassen sich bei Bedarf
  an das CPU-Budget anpassen.

## 3.2.0 – Verbrauch als dritter Hebel & durchgehend vernetzter Hub

Eingeloggte Mieter:innen geben jetzt ihren Jahresverbrauch ein, und die
Wirtschaftlichkeit reagiert **live** auf zwei Größen zugleich: die Zusagequote
*und* den eingebrachten Verbrauch. Mehr Verbrauch heißt mehr direkt im Haus
nutzbarer Solarstrom – bis zur physikalischen Obergrenze (Ariadne-Deckel `qmax`,
40,7 %). Ohne Angaben rechnet das Modell unverändert mit dem Referenzwert
(2 500 kWh/WE), die bisherigen Zahlen bleiben also exakt erhalten.

### Neu
- **Verbrauch als dritte Stellschraube** in der Wirtschaftlichkeits-Engine
  (`scenario(..., { consumptionFactor })`). Der Eigenverbrauch je Wohneinheit
  skaliert mit dem realen Verbrauch und sättigt am `qmax`-Deckel – ehrlich, nicht
  linear-unbegrenzt.
- **Hausgemeinschaft** ist das interaktive Herzstück: Jahresverbrauch eingeben
  (mit Personen-Schnellschätzung), die **eigene voraussichtliche Ersparnis** sofort
  sehen, **zu- und absagen**. Eine **Live-Wirkungsanzeige** zeigt, wie Zusagen und
  Verbrauch die Anlage gerade verändern (Direktnutzung, Ersparnis/HH, Preis, Rendite).
- **Vernetzung:** Übersicht, Wirtschaftlichkeit und Verhandlung rechnen alle mit der
  echten Datenlage. Übersicht und Wirtschaftlichkeit zeigen die **Datengrundlage**
  (zugesagte WE, gemeldete Verbrauchswerte, Ø) und verlinken in die Gemeinschaft.
- **„Auf Echtdaten"** – die Wirtschaftlichkeit lässt sich jederzeit von Was-wäre-wenn
  zurück auf die realen Zusagen/Verbräuche setzen.
- **Feineres Aktivitätsprotokoll:** getrennte Einträge für Zusage, Verbrauchseingabe
  und Rückzug der Zusage.
- **Fahrplan:** „Haushaltsdaten gesammelt" wird automatisch erkannt, sobald die Hälfte
  der Mietparteien einen Verbrauch hinterlegt hat.

### Kalibrierung
Bei Referenzverbrauch (2 500 kWh) ist `consumptionFactor = 1` und das Ergebnis
identisch zum Ariadne-Referenzmodell. Beispiel 30 kWp / 8 WE / 950 kWh·kWp⁻¹,
75 % Beteiligung: bei +40 % Verbrauch steigt die Direktnutzung bis exakt an den
`qmax`-Deckel (40,7 %), Überschuss und Rendite steigen entsprechend mit.

## 3.1.0 – Rechner wird zum kartenbasierten PV-Planer

Der bisherige Eingabe-Rechner ist durch ein Planungswerkzeug am echten Gebäude
ersetzt. Der übrige Funktionsumfang (Hub, Anmeldung, Wirtschaftlichkeit, Verträge)
bleibt unverändert; der Planer erzeugt am Ende wie zuvor ein Projekt und speist die
bestehende Wirtschaftlichkeits-Engine.

### Ablauf des Planers
1. **Adresse suchen** (Nominatim) und auf der **Karte** (MapLibre) verorten.
2. **Gebäude aus OpenStreetMap** im Umkreis laden (Overpass), das eigene Gebäude
   anklicken – Grundfläche, geschätzte Höhe (Geschosse), ggf. Dachform (`roof:shape`).
3. **Auslegung**: Dachform, Neigung, Ausrichtung, Dachausnutzung, Verluste →
   vorgeschlagene Anlagengröße (kWp) und Modulzahl, manuell überschreibbar; dazu
   Wohneinheiten und aktueller Strompreis für die spätere GGV-Rechnung.
4. **Ertrag** mit echten **PVGIS-Wetterdaten** (Jahres-/Monatsertrag, Verluste),
   Monatsdiagramm (Recharts) und einer **3D-Massendarstellung** (Three.js).
5. **Projekt erstellen** übergibt kWp und spezifischen Ertrag an die Engine.

### Technisch
- Neue **öffentliche Proxy-Routen** `/api/planner/{geocode,buildings,pvgis}` im
  bestehenden Express-Server – über das eingebaute `https`-Modul (kein neues Paket,
  Node-16-tauglich). Sie umgehen CORS und bündeln die Nutzung mit klarem User-Agent.
- Neue Abhängigkeiten **maplibre-gl, three, recharts** – nur für den Planer und per
  **Code-Splitting** nachgeladen (der übrige Hub bleibt schlank).
- **Hinweis:** Die externen Dienste (Nominatim/Overpass/PVGIS, OSM-Kacheln) erfordern
  offenen Internetzugang; in abgeschotteten Umgebungen antworten sie mit 403.

### Bewusst noch nicht enthalten (spätere Ausbaustufen)
Voller 3D-Editor mit Bäumen/Hindernissen per Drag&Drop, automatische Modulbelegung
mit Kollisionsprüfung, **stundengenaue Raycasting-Verschattung**, PDF-Bericht, Tests
und Docker. Die schweren Stack-Teile (Python-pvlib, PostGIS) werden umgangen, indem
PVGIS serverseitig die Simulation liefert.


## 3.0.0 – Redesign & Ausbau zum Projekt-Hub

Diese Version überarbeitet das gesamte Erscheinungsbild und baut den Projektbereich
zu einem vollwertigen Arbeits-Workspace mit Seitenleiste und neun Unterseiten aus.

### Design
- **Weg vom „KI-Default-Look"**: warmes Creme + Serifenschrift (Fraunces) ersetzt durch
  kühl-neutrale Flächen und ein sachlich-ziviles Schriftpaar **Archivo** (Display) +
  **Public Sans** (Text/Daten, mit Tabellenziffern).
- **Echte Logos statt Schrift-Logo**: `Langes_Logo` und `Kompaktes_Logo` automatisch vom
  Weißraum befreit – `logo-wide.jpeg` (1012×294) als horizontales Lockup für Kopf/Fuß,
  `logo-mark.jpeg` (660×660) als Emblem für Mobile/Favicon.
- **Ein Signature-Element – die „Flussschiene"**: ein grün→orange Verlauf (direkt aus dem
  Logo) als dünne Header-Linie, Sidebar-Aktivmarkierung, Fortschrittsbalken und – als
  Höhepunkt – vertikale Phasen-Spine im Fahrplan. Sonst bewusst zurückhaltend.
- Neues, konsistentes Token- und Komponentensystem (Buttons, Karten, Chips, Statusanzeigen,
  Donut/ProgressBar in Markenfarbe).

### Projekt-Hub (Workspace)
- Neuer Seitenleisten-Workspace mit Live-Synchronisation (Socket.IO) und **neun Unterseiten**:
  Übersicht, Fahrplan, Gebäude & Anlage, Hausgemeinschaft, Wirtschaftlichkeit, Verhandlung,
  Dokumente, Aktivität, Einstellungen.
- Projekt wird einmal geladen und über einen React-Context an alle Unterseiten verteilt.

### Vier neue Funktionen
- **Fahrplan mit Aufgaben-Checklisten** (6 Phasen). Automatisch erkannte Schritte (z. B.
  „50 % zugesagt", „Eigentümer:in beigetreten", „Einigung erreicht") und manuell abhakbare
  Aufgaben; Fortschritt fließt in Übersicht und Sidebar ein.
- **Aktivitätsprotokoll** je Projekt: jedes wichtige Ereignis wird serverseitig protokolliert
  und chronologisch angezeigt.
- **Verlinkter Wissensbereich**: GGV-Modell (§42b, 90-%-Klarstellung, Vergleich zu Mieterstrom),
  „So funktioniert's", Wirtschaftlichkeit und FAQ.
- **Detail-Wirtschaftlichkeit** als eigene Seite: zwei Live-Regler (Beteiligung, Preis),
  Hebel-Diagramm, Sensitivitätsmatrix und vollständige Aufschlüsselung – mit ehrlicher Einordnung.

### Technisch
- Backend erweitert: Aufgaben-Status je Projekt (`POST /api/projekt/:id/tasks/:taskId`),
  Aktivitäts-Endpunkt (`GET /api/projects/:id/activity`) und automatisches Protokollieren in
  den bestehenden Routen.
- Routing auf verschachtelte Layout-Routen umgestellt (öffentliches Layout, App-Layout,
  Projekt-Workspace). `framer-motion` entfernt; Übergänge laufen über CSS.
- `/dashboard` → `/start` (Weiterleitung erhalten).


## 2.0.0 – Umstellung auf Username/Password, Single-Port & Node 16

Diese Version baut Authentifizierung, Auslieferung und den Abhängigkeits-Stack
grundlegend um. Kurz gefasst: keine externen Login-Dienste mehr, ein einziger
Port für alles, und ein vollständig Node-16-kompatibler Paketstand.

### Authentifizierung
- **Google-Login / OAuth vollständig entfernt** (Pakete `passport`, `passport-google-oauth20` raus).
- **JWT vollständig entfernt** (`jsonwebtoken` raus). **Kein `JWT_SECRET` mehr.**
- **Keine Sessions, keine Tokens.** Anmeldung ausschließlich über **Benutzername + Passwort**.
- **Passwörter werden mit bcrypt gehasht** gespeichert. Verwendet wird `bcryptjs`
  – die reine JavaScript-Implementierung desselben bcrypt-Algorithmus, ohne
  nativen Build (robuster auf Node 16, keine Kompilierung nötig).
- **Verfahren:** HTTP Basic. Nach der Anmeldung hält die App die Zugangsdaten in
  der `sessionStorage` (beim Schließen des Tabs weg) und sendet sie pro Anfrage
  im Header `Authorization: Basic …`. Der Server prüft sie bei jeder Anfrage
  gegen den bcrypt-Hash.
- Neue Endpunkte: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- **Ehrlicher Sicherheitshinweis:** Da bei diesem bewusst token-/session-losen
  Verfahren die Zugangsdaten mit jeder Anfrage übertragen werden, ist im
  Produktivbetrieb **HTTPS/TLS zwingend**. Ein Token-/Session-Verfahren würde das
  wiederholte Senden der Zugangsdaten vermeiden – wurde hier aber per Vorgabe
  ausgeschlossen.

### Deployment – ein Server, ein Port
- Das **Backend liefert das gebaute Frontend** aus `/dist` aus (statisch) inkl.
  **SPA-Fallback** auf `index.html` für clientseitige Routen.
- **Keine getrennten Ports**, kein Dev-Proxy mehr. API, WebSocket und Frontend
  laufen über **denselben Port** (Standard `3000`, via `PORT` änderbar).
- Unbekannte `/api/*`-Pfade liefern sauberes JSON-404 (statt des Frontends).
- Socket.IO läuft auf demselben Server/Port (gleiche Herkunft, kein CORS nötig).
- **Entwicklung:** `npm run dev` startet Vite im Watch-Modus (baut nach `/dist`)
  und den Server gemeinsam – ebenfalls nur **ein** Port. Realisiert über einen
  kleinen eigenen Starter (`scripts/dev.mjs`) **ohne** Zusatzpaket wie
  `concurrently`. Hinweis: kein Hot-Module-Replacement; Frontend-Änderungen
  werden automatisch neu gebaut, danach Seite neu laden.

### Node.js 16 Kompatibilität (alle EBADENGINE-Warnungen beseitigt)
- **Vite 5 → Vite 4.5.14** und **`@vitejs/plugin-react` 4.2.1** (Node-16-tauglich).
  Vite 4 nutzt Rollup 3 statt Rollup 4 → die Warnungen zu `rollup@4`,
  `postcss-load-config@6`, `nanoid@5` entfallen.
- **`vite-plugin-pwa` / Workbox entfernt.** Damit verschwinden die Node-18-Pakete
  `workbox-build`, `serialize-javascript@7`, `smob`, `lru-cache@11`,
  `path-scurry@2` u. a. Die PWA bleibt erhalten – ohne Build-Plugin, über eine
  statische `manifest.webmanifest` und einen **schlanken, handgeschriebenen
  Service Worker** (`client/public/sw.js`, ohne Abhängigkeiten).
- Projektweit **ein einziges `package.json`** (vorher getrennt für client/server)
  mit `"engines": { "node": ">=16" }`. Ein `npm install` genügt.
- Ergebnis: **keine `EBADENGINE`-Warnungen** und **keine `deprecated`-Meldungen** mehr.

### Vite-Fehler „crypto.getRandomValues is not a function" behoben
- **Ursache:** Vite 5 (bzw. das mitgelieferte `nanoid@5`) erwartet ein globales
  `crypto.getRandomValues`, das es in Node 16 nicht als Global gibt.
- **Lösung (saubere Versionswahl, kein Runtime-Hack):** Rückstufung auf **Vite 4**
  (nutzt `nanoid@3`, das Node-`crypto.randomBytes` verwendet). Dev-Server und
  Build laufen damit unter Node 16 fehlerfrei.

### Sicherheit & Abhängigkeiten
- `npm audit` analysiert; von **17 auf 2** Befunde reduziert – ausschließlich durch
  Node-16-kompatible Patch-Versionen:
  - **`express` → 4.22.2** (behebt `path-to-regexp`-ReDoS [high], `qs`, `body-parser`, `cookie`).
  - **`socket.io` / `socket.io-client` → 4.8.3** (behebt `ws`-DoS [high], `engine.io`, `cookie`).
  - **`react-router-dom` → 6.30.4** (behebt XSS via Open Redirect [high]).
  - **`postcss` → 8.5.15** (behebt XSS im Stringify [moderate]).
  - **`nanoid` → 3.3.12** (behebt vorhersehbare IDs bei Nicht-Ganzzahlen [moderate]).
- **Verbleibende 2 Befunde – ehrlich eingeordnet:** beide stammen aus **`esbuild`**
  (transitiv über Vite) und betreffen **ausschließlich den Entwicklungsserver**
  (eine Website könnte im Dev Anfragen an den Dev-Server stellen). Sie sind **im
  Produktions-Build nicht enthalten**. Der einzige von npm angebotene „Fix" ist
  **Vite 8, das Node 20+ voraussetzt** und damit die geforderte Node-16-
  Kompatibilität bräche. Da Node 16 hier eine harte Vorgabe ist, bleibt es bei
  **Vite 4.5.14** (enthält die zurückportierte Dev-Server-Absicherung); `npm audit fix --force`
  wird bewusst **nicht** ausgeführt.

### Datenhaltung
- **`better-sqlite3` (nativ) → abhängigkeitsfreier JSON-Store** (`server/data/db.json`).
  Vermeidet jeden nativen Build (kein `node-gyp`/Compiler) und garantiert damit
  `npm install` und Serverstart auf Node 16. Gleiche Funktions-Signaturen → die
  Routen bleiben unverändert. Für den Umfang dieses Projekts ausreichend; für
  echten Mehrbenutzer-Produktivbetrieb wäre eine echte Datenbank vorzuziehen.

### Entfernte Pakete
`passport`, `passport-google-oauth20`, `jsonwebtoken`, `cors`, `vite-plugin-pwa`,
`concurrently`, `better-sqlite3` sowie die getrennten `client/`- und `server/`-`package.json`.

### Geforderte Umgebungsvariablen
- Nur noch `PORT` (Standard 3000) und optional `BCRYPT_ROUNDS` (Standard 10).
  **Kein `JWT_SECRET`, keine Google-Variablen.** Die App startet ohne weitere Konfiguration.
