# Klettersteig-Performance-Tracking

## Zusammenfassung

Eigenständiger Bereich in der Fitness-App für wiederholbare Klettersteig-Sessions. Fokus auf Zeiterfassung, Zusatzgewicht, Wetterbedingungen und Leistungsentwicklung. Start mit der Hohen Wand (Niederösterreich), architektonisch erweiterbar für weitere Standorte.

## Architektur: Hybrid-Ansatz

Eigene Tabellen und Hooks für die Klettersteig-Domain, aber geteilte Infrastruktur (Feed-System, UI-Patterns) mit dem bestehenden Gym-Workout-System. Die Zeitmessung (Stoppuhr) wird im eigenen `KlettersteigSessionContext` verwaltet (analog zu `ActiveWorkoutContext.elapsedSeconds`), nicht über den bestehenden `TimerContext` (der ein Countdown-Rest-Timer ist).

---

## 1. Datenmodell

### Neue Supabase-Tabellen

**`klettersteig_routes`** — Vordefinierte Routen (Seed-Daten)

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| `id` | TEXT PK | z.B. `hohe-wand-steirerspur` |
| `location_id` | TEXT | Standort-Gruppe, z.B. `hohe-wand` |
| `name` | TEXT | Routenname |
| `difficulty` | TEXT | Schwierigkeitsgrad (A bis E, inkl. A/B etc.) |
| `latitude` | NUMERIC | GPS-Breite für Kartenmarker |
| `longitude` | NUMERIC | GPS-Länge für Kartenmarker |
| `elevation_gain` | INTEGER | Höhenmeter (optional) |
| `description` | TEXT | Kurzbeschreibung |

**`klettersteig_sessions`** — User-Sessions

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| `id` | UUID PK | |
| `user_id` | UUID FK→auth.users | |
| `route_id` | TEXT FK→klettersteig_routes | |
| `start_time` | TIMESTAMPTZ | |
| `end_time` | TIMESTAMPTZ | |
| `duration_seconds` | INTEGER | Berechnete Dauer |
| `extra_weight_kg` | NUMERIC | Gewichtsweste, Rucksack etc. |
| `weather` | JSONB | `{condition, temperature, wind}` |
| `notes` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

- RLS: User sieht/bearbeitet nur eigene Sessions
- Index: `(user_id, route_id, start_time DESC)`

### TypeScript Types (`src/lib/types.ts`)

```typescript
type KlettersteigDifficulty = 'A' | 'A/B' | 'B' | 'B/C' | 'C' | 'C/D' | 'D' | 'D/E' | 'E'
type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'cold'
type WindStrength = 'calm' | 'light' | 'moderate' | 'strong'

interface KlettersteigRoute {
  id: string
  locationId: string
  name: string
  difficulty: KlettersteigDifficulty
  latitude: number
  longitude: number
  elevationGain?: number
  description?: string
}

interface KlettersteigWeather {
  condition: WeatherCondition
  temperature: number | null
  wind: WindStrength | null
}

interface KlettersteigSession {
  id: string
  userId: string
  routeId: string
  startTime: string
  endTime: string | null
  durationSeconds: number
  extraWeightKg: number
  weather: KlettersteigWeather
  notes: string
}
```

---

## 2. Navigation & Seitenstruktur

### Workout-Tab Erweiterung

Oben auf der Workout-Seite: Toggle-Tabs `Gym | Klettersteig`
- `Gym`: Bestehendes Workout-Interface (unverändert)
- `Klettersteig`: Karte + Session-Flow

### Neue Routes

| Route | Zweck |
|-------|-------|
| `/workout` | Bestehend + Tab-Switcher oben |
| `/klettersteig/[routeId]` | Route-Detailseite (Stats, History, Charts) |
| `/klettersteig/session/[id]` | Vergangene Session-Detailansicht |

### Integration in bestehende Seiten

- **Home (`/`)**: Klettersteig-Sessions in "Letzte Aktivität"
- **History (`/history`)**: Sessions im Verlauf mit 🏔️-Badge, filterbar nach Gym/Klettersteig/Alle
- **Community (`/community`)**: Sessions als Feed-Events

---

## 3. Karte & Route-Auswahl

### Leaflet + OpenStreetMap

- **Library**: `react-leaflet` + `leaflet` (neue Dependencies)
- **Kartenstil**: OpenStreetMap Topo-Layer
- **Zentrum**: Hohe Wand GPS-Koordinaten (~47.829, 16.041)
- **Marker**: Farbcodiert nach Schwierigkeit (Rot=schwer, Grün=leicht)
- **Interaktion**: Marker antippen → Route-Info Drawer
- **SSR**: `react-leaflet` unterstützt kein Server-Side-Rendering → Karten-Komponente muss mit `dynamic(() => import(...), { ssr: false })` geladen werden

