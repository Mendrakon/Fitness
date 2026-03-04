"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { backfillPRs } from "@/lib/pr-detection";
import type { Workout, AppSettings, PREvent, PRMetric } from "@/lib/types";

type DbEvent = {
  id: string;
  exercise_id: string;
  workout_id: string;
  date: string;
  metric: string;
  new_value: number;
  old_value: number;
  diff: number;
  diff_percent: number;
  weight: number;
  reps: number;
  volume: number;
  estimated_1rm: number;
};

function toEvent(row: DbEvent): PREvent {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    workoutId: row.workout_id,
    date: row.date,
    metric: row.metric as PRMetric,
    newValue: row.new_value,
    oldValue: row.old_value,
    diff: row.diff,
    diffPercent: row.diff_percent,
    weight: row.weight,
    reps: row.reps,
    volume: row.volume,
    estimated1rm: row.estimated_1rm,
  };
}

function toRow(event: PREvent, userId: string) {
  return {
    id: event.id,
    user_id: userId,
    exercise_id: event.exerciseId,
    workout_id: event.workoutId,
    date: event.date,
    metric: event.metric,
    new_value: event.newValue,
    old_value: event.oldValue,
    diff: event.diff,
    diff_percent: event.diffPercent,
    weight: event.weight,
    reps: event.reps,
    volume: event.volume,
    estimated_1rm: event.estimated1rm,
  };
}

export function usePersonalRecords(workouts?: Workout[], settings?: AppSettings) {
  const [prEvents, setPrEvents] = useState<PREvent[]>([]);
  const [loading, setLoading] = useState(true);
  const didBackfill = useRef(false);

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      client
        .from("pr_events")
        .select("*")
        .order("date", { ascending: false })
        .then(({ data }) => {
          if (data) setPrEvents(data.map(toEvent));
          setLoading(false);
        });
    });
  }, []);

  const addPREvents = useCallback(async (events: PREvent[]) => {
    if (events.length === 0) return;
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    await client.from("pr_events").upsert(events.map(e => toRow(e, user.id)));

    setPrEvents(prev => {
      const existing = new Set(prev.map(e => e.id));
      const newEvents = events.filter(e => !existing.has(e.id));
      return [...newEvents, ...prev];
    });
  }, []);

  // One-time backfill: if user has workouts but no PRs yet, generate them
  useEffect(() => {
    if (loading) return;
    if (didBackfill.current) return;
    if (!workouts?.length || !settings) return;
    didBackfill.current = true;

    if (prEvents.length > 0) return;

    const events = backfillPRs(workouts, settings);
    if (events.length > 0) {
      addPREvents(events);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, workouts?.length]);

  const sorted = useMemo(
    () => [...prEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [prEvents]
  );

  const getForExercise = useCallback(
    (exerciseId: string) => sorted.filter(e => e.exerciseId === exerciseId),
    [sorted]
  );

  const getRecent = useCallback(
    (limit: number) => sorted.slice(0, limit),
    [sorted]
  );

  const getTimeline = useCallback(
    (exerciseId: string, metric: PRMetric) =>
      sorted.filter(e => e.exerciseId === exerciseId && e.metric === metric).reverse(),
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
