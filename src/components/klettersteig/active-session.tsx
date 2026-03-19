"use client";

import { Button } from "@/components/ui/button";
import {
  KLETTERSTEIG_DIFFICULTY_COLORS,
  WEATHER_ICONS,
  formatKlettersteigTime,
} from "@/lib/types";
import type { KlettersteigRoute } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ActiveSessionProps {
  route: KlettersteigRoute;
  elapsedSeconds: number;
  extraWeightKg: number;
  weatherCondition: string;
  temperature: number | null;
  bestTime: number | null;
  onFinish: () => void;
}

export function ActiveSession({
  route,
  elapsedSeconds,
  extraWeightKg,
  weatherCondition,
  temperature,
  bestTime,
  onFinish,
}: ActiveSessionProps) {
  const weatherIcon = WEATHER_ICONS[weatherCondition as keyof typeof WEATHER_ICONS] ?? "🌤️";
  const isBelowBest = bestTime !== null && elapsedSeconds < bestTime;
  const timeDiff = bestTime !== null ? bestTime - elapsedSeconds : null;

  return (
    <div className="flex flex-col items-center px-4 pt-8 pb-28 gap-6">
      {/* Route header */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Aktive Session</p>
        <h1 className="text-2xl font-bold mt-1">{route.name}</h1>
        <span
          className={cn(
            "inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white",
            KLETTERSTEIG_DIFFICULTY_COLORS[route.difficulty]
          )}
        >
          {route.difficulty}
        </span>
      </div>

      {/* Big Timer */}
      <div className="text-center">
        <p className="text-6xl font-bold tabular-nums font-mono text-green-500">
          {formatKlettersteigTime(elapsedSeconds)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Laufzeit</p>
      </div>

      {/* Session Info */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Zusatzgewicht</p>
          <p className="text-lg font-bold">{extraWeightKg} kg</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Wetter</p>
          <p className="text-lg font-bold">
            {weatherIcon} {temperature !== null ? `${temperature}°C` : "–"}
          </p>
        </div>
      </div>

      {/* Best time comparison */}
      {bestTime !== null && (
        <div className="rounded-lg bg-muted/50 p-3 text-center w-full max-w-xs">
          <p className="text-xs text-muted-foreground">
            Deine Bestzeit:{" "}
            <span className="text-green-500 font-semibold">
              {formatKlettersteigTime(bestTime)}
            </span>
          </p>
          {timeDiff !== null && timeDiff > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {isBelowBest
                ? `Noch ${formatKlettersteigTime(timeDiff)} unter Bestzeit 💪`
                : `${formatKlettersteigTime(Math.abs(timeDiff))} über Bestzeit`}
            </p>
          )}
        </div>
      )}

      {/* Stop Button */}
      <Button
        variant="destructive"
        className="w-full max-w-xs h-14 text-lg font-bold"
        onClick={onFinish}
      >
        ⏹ Session beenden
      </Button>
    </div>
  );
}
