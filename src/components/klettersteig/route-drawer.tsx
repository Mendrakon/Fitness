"use client";

import { useRouter } from "next/navigation";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  KLETTERSTEIG_DIFFICULTY_COLORS,
  WEATHER_ICONS,
  formatKlettersteigTime,
} from "@/lib/types";
import type { KlettersteigRoute, KlettersteigSession, KlettersteigParking } from "@/lib/types";
import { getLocationName } from "@/lib/klettersteig-locations";
import { getParkingForRoute } from "@/lib/klettersteig-parking";
import { cn } from "@/lib/utils";

interface RouteDrawerProps {
  route: KlettersteigRoute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: KlettersteigSession[];
  bestTime: number | null;
  maxWeight: number | null;
  onStartSession: () => void;
}

export function RouteDrawer({
  route,
  open,
  onOpenChange,
  sessions,
  bestTime,
  maxWeight,
  onStartSession,
}: RouteDrawerProps) {
  const router = useRouter();

  if (!route) return null;

  const recentSessions = sessions.slice(0, 3);
  const parkingSpots = getParkingForRoute(route.parkingIds);

  function openNavigation(parking: KlettersteigParking) {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${parking.latitude},${parking.longitude}`,
      "_blank"
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-xs",
                KLETTERSTEIG_DIFFICULTY_COLORS[route.difficulty]
              )}
            >
              {route.difficulty}
            </div>
            <div>
              <DrawerTitle>{route.name}</DrawerTitle>
              <p className="text-xs text-muted-foreground">
                {getLocationName(route.locationId)}{route.elevationGain ? ` · ${route.elevationGain} Hm` : ""}
              </p>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Bestzeit</p>
              <p className="text-lg font-bold text-green-500">
                {bestTime ? formatKlettersteigTime(bestTime) : "–"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Sessions</p>
              <p className="text-lg font-bold">{sessions.length}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Max. Gewicht</p>
              <p className="text-lg font-bold text-amber-500">
                {maxWeight ? `${maxWeight} kg` : "–"}
              </p>
            </div>
          </div>

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                Letzte Sessions
              </p>
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.startTime).toLocaleDateString("de-DE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-xs font-medium">
                    {formatKlettersteigTime(s.durationSeconds)}
                    {s.extraWeightKg > 0 && ` · ${s.extraWeightKg} kg`}
                    {s.weather?.condition && ` · ${WEATHER_ICONS[s.weather.condition]}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Parkplätze */}
          {parkingSpots.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                Parkplätze
              </p>
              {parkingSpots.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openNavigation(p)}
                  className="flex items-center gap-3 w-full rounded-md bg-muted/30 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-500 text-white text-xs font-bold shrink-0">
                    P
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    {p.description && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {p.description}
                      </p>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs shrink-0">
                    Navigation ›
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button className="flex-1 h-11 font-semibold" onClick={onStartSession}>
              ▶ Session starten
            </Button>
            {sessions.length > 0 && (
              <Button
                variant="outline"
                className="h-11"
                onClick={() => router.push(`/klettersteig/${route.id}`)}
              >
                📊 Details
              </Button>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
