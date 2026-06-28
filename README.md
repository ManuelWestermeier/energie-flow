# EnergieFlow · SolarGemeinschaft

Eine Plattform, mit der sich **Mieterinnen und Mieter** organisieren, um gemeinsam eine
**Photovoltaikanlage** aufs Mietshaus zu bringen – über die **gemeinschaftliche
Gebäudeversorgung (GGV, §42b EnWG)**: rechnen, sich zusammentun, die Eigentümerseite
einladen, den Preis transparent verhandeln und am Ende für jede Partei einen
GGV-Vertragsentwurf erzeugen.

Läuft vollständig auf **Cloudflare Pages**: ein statisches **React-Frontend** plus eine
API als **Pages Functions** (`onRequest`), Persistenz auf **Cloudflare KV**. Anmeldung
ausschließlich über **Benutzername + Passwort** (PBKDF2 über die Web-Crypto-API).

---

## Schnellstart

Voraussetzung: **Node.js ≥ 18** und das Cloudflare-CLI **wrangler** (als devDependency
enthalten).

```bash
# 1) Installieren (ein einziges package.json)
npm install

# 2) Entwicklung: Vite (mit HMR) + Pages Functions + lokaler KV-Store
npm run dev          # -> http://localhost:8788

# 3) Produktions-Build prüfen (gebaute Assets + Functions lokal serven)
npm run preview
```

`npm run dev` startet Vite auf Port 5173 und `wrangler pages dev` davor: Die API
(`/functions`) und ein **lokaler KV-Store** laufen mit, statische Anfragen werden an
Vite durchgereicht – inklusive **Hot-Module-Replacement**.

Beim ersten Start einfach **Konto erstellen** (Benutzername, Passwort, Anzeigename),
danach anmelden. Für den Mehrnutzer-Flow ein zweites Browserfenster (oder Inkognito)
mit anderem Konto öffnen und über den Einladungslink beitreten – Änderungen erscheinen
durch kurzes **Polling** (bzw. sofort beim Zurückwechseln in den Tab).

### Deployment auf Cloudflare Pages

```bash
npx wrangler login
# einmalig KV-Namespaces anlegen und die IDs in wrangler.toml eintragen:
npx wrangler kv namespace create DB
npx wrangler kv namespace create DB --preview
npm run deploy        # baut /dist und lädt Assets + Functions hoch
```

Alternativ per Git-Integration im Pages-Dashboard: Build-Befehl `npm run build`,
Output-Verzeichnis `dist`, und das KV-Binding **DB** unter *Settings → Functions*
hinterlegen.

---

## Authentifizierung (bewusst schlicht & ehrlich)

- **Kein** Google/OAuth, **kein** JWT, **kein** `JWT_SECRET`, **keine** Sessions, **keine** Tokens.
- Passwörter werden mit **PBKDF2** (SHA-256, 100 000 Iterationen) über die native
  **Web-Crypto-API** gehasht – schnell genug für das CPU-Budget der Workers und ohne
  Abhängigkeit. Format: `pbkdf2$<iter>$<salt>$<hash>`.
- Verfahren: **HTTP Basic** – nach der Anmeldung hält die App die Zugangsdaten in der
  `sessionStorage` und sendet sie pro Anfrage mit; die Function prüft sie jeweils
  gegen den gespeicherten Hash (konstante Vergleichszeit).
- **Wichtig für den Produktivbetrieb:** Da hier (per Vorgabe) ohne Tokens/Sessions
  gearbeitet wird und die Zugangsdaten bei jeder Anfrage mitgehen, ist **HTTPS/TLS
  zwingend**. Für echten Produktivbetrieb wäre zusätzlich ein Token-/Session-Verfahren
  sinnvoll.

---

## Der Ablauf

1. **Rechner** – Eckdaten des Hauses eingeben → erste, ehrliche Wirtschaftlichkeits-Schätzung.
2. **Projekt** – wird zum gemeinsamen Dashboard (Aktualisierung per kurzem Polling).
3. **Einladen** – Nachbar:innen per Link, die Eigentümerseite über **individuelle** Links.
4. **Verbrauch & Zusage** – jede:r trägt den eigenen Jahresverbrauch ein und sagt zu → Zusagequote und Verbrauch fließen **live** in die Analyse.
5. **Verhandeln** – Solarstrompreis schieben; ein Live-Diagramm zeigt den **Hebel**
   (mehr Beteiligung = mehr Spielraum). Beide Seiten dürfen Vorschläge machen.
6. **Einigen** – stimmen alle Aktiven zu, springt das Projekt auf „vereinbart“.
7. **Verträge** – danach pro Mieter:in ein GGV-Vertragsentwurf als echte `.docx`.

---

## Der Projektbereich (Workspace)

Jedes Projekt öffnet sich als Arbeitsbereich mit fester Seitenleiste (Aktualisierung per Polling)
und neun Unterseiten:

- **Übersicht** – aktuelle Phase, Kennzahlen, nächste Schritte, letzte Aktivität.
- **Fahrplan** – sechs Phasen mit Aufgaben-Checklisten (automatisch erkannt + manuell);
  das Signature-Element „Flussschiene" verbindet die Phasen.
