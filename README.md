# EnergieFlow · SolarGemeinschaft

Eine Plattform, mit der sich **Mieterinnen und Mieter** organisieren, um gemeinsam eine
**Photovoltaikanlage** aufs Mietshaus zu bringen – über die **gemeinschaftliche
Gebäudeversorgung (GGV, §42b EnWG)**.

Statt eines bloßen Musterbriefs ist es ein kollaboratives Werkzeug: rechnen, sich
zusammentun, die Eigentümerseite einladen, den Preis transparent verhandeln und am Ende
für jede Partei einen GGV-Vertragsentwurf erzeugen.

---

## Schnellstart

Voraussetzung: **Node.js ≥ 18**.

```bash
# 1) Umgebungsvariablen anlegen
cp .env.example server/.env

# 2) Alle Abhängigkeiten installieren (Root, Server, Client)
npm run install:all

# 3) Server + Frontend gleichzeitig starten
npm run dev
```

* Frontend: **http://localhost:5173**
* Server-API: **http://localhost:4000**

Der **Test-Login** (E-Mail + Name, ohne Google) ist standardmäßig aktiv (`ALLOW_DEV_LOGIN=true`)
– so lässt sich alles sofort ausprobieren. Für echten **Google-Login** die Zugangsdaten in
`server/.env` eintragen (Anleitung dort).

> Tipp zum Testen des Live-Mehrnutzer-Flows: ein zweites Browser-Fenster (oder Inkognito)
> mit einer anderen Test-E-Mail öffnen und über den Einladungslink beitreten. Änderungen
> erscheinen dank WebSocket sofort bei allen.

---

## Der Ablauf

1. **Rechner** – eine:r gibt die Eckdaten des Hauses ein (nur, was Mieter:innen realistisch
   wissen). Sofort erscheint eine erste, ehrliche Wirtschaftlichkeits-Schätzung.
2. **Projekt** – daraus wird ein gemeinsames, live-synchronisiertes Dashboard.
3. **Einladen** – Nachbar:innen über einen Link, die Eigentümerseite über **individuelle**
   Links (pro Vermieter:in einer).
4. **Bestätigen** – jede:r bestätigt kurz den eigenen Verbrauch → die Analyse wird
   gebäudegenau. Die Beteiligungsquote steigt sichtbar.
5. **Verhandeln** – der Solarstrompreis lässt sich als Anteil des Grundpreises schieben;
   ein Live-Diagramm zeigt den **Hebel**: mehr Beteiligung = mehr Spielraum. Beide Seiten
   dürfen Vorschläge machen; jeder Stand wird im Verlauf gespeichert.
6. **Einigen** – stimmen alle Aktiven dem aktuellen Preis zu, springt das Projekt auf
   „vereinbart“.
7. **Verträge** – danach erzeugt die Plattform pro Mieter:in einen **GGV-Stromliefervertrag**
   (Entwurf, echte `.docx`-Datei).

---

## Was vollständig funktioniert

* Mehrstufiger Rechner mit Live-Schätzung (Ariadne-kalibriert)
* Projekte anlegen, beitreten (Mieter & Vermieter, getrennte Rollen)
* **Live-Synchronisation** aller Teilnehmer:innen via WebSocket (Socket.IO)
* Verhandlungs-Dial mit Trade-off-Anzeige und Hebel-Diagramm + Vorschlagsverlauf
* Zustimmung/Konsens-Logik (neuer Preis setzt Zustimmungen zurück)
* Dokumenten-Erzeugung als echte Word-Dateien: Wirtschaftlichkeitsanalyse, Anschreiben an
  Mitmieter:innen, **individuelle** Vermieter-Anschreiben (mit persönlichem Beitrittslink und
  Liste der noch fehlenden Feindaten) sowie GGV-Verträge je Mieter:in
* Test-Login sofort einsatzbereit; Google-OAuth vollständig vorbereitet
* PWA-fähiger Build

## Was als Gerüst angelegt ist (für den Produktiveinsatz auszubauen)

* **Datenbank:** SQLite (`better-sqlite3`) – ideal für Demo/Wettbewerb, für den Echtbetrieb
  ggf. PostgreSQL.
* **Auth:** Google-OAuth braucht eigene Zugangsdaten; der Test-Login ist nur für lokal.
* **Produktiv-Auslieferung:** im Dev-Modus laufen Frontend und Server getrennt. Für ein
  echtes Deployment den Client (`npm run build`, Ordner `client/dist`) über einen Static-Host
  bzw. `express.static` ausliefern und das WebSocket-Routing dahinter konfigurieren.
* **E-Mail-Versand:** Anschreiben werden als Datei erzeugt, nicht automatisch verschickt.

---

## Rechtlicher Hinweis (bewusst ehrlich)

* Für die **GGV (§42b EnWG)** gilt **freie Preisgestaltung**. Die Grenze von „max. 90 % des
  Grundversorgungstarifs“ ist die **Mieterstrom**-Vorgabe (§42a Abs. 4 EnWG) und gilt für die
  GGV **nicht** – §42b verweist nur auf §42a Abs. 2 und 3.
* Wir verwenden **90 % als freiwilligen Fairness-Maßstab** und Startwert, nach unten und oben
  frei verhandelbar. Genau das macht das Verhandlungs-Feature rechtlich sauber möglich.
* Alle Berechnungen sind **Schätzungen**. Die erzeugten Schreiben und Verträge sind
  **Entwürfe** und ersetzen keine Rechts- oder Steuerberatung.

Datengrundlage der Wirtschaftlichkeit: **Ariadne-Analyse „Gebäude- und Mieterstrom“**
(Fischer/Henger, IW Köln, September 2025), Referenzfall 30 kWp / 8 Wohneinheiten. Die
Direktverbrauchsquote ist auf 40,7 % begrenzt; Versicherungskosten sind explizit enthalten
(in der Ariadne-Basis nicht) – die Rendite fällt dadurch bewusst etwas vorsichtiger aus.

---

## Technik

| Bereich      | Eingesetzt                                                            |
|--------------|-----------------------------------------------------------------------|
| Frontend     | React 18, Vite, React Router, Tailwind CSS, framer-motion, lucide-react |
| Diagramme    | Chart.js / react-chartjs-2                                            |
| Dokumente    | `docx` + `file-saver` (im Browser, dynamisch nachgeladen)            |
| Schriften    | Fraunces & Hanken Grotesk (lokal via `@fontsource`)                  |
| PWA          | `vite-plugin-pwa`                                                     |
| Backend      | Express, Socket.IO, JWT, Passport (Google OAuth)                     |
| Datenbank    | SQLite (`better-sqlite3`)                                            |

### Struktur

```
energieflow/
├─ package.json          # Root-Skripte (install:all, dev, build, start)
├─ .env.example          # → nach server/.env kopieren
├─ server/               # Express + Socket.IO + SQLite
│  └─ src/{index,db,auth}.js, routes/{auth,api}.js
└─ client/               # React + Vite (PWA)
   └─ src/
      ├─ lib/            # economics, format, api, socket, docs
      ├─ context/        # AuthContext
      ├─ components/     # ui, Layout, Analysis, Negotiation, Panels
      └─ pages/          # Landing, Rechner, Login, Join, Dashboard, Project, NotFound
```

---

*Projektkontext: Beitrag für **YES! Young Economic Solutions 2026** zur Forschungsfrage,
wie Mieterinnen und Mieter aktiv an der Energiewende teilhaben können.*
