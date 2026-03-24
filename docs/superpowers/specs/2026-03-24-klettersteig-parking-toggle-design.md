# Klettersteig Parkplatz-Toggle — Design Spec

**Datum:** 2026-03-24
**Status:** Approved

## Überblick

Jede Klettersteig-Route bekommt optionale Parkplatz-Koordinaten. Ein Toggle-Button zeigt/versteckt Parkplatz-Marker auf der Karte.

## Datenmodell

### `KlettersteigRoute` (types.ts)

Zwei neue optionale Felder:

```ts
parkingLatitude?: number;
parkingLongitude?: number;
```

### Supabase (klettersteig_routes Tabelle)

Neue nullable Spalten:
- `parking_latitude NUMERIC`
- `parking_longitude NUMERIC`

Migration: `017_parking_coords.sql` — hinweis: Im Repo existiert eine Nummerierungskollision (`014_klettersteig.sql` und `014_templates_folders.sql`). `017` ist die nächste freie Nummer basierend auf dem aktuellen DB-Stand.

### Bekannte Parkplatz-Koordinaten

| Route(n) | Parkplatz | Koordinaten |
|---|---|---|
| Haidsteig, Königsschusswandsteig, Preinerwandsteig | Griesleiten | 47.6836, 15.7412 |
| Bismarcksteig | Preiner Gscheid | 47.6759, 15.7235 |
| Wachthüttelkamm, Gaislochsteig, Rudolfsteig | Weichtalhaus (Höllental) | 47.7473, 15.7657 |
| Alle Hohe Wand Routen (9) | Parkplatz Hohe Wand | 47.8279, 16.0505 |
| Schneeberg Routen | — | NULL (unbekannt) |

Routen ohne Koordinaten werden beim Toggle übersprungen.

## UI

### Toggle-Button

- Position: **eigene Zeile** unterhalb der Location-Chips, damit der Toggle unabhängig von der `locations.length > 1`-Bedingung immer sichtbar ist
- Label: `🅿 Parkplätze`
- Stil: identisch mit Location-Chips — ausgefüllt wenn aktiv, outline wenn inaktiv
- Standard: **aus**
- Zeigt nur Parkplätze der aktuell gefilterten Routen (d.h. wenn "Rax" gewählt, nur Rax-Parkplätze)

```
[ Alle (19) ] [ Hohe Wand (9) ] [ Rax (7) ] [ Schneeberg (3) ]
[ 🅿 Parkplätze ]
```

Der Toggle wird **außerhalb** des `locations.length > 1`-Blocks gerendert und ist immer sichtbar, solange Routen mit Parkplatz-Koordinaten vorhanden sind.

### Parkplatz-Marker auf der Karte

- Form: **Quadrat** (unterscheidet sich klar von runden Routen-Markern)
- Farbe: Blau (`#3b82f6`) mit weißem "P"
- Größe: 18×18px
- Kein Klick-Event
- **Deduplizierung:** Mehrere Routen mit identischen Parkplatz-Koordinaten erzeugen nur einen Marker (per `lat,lng`-Key)
- **FitToRoutes:** Wenn `showParking` aktiv ist, werden die deduplizierten Parkplatz-Positionen in die Bounds-Berechnung einbezogen, damit alle Marker sichtbar sind

## Betroffene Dateien — Detailschritte

### 1. `supabase/migrations/017_parking_coords.sql`
- `ALTER TABLE klettersteig_routes ADD COLUMN parking_latitude NUMERIC`
- `ALTER TABLE klettersteig_routes ADD COLUMN parking_longitude NUMERIC`
- `UPDATE` Statements für alle bekannten Koordinaten

### 2. `src/lib/types.ts`
- `parkingLatitude?: number` und `parkingLongitude?: number` zu `KlettersteigRoute` Interface

### 3. `src/hooks/use-klettersteig-routes.ts`
- `DbRoute` lokaler Type: `parking_latitude: number | null` und `parking_longitude: number | null` hinzufügen
- `toRoute` Mapping: `parkingLatitude: row.parking_latitude ?? undefined` und `parkingLongitude: row.parking_longitude ?? undefined`
- Fallback-Konstante erweitern: `useState<KlettersteigRoute[]>([...HOHE_WAND_ROUTES, ...RAX_ROUTES])` — Schneeberg-Routen existieren nur in der Datenbank (kein statisches Fallback-Array), daher werden sie im Offline-Fallback nicht angezeigt. Das ist bewusstes Verhalten.

### 4. `src/lib/klettersteig-routes.ts`
- `parkingLatitude` und `parkingLongitude` zu allen Einträgen in `RAX_ROUTES` und `HOHE_WAND_ROUTES` hinzufügen
- Kein `SCHNEEBERG_ROUTES` Array — Schneeberg-Routen werden ausschließlich über die Datenbank bezogen

### 5. `src/components/klettersteig/route-map.tsx`
- `showParking: boolean` zu `RouteMapProps`
- Deduplizierte Parkplatz-Positionen (`[number, number][]`) aus `routes` ableiten: alle Routen mit `parkingLatitude`/`parkingLongitude` deduplizieren per `lat,lng`-Key
- `FitToRoutes` bekommt zweites Prop: `parkingPositions: [number, number][]` — wenn `showParking` aktiv und Array nicht leer, werden diese Positionen in die Bounds-Berechnung einbezogen
- Deduplizierte Parkplatz-Marker (quadratisch, blau, "P") rendern wenn `showParking` aktiv

### 6. `src/components/klettersteig/klettersteig-tab.tsx`
- `showParking` State (`useState(false)`)
- Toggle-Button in **separater Zeile**, außerhalb des `locations.length > 1`-Blocks
- `showParking` Prop an `RouteMap` weiterreichen

## Nicht im Scope

- Keine Klick-Interaktion auf Parkplatz-Marker
- Keine Navigation / Routing zum Parkplatz
- Schneeberg-Koordinaten werden nachgetragen, sobald bekannt