### Route-Info Drawer

Öffnet sich von unten (bestehende Drawer-Komponente aus shadcn/ui):
- Route-Name + Schwierigkeits-Badge
- Stat-Grid: Bestzeit, Anzahl Sessions, Max. Zusatzgewicht
- Letzte 2-3 Sessions (Datum, Zeit, Gewicht, Wetter)
- Buttons: "Session starten" (primär) + "Details" (sekundär)

---

## 4. Session-Flow

### Schritt 1: Karte (Idle)
Gym/Klettersteig Tab → Leaflet-Karte mit Route-Markern

### Schritt 2: Route antippen → Drawer
Route-Info mit Bestzeit, Sessions, max. Gewicht + "Session starten" Button

### Schritt 3: Session starten
- Bevor Timer startet: Zusatzgewicht (kg) + Wetter eingeben
- Timer startet → Vollbild-Session-Ansicht:
  - Großer Timer (Minuten:Sekunden)
  - Route-Name + Schwierigkeit
  - Zusatzgewicht + Wetter
  - Live-Vergleich mit Bestzeit
  - "Session beenden" Button
- Zeitmessung: `KlettersteigSessionContext` trackt `elapsedSeconds` als Count-Up-Stoppuhr (berechnet aus `startTime`), analog zum Pattern in `ActiveWorkoutContext`. Der bestehende `TimerContext` (Countdown-Rest-Timer) wird **nicht** verwendet/modifiziert.
- Session wird in localStorage gespeichert (Absturzsicherheit)

### Schritt 4: Session beenden
- Zusammenfassung: Zeit, Gewicht, Wetter
- PR-Erkennung (automatisch)
- Notizen-Feld
- "Speichern" → Supabase + optional "Im Feed teilen"

---

## 5. Statistiken & PRs

### PR-Metriken

| Metrik | Beschreibung |
|--------|-------------|
| `best_time` | Schnellste Zeit auf einer Route |
| `max_weight` | Schwerstes Zusatzgewicht |
| `best_weighted_time` | Schnellste Zeit bei ≥ X kg |

### PR-Speicherung: Eigene Tabelle `klettersteig_pr_events`

Die bestehende `pr_events` Tabelle hat Gym-spezifische Spalten (`workout_id`, `reps`, `volume`, `estimated_1rm`), die für Klettersteig-PRs nicht passen. Daher eine eigene Tabelle:

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| `id` | TEXT PK | `{sessionId}-{routeId}-{metric}` |
| `user_id` | UUID FK→auth.users | |
| `route_id` | TEXT FK→klettersteig_routes | |
| `session_id` | UUID FK→klettersteig_sessions | |
| `date` | TIMESTAMPTZ | |
| `metric` | TEXT | `best_time`, `max_weight`, `best_weighted_time` |
| `new_value` | NUMERIC | Neuer PR-Wert |
| `old_value` | NUMERIC | Vorheriger Wert |
| `diff` | NUMERIC | Differenz |
| `diff_percent` | NUMERIC | Prozentuale Änderung |
| `duration_seconds` | INTEGER | Session-Dauer (Kontext) |
| `extra_weight_kg` | NUMERIC | Zusatzgewicht (Kontext) |
| `created_at` | TIMESTAMPTZ | |

- RLS: User sieht nur eigene PRs
- Index: `(user_id, route_id)`

### Route-Detailseite (`/klettersteig/[routeId]`)

- Zeitverlauf-Chart (Recharts LineChart): Session-Zeiten über die Zeit
- Gewichtsverlauf-Chart: Zusatzgewicht-Entwicklung
- PR-History: Bestzeit + max. Gewicht Verlauf
- Sessions-Liste: Alle Sessions mit Datum, Zeit, Gewicht, Wetter
- Statistik-Karten: Durchschnitt, Median, Anzahl Sessions

### Home-Dashboard

- "Letzte Klettersteig-Session" Card neben Gym-Workouts
- Klettersteig-PRs in PR-Übersicht (Berg-Icon)

---

## 6. Feed-Integration

### Neuer Feed-Event-Typ: `klettersteig_complete`

```typescript
interface KlettersteigFeedPayload {
  sessionId: string
  routeName: string
  routeDifficulty: KlettersteigDifficulty
  locationName: string
  durationSeconds: number
  extraWeightKg: number
  weather: KlettersteigWeather
  prs: { metric: string; newValue: number; oldValue: number }[]
}
```

