"use client";

import { useEffect } from "react";
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
}

export function RouteMap({ routes, selectedRouteId, onRouteSelect }: RouteMapProps) {
  const center: [number, number] = [47.829, 16.039];
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

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
      <FlyToSelected route={selectedRoute} />
    </MapContainer>
  );
}
