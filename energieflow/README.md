# EnergieFlow · SolarGemeinschaft

Eine Plattform, mit der sich **Mieterinnen und Mieter** organisieren, um gemeinsam eine
**Photovoltaikanlage** aufs Mietshaus zu bringen – über die **gemeinschaftliche
Gebäudeversorgung (GGV, §42b EnWG)**: rechnen, sich zusammentun, die Eigentümerseite
einladen, den Preis transparent verhandeln und am Ende für jede Partei einen
GGV-Vertragsentwurf erzeugen.

Ein Server, ein Port: das Backend stellt die API bereit **und** liefert das gebaute
Frontend aus. Anmeldung ausschließlich über **Benutzername + Passwort** (bcrypt).

---

## Schnellstart

Voraussetzung: **Node.js ≥ 16** (getestet mit 16.20.2).

```bash
# 1) Umgebungsvariablen anlegen (optional – es gibt sinnvolle Standardwerte)
cp .env.example .env

# 2) Installieren (ein einziges package.json)
npm install

# 3a) Entwicklung: Vite-Watch-Build + Server, ein Port
npm run dev

# 3b) Produktion: einmal bauen, dann starten
npm run build
npm start
```

Danach läuft **alles** unter **http://localhost:3000** (Port über `PORT` änderbar) –
Frontend, API und WebSocket.

Beim ersten Start einfach **Konto erstellen** (Benutzername, Passwort, Anzeigename),
danach anmelden. Für den Mehrnutzer-Flow ein zweites Browserfenster (oder Inkognito)
mit anderem Konto öffnen und über den Einladungslink beitreten – Änderungen erscheinen
dank WebSocket sofort bei allen.

> Hinweis: `npm run dev` nutzt **kein** Hot-Module-Replacement. Vite baut bei jeder
> Änderung automatisch neu (nach `/dist`); danach die Seite neu laden. Das hält den
> Aufbau einfach und garantiert „ein Port“.

---

## Authentifizierung (bewusst schlicht & ehrlich)

- **Kein** Google/OAuth, **kein** JWT, **kein** `JWT_SECRET`, **keine** Sessions, **keine** Tokens.
- Passwörter werden mit **bcrypt** gehasht gespeichert (`bcryptjs`, reine JS-Variante,
  kein nativer Build).
- Verfahren: **HTTP Basic** – nach der Anmeldung hält die App die Zugangsdaten in der
  `sessionStorage` und sendet sie pro Anfrage mit; der Server prüft sie jeweils gegen
  den bcrypt-Hash.
- **Wichtig für den Produktivbetrieb:** Da hier (per Vorgabe) ohne Tokens/Sessions
  gearbeitet wird und die Zugangsdaten bei jeder Anfrage mitgehen, ist **HTTPS/TLS
  zwingend**. Für echten Produktivbetrieb wäre zusätzlich ein Token-/Session-Verfahren
  sinnvoll.

---

## Der Ablauf

1. **Rechner** – Eckdaten des Hauses eingeben → erste, ehrliche Wirtschaftlichkeits-Schätzung.
2. **Projekt** – wird zum gemeinsamen, live-synchronisierten Dashboard.
3. **Einladen** – Nachbar:innen per Link, die Eigentümerseite über **individuelle** Links.
4. **Bestätigen** – jede:r bestätigt den eigenen Verbrauch → die Analyse wird gebäudegenau.
5. **Verhandeln** – Solarstrompreis schieben; ein Live-Diagramm zeigt den **Hebel**
   (mehr Beteiligung = mehr Spielraum). Beide Seiten dürfen Vorschläge machen.
6. **Einigen** – stimmen alle Aktiven zu, springt das Projekt auf „vereinbart“.
7. **Verträge** – danach pro Mieter:in ein GGV-Vertragsentwurf als echte `.docx`.

---

## Architektur / Technik

| Bereich    | Eingesetzt                                                                 |
|------------|----------------------------------------------------------------------------|
| Frontend   | React 18, **Vite 4**, React Router, Tailwind CSS, framer-motion, lucide-react |
| Diagramme  | Chart.js / react-chartjs-2                                                  |
| Dokumente  | `docx` + `file-saver` (im Browser, dynamisch nachgeladen)                  |
| Schriften  | Fraunces & Hanken Grotesk (lokal via `@fontsource`, kein CDN)             |
| PWA        | statische `manifest.webmanifest` + schlanker eigener Service Worker        |
| Backend    | Express, Socket.IO, **bcryptjs** (Auth)                                    |
| Datenbank  | abhängigkeitsfreier **JSON-Store** (`server/data/db.json`)                |

```
energieflow/
├─ package.json          # EIN Paket (Frontend + Server + Vite); Scripts: dev, build, start
├─ vite.config.js        # baut client/ -> dist/
├─ tailwind.config.js · postcss.config.js
├─ .env.example          # nur PORT, BCRYPT_ROUNDS (keine Geheimnisse)
├─ scripts/dev.mjs       # Dev-Starter (Vite-Watch + Server, ein Port, ohne Zusatzpaket)
├─ server/src/           # Express + Socket.IO + JSON-Store + bcrypt-Auth
│  ├─ index.js · db.js · auth.js
│  └─ routes/ (auth.js, api.js)
└─ client/               # Frontend-Quellcode (wird nach /dist gebaut)
   ├─ index.html · public/ (manifest, sw.js, Logos)
   └─ src/ (lib, context, components, pages)
```

`npm run build` erzeugt `/dist`; der Server liefert diesen Ordner aus (mit
SPA-Fallback auf `index.html`).

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
