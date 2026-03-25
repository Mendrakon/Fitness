export interface GebirgeLocation {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
}

export const GEBIRGE_LOCATIONS: GebirgeLocation[] = [
  { id: "hohe-wand", name: "Hohe Wand", center: [47.822, 16.046], zoom: 13 },
  { id: "rax", name: "Rax", center: [47.715, 15.735], zoom: 13 },
  { id: "schneeberg", name: "Schneeberg", center: [47.755, 15.793], zoom: 13 },
];

export const GEBIRGE_MAP: Record<string, GebirgeLocation> = Object.fromEntries(
  GEBIRGE_LOCATIONS.map((g) => [g.id, g])
);

export function getLocationName(locationId: string): string {
  return GEBIRGE_MAP[locationId]?.name ?? locationId;
}
