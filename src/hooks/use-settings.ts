"use client";

import { useCallback, useMemo, useEffect } from "react";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { createClient } from "@/lib/supabase";
import type { AppSettings } from "@/lib/types";

const DEFAULT_SETTINGS: AppSettings = {
  weightUnit: "kg",
  defaultRestTimerWork: 120,
  defaultRestTimerWarmup: 90,
  restTimerSound: true,
  restTimerAutoStart: true,
  restTimerNotification: true,
  showPreviousValues: true,
  theme: "system",
  accentColor: "blue",
  prThresholdWeight: 2.5,
  prThresholdReps: 1,
  prThresholdVolumePercent: 5,
  prThreshold1RMPercent: 2,
};

async function syncSettingsToDB(settings: AppSettings) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ settings }).eq("id", user.id);
  } catch {
    // silently fail – settings are still saved locally
  }
}

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

  // On mount: load settings from DB and merge (DB takes priority over local)
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("profiles")
          .select("settings")
          .eq("id", user.id)
          .single();
        if (data?.settings) {
          setSettings(prev => ({
            ...DEFAULT_SETTINGS,
            ...prev,
            ...(data.settings as Partial<AppSettings>),
          }));
        }
      } catch {
        // silently fail – use local settings
      }
    };
    loadFromDB();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback(
    (updates: Partial<AppSettings>) => {
      setSettings(prev => {
        const next = { ...DEFAULT_SETTINGS, ...prev, ...updates };
        syncSettingsToDB(next);
        return next;
      });
    },
    [setSettings]
  );

  return { settings, update };
}
