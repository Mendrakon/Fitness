export interface GebirgeLocation {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
}

export const GEBIRGE_LOCATIONS: GebirgeLocation[] = [
  { id: "hohe-wand", name: "Hohe Wand", center: [47.829, 16.039], zoom: 15 },
  { id: "rax", name: "Rax", center: [47.685, 15.768], zoom: 14 },
  { id: "schneeberg", name: "Schneeberg", center: [47.767, 15.808], zoom: 14 },
];

export const GEBIRGE_MAP: Record<string, GebirgeLocation> = Object.fromEntries(
  GEBIRGE_LOCATIONS.map((g) => [g.id, g])
);

export function getLocationName(locationId: string): string {
  return GEBIRGE_MAP[locationId]?.name ?? locationId;
}
