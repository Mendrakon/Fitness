"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { KlettersteigRoute, KlettersteigDifficulty, KlettersteigParking } from "@/lib/types";

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
      width:20px;height:20px;border-radius:4px;
      background:#3b82f6;border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
      color:white;font-weight:bold;font-size:11px;
      line-height:20px;text-align:center;
    ">P</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
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

function FlyToLocation({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [map, center, zoom]);
  return null;
}

interface RouteMapProps {
  routes: KlettersteigRoute[];
  selectedRouteId: string | null;
  onRouteSelect: (route: KlettersteigRoute) => void;
  center: [number, number];
  zoom: number;
  parkingSpots?: KlettersteigParking[];
}

export function RouteMap({ routes, selectedRouteId, onRouteSelect, center, zoom, parkingSpots = [] }: RouteMapProps) {
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
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
      {parkingSpots.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={createParkingIcon()}
        >
          <Popup>
            <div style={{ fontFamily: "inherit", minWidth: 140 }}>
              <strong>P {p.name}</strong>
              {p.description && (
                <>
                  <br />
                  <span style={{ fontSize: 11 }}>{p.description}</span>
                </>
              )}
              <br />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#3b82f6", fontSize: 12 }}
              >
                Navigation starten
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
      <FlyToSelected route={selectedRoute} />
      <FlyToLocation center={center} zoom={zoom} />
    </MapContainer>
  );
}
