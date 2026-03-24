# Klettersteig Parkplatz-Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parkplatz-Koordinaten pro Route speichern und einen Toggle-Button einbauen, der blaue "P"-Marker auf der Karte ein-/ausblendet.

**Architecture:** Optionale `parkingLatitude`/`parkingLongitude` Felder werden dem `KlettersteigRoute` Type, den statischen Konstanten und der DB-Tabelle hinzugefügt. `RouteMap` bekommt ein `showParking` Prop und rendert deduplizierte quadratische Parkplatz-Marker. `KlettersteigTab` hält den Toggle-State und zeigt einen Button unterhalb der Location-Chips.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Supabase, React-Leaflet 5, Tailwind CSS 4

---

## Dateiübersicht

| Datei | Aktion | Verantwortung |
|---|---|---|
| `supabase/migrations/017_parking_coords.sql` | Erstellen | Spalten anlegen + bekannte Koordinaten befüllen |
| `src/lib/types.ts` | Ändern (Zeile 211-220) | `parkingLatitude?` / `parkingLongitude?` zu Interface |
| `src/hooks/use-klettersteig-routes.ts` | Ändern (Zeile 8-44) | DbRoute Type + toRoute Mapping + Fallback erweitern |
| `src/lib/klettersteig-routes.ts` | Ändern | Parkplatz-Koordinaten zu RAX_ROUTES + HOHE_WAND_ROUTES |
| `src/components/klettersteig/route-map.tsx` | Ändern | `showParking` Prop + FitToRoutes + Parkplatz-Marker |
| `src/components/klettersteig/klettersteig-tab.tsx` | Ändern | `showParking` State + Toggle-Button |

---

## Task 1: SQL Migration

**Files:**
- Create: `supabase/migrations/017_parking_coords.sql`

- [ ] **Schritt 1: Migration erstellen**

```sql
-- ============================================================
-- MIGRATION: Parkplatz-Koordinaten pro Klettersteig-Route
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.klettersteig_routes
  ADD COLUMN IF NOT EXISTS parking_latitude  NUMERIC,
  ADD COLUMN IF NOT EXISTS parking_longitude NUMERIC;

-- Rax: Preiner Wand Routen → Griesleiten Parkplatz
UPDATE public.klettersteig_routes
SET parking_latitude = 47.6836, parking_longitude = 15.7412
WHERE id IN ('rax-haidsteig', 'rax-koenigsschusswandsteig', 'rax-preinerwandsteig');

-- Rax: Bismarcksteig → Preiner Gscheid
UPDATE public.klettersteig_routes
SET parking_latitude = 47.6759, parking_longitude = 15.7235
WHERE id = 'rax-bismarcksteig';

-- Rax: Höllental Routen → Weichtalhaus
UPDATE public.klettersteig_routes
SET parking_latitude = 47.7473, parking_longitude = 15.7657
WHERE id IN ('rax-wachthuettelkamm', 'rax-gaislochsteig', 'rax-rudolfsteig');

-- Hohe Wand: alle Routen → Parkplatz Hohe Wand
UPDATE public.klettersteig_routes
SET parking_latitude = 47.8279, parking_longitude = 16.0505
WHERE location_id = 'hohe-wand';
```

- [ ] **Schritt 2: TypeScript Check**

```bash
npx tsc --noEmit --pretty
```
Erwartet: keine Fehler

- [ ] **Schritt 3: Commit**

```bash
git add supabase/migrations/017_parking_coords.sql
git commit -m "feat: add parking coordinates migration for Klettersteig routes"
```

---

## Task 2: Type-Erweiterung

**Files:**
- Modify: `src/lib/types.ts` (Zeile 211-220)

- [ ] **Schritt 1: `KlettersteigRoute` Interface erweitern**

Aktuelle Zeilen 211-220 in `src/lib/types.ts`:
```ts
export interface KlettersteigRoute {
  id: string;
  locationId: string;
  name: string;
  difficulty: KlettersteigDifficulty;
  latitude: number;
  longitude: number;
  elevationGain?: number;
  description?: string;
}
```

