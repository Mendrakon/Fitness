"use client";

import { useCallback } from "react";
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
};

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS
  );

  const update = useCallback(
    (updates: Partial<AppSettings>) => {
      setSettings(prev => ({ ...prev, ...updates }));
    },
    [setSettings]
  );

  return { settings, update };
}
