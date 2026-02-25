"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { backfillPRs } from "@/lib/pr-detection";
import type { Workout, AppSettings, PREvent, PRMetric } from "@/lib/types";

const BACKFILL_DONE_KEY = "fitness-pr-backfill-done";

function runBackfillIfNeeded(
  workouts: Workout[],
  settings: AppSettings,
  setPrEvents: (value: PREvent[] | ((prev: PREvent[]) => PREvent[])) => void
) {
  if (localStorage.getItem(BACKFILL_DONE_KEY)) return;

  const completedWorkouts = workouts.filter((w) => w.endTime);
  if (completedWorkouts.length === 0) return;

  localStorage.setItem(BACKFILL_DONE_KEY, "1");

  const events = backfillPRs(workouts, settings);
  if (events.length > 0) {
    const raw = localStorage.getItem(STORAGE_KEYS.PR_EVENTS);
    const existing: PREvent[] = raw ? JSON.parse(raw) : [];
    const existingIds = new Set(existing.map((e) => e.id));
    const newEvents = events.filter((e) => !existingIds.has(e.id));
    const merged = [...newEvents, ...existing];
    localStorage.setItem(STORAGE_KEYS.PR_EVENTS, JSON.stringify(merged));
    setPrEvents(merged);
  }
}

export function usePersonalRecords(
  workouts?: Workout[],
  settings?: AppSettings
) {
  const [prEvents, setPrEvents] = useLocalStorage<PREvent[]>(STORAGE_KEYS.PR_EVENTS, []);
  const didBackfill = useRef(false);

  // One-time backfill on mount
  useEffect(() => {
    if (didBackfill.current) return;
    if (!workouts || !settings) return;
    didBackfill.current = true;
    runBackfillIfNeeded(workouts, settings, setPrEvents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workouts?.length]);

  const sorted = useMemo(
    () => [...prEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [prEvents]
  );

  const addPREvents = useCallback(
    (events: PREvent[]) => {
      if (events.length === 0) return;
      setPrEvents((prev) => {
        const existing = new Set(prev.map((e) => e.id));
        const newEvents = events.filter((e) => !existing.has(e.id));
        return [...newEvents, ...prev];
      });
    },
    [setPrEvents]
  );

  const getForExercise = useCallback(
    (exerciseId: string) => sorted.filter((e) => e.exerciseId === exerciseId),
    [sorted]
  );

  const getRecent = useCallback(
    (limit: number) => sorted.slice(0, limit),
    [sorted]
  );

  const getTimeline = useCallback(
    (exerciseId: string, metric: PRMetric) =>
      sorted
        .filter((e) => e.exerciseId === exerciseId && e.metric === metric)
        .reverse(),
    [sorted]
  );

  return {
    prEvents: sorted,
    addPREvents,
    getForExercise,
    getRecent,
    getTimeline,
  };
}