Nach der Änderung:
```ts
export interface KlettersteigRoute {
  id: string;
  locationId: string;
  name: string;
  difficulty: KlettersteigDifficulty;
  latitude: number;
  longitude: number;
  elevationGain?: number;
  description?: string;
  parkingLatitude?: number;
  parkingLongitude?: number;
}
```

- [ ] **Schritt 2: TypeScript Check**

```bash
npx tsc --noEmit --pretty
```
Erwartet: keine Fehler

- [ ] **Schritt 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add parkingLatitude/parkingLongitude to KlettersteigRoute type"
```

---

## Task 3: Hook-Anpassung

**Files:**
- Modify: `src/hooks/use-klettersteig-routes.ts` (Zeile 1-58)

- [ ] **Schritt 1: DbRoute Type, toRoute Mapping und Fallback anpassen**

Vollständige neue Version der Datei `src/hooks/use-klettersteig-routes.ts`:

```ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { HOHE_WAND_ROUTES, RAX_ROUTES } from "@/lib/klettersteig-routes";
import type { KlettersteigRoute } from "@/lib/types";

type DbRoute = {
  id: string;
  location_id: string;
  name: string;
  difficulty: string;
  latitude: number;
  longitude: number;
  elevation_gain: number | null;
  description: string | null;
  parking_latitude: number | null;
  parking_longitude: number | null;
};

function toRoute(row: DbRoute): KlettersteigRoute {
  return {
    id: row.id,
    locationId: row.location_id,
    name: row.name,
    difficulty: row.difficulty as KlettersteigRoute["difficulty"],
    latitude: row.latitude,
    longitude: row.longitude,
    elevationGain: row.elevation_gain ?? undefined,
    description: row.description ?? undefined,
    parkingLatitude: row.parking_latitude ?? undefined,
    parkingLongitude: row.parking_longitude ?? undefined,
  };
}

export function useKlettersteigRoutes() {
  const [routes, setRoutes] = useState<KlettersteigRoute[]>([...HOHE_WAND_ROUTES, ...RAX_ROUTES]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createClient();
    client
      .from("klettersteig_routes")
      .select("*")
      .then(({ data }) => {
        if (data && data.length > 0) setRoutes(data.map(toRoute));
        setLoading(false);
      });
  }, []);

  const getById = useCallback(
    (routeId: string) => routes.find((r) => r.id === routeId),
    [routes]
  );

  const getByLocation = useCallback(
    (locationId: string) => routes.filter((r) => r.locationId === locationId),
    [routes]
  );

  return { routes, loading, getById, getByLocation };
}
```

- [ ] **Schritt 2: TypeScript Check**

```bash
npx tsc --noEmit --pretty
```
Erwartet: keine Fehler

- [ ] **Schritt 3: Commit**

```bash
git add src/hooks/use-klettersteig-routes.ts
git commit -m "feat: map parking coordinates in useKlettersteigRoutes hook"
```

---

## Task 4: Statische Routen-Daten

**Files:**
- Modify: `src/lib/klettersteig-routes.ts`

- [ ] **Schritt 1: Parkplatz-Koordinaten zu RAX_ROUTES und HOHE_WAND_ROUTES hinzufügen**

In `src/lib/klettersteig-routes.ts` jeden Routen-Eintrag um `parkingLatitude` und `parkingLongitude` ergänzen:

Für `RAX_ROUTES`:
```ts
// rax-haidsteig, rax-koenigsschusswandsteig, rax-preinerwandsteig:
parkingLatitude: 47.6836,
parkingLongitude: 15.7412,

// rax-bismarcksteig:
parkingLatitude: 47.6759,
parkingLongitude: 15.7235,

// rax-wachthuettelkamm, rax-gaislochsteig, rax-rudolfsteig:
parkingLatitude: 47.7473,
parkingLongitude: 15.7657,
```

Für alle 9 Einträge in `HOHE_WAND_ROUTES`:
```ts
parkingLatitude: 47.8279,
parkingLongitude: 16.0505,
```

- [ ] **Schritt 2: TypeScript Check**

```bash
npx tsc --noEmit --pretty
```
Erwartet: keine Fehler

- [ ] **Schritt 3: Commit**

```bash
git add src/lib/klettersteig-routes.ts
git commit -m "feat: add parking coordinates to static Klettersteig route data"
```

---

## Task 5: Karte — Parkplatz-Marker

**Files:**
- Modify: `src/components/klettersteig/route-map.tsx`

- [ ] **Schritt 1: `createParkingIcon` Funktion hinzufügen**

Nach der bestehenden `createIcon` Funktion (Zeile 37) einfügen:

```ts
function createParkingIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:18px;height:18px;border-radius:3px;
      background:#3b82f6;border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:bold;color:white;line-height:1;
    ">P</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}
