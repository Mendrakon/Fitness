"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { KlettersteigRoute, KlettersteigDifficulty } from "@/lib/types";

import "leaflet/dist/leaflet.css";

const DIFFICULTY_HEX: Record<KlettersteigDifficulty, string> = {
  "A": "#22c55e",
  "A/B": "#4ade80",
  "B": "#eab308",
  "B/C": "#fb923c",
  "C": "#f97316",
  "C/D": "#f87171",
  "D": "#ef4444",
  "D/E": "#dc2626",
  "E": "#b91c1c",
};

function createIcon(difficulty: KlettersteigDifficulty, isSelected: boolean) {
  const color = DIFFICULTY_HEX[difficulty];
  const size = isSelected ? 16 : 12;
  const border = isSelected ? 3 : 2;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${border}px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
      ${isSelected ? "transform:scale(1.3);" : ""}
    "></div>`,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  });
}

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

function FlyToSelected({ route }: { route: KlettersteigRoute | null }) {
  const map = useMap();
  useEffect(() => {
    if (route) {
      map.flyTo([route.latitude, route.longitude], 16, { duration: 0.5 });
    }
  }, [map, route]);
  return null;
}

interface RouteMapProps {
  routes: KlettersteigRoute[];
  selectedRouteId: string | null;
  onRouteSelect: (route: KlettersteigRoute) => void;
  showParking: boolean;
}

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
        >
          <Popup>
            <div style={{ fontFamily: "inherit", textAlign: "center" }}>
              <strong>Parkplatz</strong>
              <br />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 4,
                  padding: "4px 10px",
                  background: "#3b82f6",
                  color: "white",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Navigieren
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
      <FitToRoutes routes={routes} parkingPositions={parkingPositions} />
      <FlyToSelected route={selectedRoute} />
    </MapContainer>
  );
}
