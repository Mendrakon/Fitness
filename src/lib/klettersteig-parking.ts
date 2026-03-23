import type { KlettersteigParking } from "./types";

// -- Hohe Wand ----------------------------------------------------------------

export const HOHE_WAND_PARKING: KlettersteigParking[] = [
  {
    id: "hw-parkplatz-stollhof",
    name: "Parkplatz Stollhof",
    latitude: 47.8279,
    longitude: 16.0505,
    description: "Gebührenpflichtig, östlicher Zugang",
  },
  {
    id: "hw-parkplatz-seiser-toni",
    name: "Parkplatz Gasthof Seiser Toni",
    latitude: 47.8065,
    longitude: 16.0091,
    description: "Grünbach, südwestlicher Zugang zum Wandfuß",
  },
];

// -- Rax ----------------------------------------------------------------------

export const RAX_PARKING: KlettersteigParking[] = [
  {
    id: "rax-parkplatz-raxseilbahn",
    name: "Parkplatz Raxseilbahn",
    latitude: 47.7164,
    longitude: 15.8052,
    description: "Kostenlos, E-Ladestation, Hirschwang",
  },
  {
    id: "rax-parkplatz-preiner-gscheid",
    name: "Parkplatz Preiner Gscheid",
    latitude: 47.6759,
    longitude: 15.723,
    description: "~40 Plätze, 4€/24h, 1070m",
  },
];

// -- Schneeberg ---------------------------------------------------------------

export const SCHNEEBERG_PARKING: KlettersteigParking[] = [
  {
    id: "sb-parkplatz-losenheim",
    name: "Parkplatz Losenheim",
    latitude: 47.7917,
    longitude: 15.8313,
    description: "Bei Schneeberg-Sesselbahn, 860m",
  },
  {
    id: "sb-parkplatz-weichtalhaus",
    name: "Parkplatz Weichtalhaus",
    latitude: 47.7476,
    longitude: 15.7672,
    description: "Kostenlos, Höllental, 555m",
  },
];

// -- Alle Parkplätze ----------------------------------------------------------

export const ALL_KLETTERSTEIG_PARKING: KlettersteigParking[] = [
  ...HOHE_WAND_PARKING,
  ...RAX_PARKING,
  ...SCHNEEBERG_PARKING,
];

export const PARKING_MAP: Record<string, KlettersteigParking> = Object.fromEntries(
  ALL_KLETTERSTEIG_PARKING.map((p) => [p.id, p])
);

export function getParkingForRoute(
  parkingIds: string[] | undefined
): KlettersteigParking[] {
  if (!parkingIds) return [];
  return parkingIds.map((id) => PARKING_MAP[id]).filter(Boolean);
}
