"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { AppSettings } from "@/lib/types";

const DEFAULT_SETTINGS: AppSettings = {
  weightUnit: "kg",
  defaultRestTimerWork: 120,
  defaultRestTimerWarmup: 90,
  restTimerSound: true,
  restTimerAutoStart: true,
  showPreviousValues: true,
  theme: "system",
  prThresholdWeight: 2.5,
  prThresholdReps: 1,
  prThresholdVolumePercent: 5,
  prThreshold1RMPercent: 2,
};

export function useSettings() {
  const [stored, setSettings] = useLocalStorage<AppSettings>(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS
  );

  // Always merge with defaults so new fields are never undefined
  const settings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...stored }),
    [stored]
  );

  const update = useCallback(
    (updates: Partial<AppSettings>) => {
      setSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev, ...updates }));
    },
    [setSettings]
  );

  return { settings, update };
}