**Erforderliche Änderungen:**
- Migration: CHECK constraint auf `feed_events.type` erweitern um `'klettersteig_complete'` (`ALTER TABLE feed_events DROP CONSTRAINT ...; ADD CONSTRAINT ...`)
- `FeedEvent` Interface in `use-activity-feed.ts`: `payload` Union erweitern um `KlettersteigFeedPayload`
- `createFeedEvent()`: Payload-Typ auf `WorkoutPayload | TemplateSharePayload | KlettersteigFeedPayload` erweitern
- Feed-Rendering in `community/page.tsx`: Neuen Event-Typ mit Berg-Icon rendern

- Berg-Icon (🏔️) im Feed statt Hantel-Icon
- Zeigt: Route, Schwierigkeit, Zeit, Zusatzgewicht, Wetter, PRs
- Liken + Kommentieren wie gewohnt

### History-Integration

- Klettersteig-Sessions mit 🏔️-Badge im Verlauf
- Filterbar: Gym / Klettersteig / Alle

---

## 7. Neue Dateien & Abhängigkeiten

### Neue Dependencies
- `leaflet` + `react-leaflet` + `@types/leaflet`

### Neue Dateien

| Datei | Zweck |
|-------|-------|
| `supabase/migrations/014_klettersteig.sql` | Tabellen + RLS + Seed-Daten + feed_events CHECK constraint erweitern |
| `src/lib/klettersteig-routes.ts` | Vordefinierte Routen (Hohe Wand) |
| `src/lib/klettersteig-pr-detection.ts` | PR-Erkennung für Klettersteig |
| `src/hooks/use-klettersteig-sessions.ts` | Sessions CRUD + Abfragen |
| `src/hooks/use-klettersteig-routes.ts` | Routen laden |
| `src/contexts/klettersteig-session-context.tsx` | Aktive Session State |
| `src/components/klettersteig/route-map.tsx` | Leaflet-Karte |
| `src/components/klettersteig/route-drawer.tsx` | Route-Info Drawer |
| `src/components/klettersteig/active-session.tsx` | Timer-Ansicht |
| `src/components/klettersteig/session-summary.tsx` | Zusammenfassung nach Session |
| `src/components/klettersteig/session-input.tsx` | Gewicht/Wetter Eingabe vor Start |
| `src/app/klettersteig/[routeId]/page.tsx` | Route-Detail mit Stats |
| `src/app/klettersteig/session/[id]/page.tsx` | Session-Detail |

### Zu modifizierende Dateien

| Datei | Änderung |
|-------|---------|
| `src/app/workout/page.tsx` | Tab-Switcher (Gym/Klettersteig) |
| `src/app/page.tsx` | Klettersteig-Session in "Letzte Aktivität" |
| `src/app/history/page.tsx` | Klettersteig-Sessions + Filter |
| `src/hooks/use-activity-feed.ts` | `klettersteig_complete` Event-Typ |
| `src/app/community/page.tsx` | Klettersteig-Feed-Events rendern |
| `src/lib/types.ts` | Neue Types hinzufügen |
| `src/app/providers.tsx` | KlettersteigSessionProvider einbinden |
| `src/components/layout/bottom-nav.tsx` | (Minimal) Evtl. Badge für aktive Klettersteig-Session |
| `package.json` | Leaflet Dependencies |

---

## 8. Hohe-Wand-Routen (Seed-Daten)

Bekannte Klettersteige der Hohen Wand:

| Route | Schwierigkeit | Beschreibung |
|-------|--------------|-------------|
| Steirerspur | C/D | Klassiker, anspruchsvoll |
| Hanselsteig | A/B | Einsteigerfreundlich |
| Wildenauersteig | C | Mittelschwer, schöne Aussicht |
| Gebirgsvereinssteig | B | Moderat |
| Günther-Schlesinger-Steig | B | Moderat, gut gesichert |
| HTL-Steig | B/C | Mittel bis schwer |
| Hubertussteig | A | Leicht |
| Völlerin-Steig | C | Anspruchsvoll |
| Springlessteig | A/B | Einsteigerfreundlich |

GPS-Koordinaten werden bei der Implementierung anhand realer Daten gesetzt.

---

## 9. Gleichzeitige Sessions

Gym-Workout und Klettersteig-Session schließen sich gegenseitig aus. Wenn eine aktive Klettersteig-Session läuft:
- Im Gym-Tab: Hinweis "Aktive Klettersteig-Session läuft" + Button zum Zurückwechseln
- Neues Gym-Workout kann erst nach Beenden/Verwerfen der Klettersteig-Session gestartet werden

Umgekehrt: Klettersteig-Session kann nicht gestartet werden wenn ein Gym-Workout läuft.

---

## 10. Erweiterbarkeit

Die Architektur unterstützt weitere Standorte durch:
- `location_id` in `klettersteig_routes` → Gruppierung nach Standort
- Karten-Komponente akzeptiert Zentrum + Zoom als Props
- Standort-Auswahl kann später als Dropdown über der Karte hinzugefügt werden