```

- [ ] **Schritt 2: `FitToRoutes` um `parkingPositions` Prop erweitern**

Die gesamte `FitToRoutes` Funktion (von `function FitToRoutes` bis zur schließenden `}`) ersetzen:

```ts
function FitToRoutes({
  routes,
  parkingPositions,
}: {
  routes: KlettersteigRoute[];
  parkingPositions: [number, number][];
}) {
  const map = useMap();
  useEffect(() => {
    if (routes.length === 0) return;
    const center: [number, number] = [
      routes.reduce((s, r) => s + r.latitude, 0) / routes.length,
      routes.reduce((s, r) => s + r.longitude, 0) / routes.length,
    ];
    const allPositions: [number, number][] = [
      ...routes.map((r): [number, number] => [r.latitude, r.longitude]),
      ...parkingPositions,
    ];
    const bounds = L.latLngBounds(allPositions);
    const zoom = Math.max(13, map.getBoundsZoom(bounds, false, L.point(40, 40)));
    map.setView(center, Math.min(zoom, 15));
  }, [map, routes, parkingPositions]);
  return null;
}
```

- [ ] **Schritt 3: React-Import um `useMemo` erweitern**

Zeile 1 von `src/components/klettersteig/route-map.tsx` ändern:

```ts
// Vorher:
import { useEffect } from "react";

