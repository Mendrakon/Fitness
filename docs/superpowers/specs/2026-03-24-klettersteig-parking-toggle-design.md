# Klettersteig Parkplatz-Toggle — Design Spec

**Datum:** 2026-03-24
**Status:** Approved

## Überblick

Jede Klettersteig-Route bekommt optionale Parkplatz-Koordinaten. Ein Toggle-Button in der Filter-Reihe zeigt/versteckt Parkplatz-Marker auf der Karte.

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

- Position: in der Filter-Reihe, nach den Location-Chips
- Label: `🅿 Parkplätze`
- Stil: identisch mit Location-Chips — ausgefüllt wenn aktiv, outline wenn inaktiv
- Standard: **aus**
- Zeigt nur Parkplätze der aktuell gefilterten Routen

```
[ Alle (19) ] [ Hohe Wand (9) ] [ Rax (7) ] [ Schneeberg (3) ]    [ 🅿 Parkplätze ]
```

### Parkplatz-Marker auf der Karte

- Form: **Quadrat** (unterscheidet sich klar von runden Routen-Markern)
- Farbe: Blau (`#3b82f6`) mit weißem "P"
- Größe: 18×18px
- Kein Klick-Event
- **Deduplizierung:** Mehrere Routen mit identischen Parkplatz-Koordinaten erzeugen nur einen Marker (per `lat,lng`-Key)

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `supabase/migrations/017_parking_coords.sql` | Spalten anlegen + Koordinaten befüllen |
| `src/lib/types.ts` | `parkingLatitude?`, `parkingLongitude?` zu `KlettersteigRoute` |
| `src/hooks/use-klettersteig-routes.ts` | Neue Felder im DB→Type Mapping |
| `src/lib/klettersteig-routes.ts` | Parkplatz-Koordinaten zu `RAX_ROUTES` und `HOHE_WAND_ROUTES` |
| `src/components/klettersteig/route-map.tsx` | `showParking` Prop + Parkplatz-Marker Rendering |
| `src/components/klettersteig/klettersteig-tab.tsx` | `showParking` State + Toggle-Button |

## Nicht im Scope

- Keine Klick-Interaktion auf Parkplatz-Marker
- Keine Navigation / Routing zum Parkplatz
- Schneeberg-Koordinaten werden nachgetragen, sobald bekannt