- **Gebäude & Anlage** – technische/wirtschaftliche Eckdaten, Umschalten Schätzung ↔ Feindaten.
- **Hausgemeinschaft** – Mitglieder, **Jahresverbrauch eingeben** (mit Personen-Schätzung) und eigene Ersparnis sehen, zu-/absagen, **Live-Wirkung** auf die Anlage, Einladungslinks.
- **Wirtschaftlichkeit** – Live-Szenarien (**drei Regler**: Beteiligung · Verbrauch · Preis), Datengrundlage aus den echten Angaben mit „Auf Echtdaten"-Reset, Hebel-Diagramm, Sensitivitätsmatrix.
- **Verhandlung** – Preis-Regler mit Trade-off, Vorschläge, Zustimmung/Einigung.
- **Dokumente** – Anschreiben, Analyse und GGV-Verträge als `.docx` (Verträge nach Einigung).
- **Aktivität** – vollständiges, chronologisches Protokoll.
- **Einstellungen** – Projekt umbenennen, Übersicht.

Begleitet wird das durch einen verlinkten **Wissensbereich** (GGV-Modell/§42b,
„So funktioniert's", Wirtschaftlichkeit, FAQ).

---

## PV-Planer (Rechner)

Der Einstieg „Rechner“ ist ein Planungswerkzeug am echten Gebäude: Adresse suchen
(Nominatim) → Karte (MapLibre) → Gebäude aus OpenStreetMap wählen (Overpass) →
Dach/Module auslegen → **Ertrag mit echten PVGIS-Daten** berechnen → 3D-Ansicht
(Three.js) und Monatsdiagramm → Projekt erstellen (speist die Wirtschaftlichkeit).

Die externen Dienste laufen über serverseitige Proxy-Routen
(`/api/planner/{geocode,buildings,pvgis}` als Pages Functions, über das globale `fetch`):

- `GET /api/planner/geocode?q=...`
- `GET /api/planner/buildings?lat=..&lon=..&radius=..`
- `GET /api/planner/pvgis?lat=..&lon=..&peakpower=..&loss=..&angle=..&aspect=..`

> **Internet nötig:** Nominatim, Overpass, PVGIS und die OSM-Kartenkacheln müssen
> erreichbar sein. In abgeschotteten Umgebungen (ohne Egress) antworten sie mit 403.

---

## Architektur / Technik

| Bereich    | Eingesetzt                                                                 |
|------------|----------------------------------------------------------------------------|
| Frontend   | React 18, **Vite 4**, React Router, Tailwind CSS, lucide-react             |
| Diagramme  | Chart.js / react-chartjs-2; **Recharts** (PV-Planer)                       |
| Karte/3D   | **MapLibre GL** (OSM), **Three.js** (3D-Masse) – nur im Planer, code-split |
| Dokumente  | `docx` + `file-saver` (im Browser, dynamisch nachgeladen)                  |
| Schriften  | **Archivo** (Display) & **Public Sans** (Text), lokal via `@fontsource`   |
| PWA        | statische `manifest.webmanifest` + schlanker eigener Service Worker        |
| Backend    | **Cloudflare Pages Functions** (`onRequest`), **PBKDF2** (Web Crypto)       |
| Live-Sync  | **Polling** (7 s + bei Tab-Fokus) statt WebSocket                           |
| Datenbank  | **Cloudflare KV** (ein JSON-Blob, Binding `env.DB`)                         |

```
energieflow/
├─ package.json          # EIN Paket (Frontend + Functions); Scripts: dev, build, deploy
├─ wrangler.toml         # Pages-Konfiguration + KV-Binding (DB)
├─ vite.config.js        # baut client/ -> dist/
├─ tailwind.config.js · postcss.config.js
├─ functions/            # die API als Pages Functions (file-based routing)
│  ├─ _lib/ (store.js = KV-Datenschicht, auth.js = PBKDF2/Basic, http.js, ids.js, upstream.js)
│  └─ api/ (auth/, projects/[id]/…, invites/[token]/…, planner/, [[path]].js = 404)
└─ client/               # Frontend-Quellcode (wird nach /dist gebaut)
   ├─ index.html
   ├─ public/ (manifest, sw.js, Logos, _routes.json, _redirects)
   └─ src/ (lib, context, components, pages; pages/project/ = 9 Workspace-Seiten)
```

`npm run build` erzeugt `/dist`. Cloudflare Pages liefert diese Assets aus und führt
`/functions` für `/api/*` aus (`_routes.json`); alle übrigen Pfade fallen per
`_redirects` auf `index.html` zurück (Client-Routing).

---

## Rechtlicher Hinweis (bewusst ehrlich)

- Für die **GGV (§42b EnWG)** gilt **freie Preisgestaltung**. Die Grenze „max. 90 % des
  Grundversorgungstarifs“ ist die **Mieterstrom**-Vorgabe (§42a Abs. 4 EnWG) und gilt für
  die GGV **nicht** (§42b verweist nur auf §42a Abs. 2 und 3). Wir verwenden **90 % als
  freiwilligen Fairness-Maßstab** und Startwert, frei verhandelbar.
- Alle Berechnungen sind **Schätzungen**; die erzeugten Schreiben und Verträge sind
  **Entwürfe** und ersetzen keine Rechts- oder Steuerberatung.
- Datengrundlage: **Ariadne-Analyse** (Fischer/Henger, IW Köln, September 2025),
  Referenzfall 30 kWp / 8 Wohneinheiten; Direktverbrauchsquote auf 40,7 % begrenzt,
  Versicherungskosten enthalten.

---

*Projektkontext: Beitrag für **YES! Young Economic Solutions 2026** zur Frage, wie
Mieterinnen und Mieter aktiv an der Energiewende teilhaben können.*
