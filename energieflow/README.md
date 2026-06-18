# EnergieFlow · SolarGemeinschaft

Plattform für gemeinschaftliche Gebäudeversorgung (GGV, §42b EnWG).

## Start

```bash
cp .env.example server/.env
npm run install:all
npm run dev
```

`npm run dev` baut das Frontend zuerst und startet danach den Server auf `http://localhost:4000`.

## Authentifizierung

- Klassischer Login mit Benutzername + Passwort
- Registrierung direkt in der Anwendung
- Passwortspeicherung mit bcrypt
- Keine Sessions
- Keine JWTs
- Kein OAuth / kein Google Login

## Deployment

- `npm run build` baut das Frontend nach `client/dist`
- Das Backend serviert den gebauten Client direkt auf demselben Port
- SPA-Fallback auf `index.html` ist aktiv

## Enthalten

- Rechner
- Projekte
- Einladungen
- Live-Synchronisation via Socket.IO
- Verhandlung / Zustimmung
- Dokumentenerzeugung als `.docx`

## Technik

| Bereich | Eingesetzt |
|---|---|
| Frontend | React 18, Vite 4, React Router, Tailwind CSS |
| Diagramme | Chart.js / react-chartjs-2 |
| Dokumente | `docx` + `file-saver` |
| Backend | Express, Socket.IO |
| Datenbank | SQLite (`better-sqlite3`) |

## Hinweis

Alle Berechnungen sind Schätzungen. Erzeugte Schreiben und Verträge sind Entwürfe und ersetzen keine Rechts- oder Steuerberatung.
