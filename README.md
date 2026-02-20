# 🃏 Skat Turnierbuch

Digitales Turnierbuch für Skat-Turniere – Tischplanung, Ergebnisse & Rangliste.

---

## Übersicht

Das **Skat Turnierbuch** existiert in **zwei Versionen**, die in **separaten Branches** dieses Repositories gepflegt werden:

| | 🖥️ Lokale Version | 🌐 Server-Version |
|---|---|---|
| **Branch** | [`master`](../../tree/master) | [`server-version`](../../tree/server-version) |
| **Datenhaltung** | Browser (`localStorage`) | MongoDB-Datenbank |
| **Multi-Device** | ❌ Nein (nur ein Gerät) | ✅ Ja (alle Geräte synchron) |
| **Passwortschutz** | ❌ Nein | ✅ Ja |
| **QR-Codes** | ❌ Nein | ✅ Ja (Rangliste teilen) |
| **Infrastruktur** | Keine (nur Browser) | Node.js-Server + MongoDB |
| **Ideal für** | Einzelner Turnierleiter am eigenen Gerät | Turniere mit mehreren Helfern / Live-Anzeige |

---

## 🖥️ Lokale Version (`master`)

### Beschreibung

Die lokale Version läuft **komplett im Browser** ohne Backend. Alle Turnierdaten werden über **Zustand + `localStorage`** im Browser des Nutzers gespeichert. Es ist keine Datenbank und kein Server erforderlich.

### Funktionen

- **Turnier-Setup**: Name, Datum, Ort, Startgeld, Spieler, Serien- & Spielanzahl
- **Automatische Tischplanung**: Optimierter Algorithmus, der Spieler fair auf Tische verteilt und Wiederholungen minimiert
- **Ergebnis-Erfassung**: Punkte pro Spiel und Spieler eintragen
- **Rangliste**: Live-Berechnung mit Gesamtpunkten und Platzierung
- **Fairness-Analyse**: Bewertung der Tischverteilung (Paarwiederholungen, Aussetzer-Verteilung)
- **Spieler-Detail**: Individuelle Statistiken pro Spieler
- **Preisberechnung**: Konfigurierbare Preisverteilung (Top 3/5/10 oder benutzerdefiniert)
- **Export/Import**: Turnierdaten als JSON exportieren und importieren
- **Druckbare Tischkarten**: Tischzuordnungen zum Ausdrucken
- **PWA-fähig**: Kann als App auf dem Homescreen installiert werden
- **Demo-Modus**: Vorausgefülltes Beispielturnier zum Ausprobieren

### Tech-Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI**: [React 19](https://react.dev/) + [Tailwind CSS 3](https://tailwindcss.com/)
- **State Management**: [Zustand 5](https://zustand-demo.pmnd.rs/) mit `persist`-Middleware (localStorage)
- **Sprache**: TypeScript

### Starten

```bash
git checkout master
npm install
npm run dev
```

Die App ist dann unter `http://localhost:3000` erreichbar.

---

## 🌐 Server-Version (`server-version`)

### Beschreibung

Die Server-Version erweitert die lokale Version um ein **Backend mit MongoDB**. Turnierdaten werden in einer Datenbank gespeichert und sind über **API-Routen** (Next.js Route Handlers) zugänglich. Dadurch können **mehrere Geräte gleichzeitig** auf dasselbe Turnier zugreifen – ideal für Turniere mit mehreren Helfern oder eine öffentliche Live-Rangliste.

### Zusätzliche Funktionen (gegenüber der Lokalen Version)

- **MongoDB-Anbindung**: Persistente Datenhaltung in einer Datenbank
- **Multi-Device-Support**: Mehrere Geräte können gleichzeitig Ergebnisse eintragen
- **REST-API**: Vollständige API-Routen für CRUD-Operationen auf Turnieren
- **Passwortschutz**: Turniere können mit einem Passwort geschützt werden (Ersteller-Passwort)
- **QR-Codes**: QR-Code-Generierung für einfaches Teilen der Rangliste
- **Turnier-Übersicht**: Startseite zeigt alle vorhandenen Turniere

### Tech-Stack

- Alles aus der lokalen Version, **plus**:
- **Datenbank**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **API**: Next.js Route Handlers (`/api/tournaments/...`)
- **QR-Codes**: [qrcode.react](https://www.npmjs.com/package/qrcode.react)

### Voraussetzungen

- Node.js (≥ 18)
- MongoDB-Instanz (lokal oder z.B. [MongoDB Atlas](https://www.mongodb.com/atlas))

### Starten

```bash
git checkout server-version
npm install
```

`.env.local` anlegen (siehe `.env.example`):

```env
MONGODB_URI=mongodb://localhost:27017/skat-turnierbuch
```

```bash
npm run dev
```

Die App ist dann unter `http://localhost:3000` erreichbar.

### API-Endpunkte

| Methode | Route | Beschreibung |
|---|---|---|
| `GET` | `/api/tournaments` | Alle Turniere auflisten |
| `POST` | `/api/tournaments` | Neues Turnier erstellen |
| `GET` | `/api/tournaments/[id]` | Turnier laden |
| `PUT` | `/api/tournaments/[id]` | Turnier aktualisieren |
| `DELETE` | `/api/tournaments/[id]` | Turnier löschen |
| `POST` | `/api/tournaments/[id]/verify` | Passwort verifizieren |
| `POST` | `/api/tournaments/[id]/score` | Ergebnis eintragen |
| `POST` | `/api/tournaments/[id]/series/[nr]/complete` | Serie abschließen |
| `POST` | `/api/tournaments/[id]/series/[nr]/reopen` | Serie wieder öffnen |

---

## Welche Version soll ich nutzen?

**Lokale Version wählen, wenn:**
- Du alleine ein Turnier leitest
- Du keine Datenbank aufsetzen möchtest
- Offline-Fähigkeit wichtig ist
- Du es einfach schnell ausprobieren willst

**Server-Version wählen, wenn:**
- Mehrere Personen gleichzeitig Ergebnisse eintragen sollen
- Du eine Live-Rangliste auf einem öffentlichen Bildschirm zeigen willst
- Du Turniere dauerhaft in einer Datenbank speichern möchtest
- Passwortschutz für Turniere benötigt wird

---

## Projektstruktur (gemeinsam)

```
src/
├── app/                  # Next.js App Router Seiten
│   ├── page.tsx          # Startseite / Turnier-Setup
│   └── turnier/          # Turnier-Ansichten (Serien, Rangliste, Export, …)
├── components/           # React-Komponenten
│   ├── SetupWizard.tsx   # Turnier-Einrichtung
│   ├── Leaderboard.tsx   # Rangliste
│   ├── SeriesPlanner.tsx # Serien-/Tischansicht
│   └── ...
├── lib/                  # Hilfs-Funktionen
│   ├── planner.ts        # Tischplanungs-Algorithmus
│   ├── scoring.ts        # Punkte-Berechnung
│   └── prizes.ts         # Preisverteilung
├── store/                # Zustand Store
│   └── tournament-store.ts
└── types/                # TypeScript-Typen
    └── index.ts
```

---

## Lizenz

Privates Projekt.