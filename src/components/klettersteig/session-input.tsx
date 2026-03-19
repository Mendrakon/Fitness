"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  KLETTERSTEIG_DIFFICULTY_COLORS,
  WEATHER_LABELS,
  WEATHER_ICONS,
  WIND_LABELS,
} from "@/lib/types";
import type {
  KlettersteigRoute,
  KlettersteigWeather,
  WeatherCondition,
  WindStrength,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const WEATHER_CONDITIONS: WeatherCondition[] = ["sunny", "cloudy", "rainy", "windy", "cold"];
const WIND_OPTIONS: WindStrength[] = ["calm", "light", "moderate", "strong"];

interface SessionInputProps {
  route: KlettersteigRoute;
  onStart: (extraWeightKg: number, weather: KlettersteigWeather) => void;
  onBack: () => void;
}

export function SessionInput({ route, onStart, onBack }: SessionInputProps) {
  const [weight, setWeight] = useState("");
  const [condition, setCondition] = useState<WeatherCondition>("sunny");
  const [temperature, setTemperature] = useState("");
  const [wind, setWind] = useState<WindStrength>("calm");

  const handleStart = () => {
    onStart(weight ? parseFloat(weight) : 0, {
      condition,
      temperature: temperature ? parseFloat(temperature) : null,
      wind,
    });
    // Reset
    setWeight("");
    setTemperature("");
    setCondition("sunny");
    setWind("calm");
  };

  return (
    <div className="flex flex-col px-4 pt-5 pb-28 gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          ← Zurück
        </button>
      </div>

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
          <h2 className="font-semibold">{route.name}</h2>
          <p className="text-xs text-muted-foreground">Session vorbereiten</p>
        </div>
      </div>

      {/* Extra Weight */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase">
          Zusatzgewicht (kg)
        </label>
        <Input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="h-11 text-lg font-bold text-center"
        />
      </div>

      {/* Weather Condition */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase">
          Wetter
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {WEATHER_CONDITIONS.map((c) => (
            <button
              key={c}
              onClick={() => setCondition(c)}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                condition === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {WEATHER_ICONS[c]} {WEATHER_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase">
          Temperatur (°C)
        </label>
        <Input
          type="number"
          inputMode="decimal"
          placeholder="–"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          className="h-10 text-center"
        />
      </div>

      {/* Wind */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase">
          Wind
        </label>
        <div className="flex gap-1.5">
          {WIND_OPTIONS.map((w) => (
            <button
              key={w}
              onClick={() => setWind(w)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors text-center",
                wind === w
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {WIND_LABELS[w]}
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <Button className="w-full h-12 text-base font-bold" onClick={handleStart}>
        🏔️ Los geht&apos;s!
      </Button>
    </div>
  );
}
