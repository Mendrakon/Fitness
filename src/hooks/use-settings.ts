"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { createClient } from "@/lib/supabase";
import type { AppSettings } from "@/lib/types";

const DEFAULT_SETTINGS: AppSettings = {
  weightUnit: "kg",
  defaultRestTimerWork: 120,
  defaultRestTimerWarmup: 90,
  restTimerAutoStart: true,
  restTimerNotification: true,
  showPreviousValues: true,
  theme: "system",
  accentColor: "blue",
  accentStrength: 100,
  prThresholdWeight: 2.5,
  prThresholdReps: 1,
  prThresholdVolumePercent: 5,
  prThreshold1RMPercent: 2,
};

function normalizeSettings(settings?: Partial<AppSettings> | null): AppSettings {
  return {
    weightUnit: settings?.weightUnit ?? DEFAULT_SETTINGS.weightUnit,
    defaultRestTimerWork: settings?.defaultRestTimerWork ?? DEFAULT_SETTINGS.defaultRestTimerWork,
    defaultRestTimerWarmup: settings?.defaultRestTimerWarmup ?? DEFAULT_SETTINGS.defaultRestTimerWarmup,
    restTimerAutoStart: settings?.restTimerAutoStart ?? DEFAULT_SETTINGS.restTimerAutoStart,
    restTimerNotification: settings?.restTimerNotification ?? DEFAULT_SETTINGS.restTimerNotification,
    showPreviousValues: settings?.showPreviousValues ?? DEFAULT_SETTINGS.showPreviousValues,
    theme: settings?.theme ?? DEFAULT_SETTINGS.theme,
    accentColor: settings?.accentColor ?? DEFAULT_SETTINGS.accentColor,
    accentStrength: settings?.accentStrength ?? DEFAULT_SETTINGS.accentStrength,
    prThresholdWeight: settings?.prThresholdWeight ?? DEFAULT_SETTINGS.prThresholdWeight,
    prThresholdReps: settings?.prThresholdReps ?? DEFAULT_SETTINGS.prThresholdReps,
    prThresholdVolumePercent: settings?.prThresholdVolumePercent ?? DEFAULT_SETTINGS.prThresholdVolumePercent,
    prThreshold1RMPercent: settings?.prThreshold1RMPercent ?? DEFAULT_SETTINGS.prThreshold1RMPercent,
  };
}

async function syncSettingsToDB(settings: AppSettings) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ settings }).eq("id", user.id);
  } catch {
    // Settings remain available locally if sync fails.
  }
}

export function useSettings() {
  const [stored, setSettings] = useLocalStorage<AppSettings>(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS
  );

  const settings = useMemo(
    () => normalizeSettings(stored),
    [stored]
  );

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
          setSettings(prev => normalizeSettings({
            ...prev,
            ...(data.settings as Partial<AppSettings>),
          }));
        }
      } catch {
        // Fall back to local settings.
      }
    };

    loadFromDB();
  }, [setSettings]);

  const update = useCallback(
    (updates: Partial<AppSettings>) => {
      setSettings(prev => {
        const next = normalizeSettings({ ...prev, ...updates });
        syncSettingsToDB(next);
        return next;
      });
    },
    [setSettings]
  );

  return { settings, update };
}
