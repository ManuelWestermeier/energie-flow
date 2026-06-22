# Changelog

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