// Nachher:
import { useEffect, useMemo } from "react";
```

- [ ] **Schritt 4: `RouteMapProps` und `RouteMap` um `showParking` erweitern**

Das `RouteMapProps` Interface (die Zeilen mit `interface RouteMapProps { ... }`) ersetzen:

```ts
interface RouteMapProps {
  routes: KlettersteigRoute[];
  selectedRouteId: string | null;
  onRouteSelect: (route: KlettersteigRoute) => void;
  showParking: boolean;
}
```

Die gesamte `RouteMap` Funktion (von `export function RouteMap` bis zur schließenden `}`) ersetzen:

```ts
export function RouteMap({ routes, selectedRouteId, onRouteSelect, showParking }: RouteMapProps) {
  const center: [number, number] = routes.length > 0
    ? [
        routes.reduce((s, r) => s + r.latitude, 0) / routes.length,
        routes.reduce((s, r) => s + r.longitude, 0) / routes.length,
      ]
    : [47.829, 16.039];
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  // Deduplizierte Parkplatz-Positionen (mehrere Routen können denselben Parkplatz teilen)
  const parkingPositions = useMemo<[number, number][]>(() => {
    if (!showParking) return [];
    const seen = new Set<string>();
    const result: [number, number][] = [];
    for (const r of routes) {
      if (r.parkingLatitude == null || r.parkingLongitude == null) continue;
      const key = `${r.parkingLatitude},${r.parkingLongitude}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push([r.parkingLatitude, r.parkingLongitude]);
      }
    }
    return result;
  }, [routes, showParking]);

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        maxZoom={17}
      />
      {routes.map((route) => (
        <Marker
          key={route.id}
          position={[route.latitude, route.longitude]}
          icon={createIcon(route.difficulty, route.id === selectedRouteId)}
          eventHandlers={{ click: () => onRouteSelect(route) }}
        >
          <Popup>
            <div style={{ fontFamily: "inherit", minWidth: 120 }}>
              <strong>{route.name}</strong>
              <br />
              <span style={{ color: DIFFICULTY_HEX[route.difficulty] }}>
                {route.difficulty}
              </span>
              {route.elevationGain && ` · ${route.elevationGain} Hm`}
            </div>
          </Popup>
        </Marker>
      ))}
      {showParking && parkingPositions.map(([lat, lng]) => (
        <Marker
          key={`parking-${lat}-${lng}`}
          position={[lat, lng]}
          icon={createParkingIcon()}
        />
      ))}
      <FitToRoutes routes={routes} parkingPositions={parkingPositions} />
      <FlyToSelected route={selectedRoute} />
    </MapContainer>
  );
}
```

- [ ] **Schritt 5: TypeScript Check**

```bash
npx tsc --noEmit --pretty
```
Erwartet: keine Fehler

- [ ] **Schritt 6: Commit**

```bash
git add src/components/klettersteig/route-map.tsx
git commit -m "feat: add parking markers to RouteMap with showParking toggle support"
```

---

## Task 6: Toggle-Button in KlettersteigTab

**Files:**
- Modify: `src/components/klettersteig/klettersteig-tab.tsx`

- [ ] **Schritt 1: `showParking` State hinzufügen**

Direkt nach dem `selectedLocationId` State (nach Zeile mit `useState<string | null>(null)`) einfügen:

```ts
const [showParking, setShowParking] = useState(false);
```

- [ ] **Schritt 2: Toggle-Button und `showParking` Prop in den Map-View einbauen**

Im Map-View Abschnitt (`// Map view (default)`) zwei Änderungen:

**A) Toggle-Button** — nach dem `{locations.length > 1 && (...)}` Block und VOR dem `{/* Map */}` Block einfügen. Der Kontext sieht so aus:

```tsx
      {/* Location Filter */}
      {locations.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {/* ... location chips ... */}
        </div>
      )}

      {/* Parkplatz Toggle — NEU HIER EINFÜGEN */}
      <div className="flex">
        <button
          onClick={() => setShowParking((v) => !v)}
          className={`text-[11px] rounded-full px-2.5 py-1 transition-colors font-medium ${
            showParking
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🅿 Parkplätze
        </button>
      </div>

      {/* Map */}
      <div className="h-72 rounded-lg overflow-hidden border border-border">
```

**B) `showParking` Prop an `<RouteMap>` weitergeben:**

```tsx
<RouteMap
  routes={filteredRoutes}
  selectedRouteId={selectedRoute?.id ?? null}
  onRouteSelect={handleRouteSelect}
  showParking={showParking}
/>
```

- [ ] **Schritt 3: TypeScript Check**

```bash
npx tsc --noEmit --pretty
```
Erwartet: keine Fehler

- [ ] **Schritt 4: Visuell testen**

```bash
npm run dev
```

1. Klettersteig Tab öffnen
2. "🅿 Parkplätze" Button klicken → blaue "P"-Marker erscheinen auf der Karte
3. Button nochmal klicken → Marker verschwinden
4. Location-Filter auf "Rax" wechseln → nur Rax-Parkplätze sichtbar
5. "Alle" wählen → Parkplätze aller Standorte sichtbar
6. Karte soll bei aktivem Parkplatz-Toggle die Parkplatz-Marker einschließen (Bounds)

- [ ] **Schritt 5: Commit**

```bash
git add src/components/klettersteig/klettersteig-tab.tsx
git commit -m "feat: add parking toggle button to Klettersteig filter row"
```

---

## Task 7: Build-Verifikation

- [ ] **Schritt 1: Produktions-Build**

```bash
npm run build
```
Erwartet: Build erfolgreich, keine Fehler, `/workout` und `/klettersteig/*` Routen grün

- [ ] **Schritt 2: Abschluss-Commit (falls nötig)**

```bash
git add -A
git commit -m "feat: Klettersteig Parkplatz-Toggle vollständig implementiert"
```

---

## Hinweise

- **Supabase Migration**: Die SQL-Migration muss manuell im Supabase Dashboard → SQL Editor ausgeführt werden. Ohne sie zeigt die Karte keine Parkplätze (lokale Fallback-Daten greifen aber).
- **Schneeberg**: Hat keine Parkplatz-Koordinaten → beim Toggle übersprungen, kein Fehler.
- **Deduplizierung**: Hohe Wand hat 9 Routen mit identischen Parkplatz-Koordinaten → erscheint nur als 1 Marker.
