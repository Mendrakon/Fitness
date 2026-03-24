"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { Workout } from "@/lib/types";

type DbWorkout = {
  id: string;
  name: string;
  template_id: string | null;
  start_time: string;
  end_time: string | null;
  exercises: Workout["exercises"];
  notes: string;
};

function toWorkout(row: DbWorkout): Workout {
  return {
    id: row.id,
    name: row.name,
    templateId: row.template_id,
    startTime: row.start_time,
    endTime: row.end_time,
    exercises: row.exercises,
    notes: row.notes,
  };
}

function toRow(workout: Workout, userId: string) {
  return {
    id: workout.id,
    user_id: userId,
    name: workout.name,
    template_id: workout.templateId,
    start_time: workout.startTime,
    end_time: workout.endTime,
    exercises: workout.exercises,
    notes: workout.notes,
  };
}

function getPendingWorkouts(): Workout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_WORKOUTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToPending(workout: Workout) {
  const pending = getPendingWorkouts();
  const exists = pending.some(w => w.id === workout.id);
  if (!exists) {
    localStorage.setItem(
      STORAGE_KEYS.PENDING_WORKOUTS,
      JSON.stringify([...pending, workout])
    );
  }
}

function removeFromPending(id: string) {
  const pending = getPendingWorkouts().filter(w => w.id !== id);
  localStorage.setItem(STORAGE_KEYS.PENDING_WORKOUTS, JSON.stringify(pending));
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      client
        .from("workouts")
        .select("*")
        .order("start_time", { ascending: false })
        .then(async ({ data }) => {
          const fromDb: Workout[] = data ? data.map(toWorkout) : [];

          // Sync any workouts that were saved offline
          const pending = getPendingWorkouts();
          if (pending.length > 0) {
            const synced: string[] = [];
            for (const workout of pending) {
              const { error } = await client
                .from("workouts")
                .upsert(toRow(workout, user.id));
              if (!error) {
                synced.push(workout.id);
              }
            }
            synced.forEach(removeFromPending);

            // Remaining pending = workouts that still couldn't be synced
            const dbIds = new Set(fromDb.map(w => w.id));
            const remainingPending = getPendingWorkouts();
            const offlineOnly = remainingPending.filter(w => !dbIds.has(w.id));

            setWorkouts([...offlineOnly, ...fromDb]);
          } else {
            setWorkouts(fromDb);
          }

          setLoading(false);
        });
    });
  }, []);

  const getById = useCallback(
    (id: string) => workouts.find(w => w.id === id),
    [workouts]
  );

  const save = useCallback(
    async (workout: Workout) => {
      // Update local state immediately (works offline too)
      setWorkouts(prev => {
        const exists = prev.find(w => w.id === workout.id);
        if (exists) return prev.map(w => (w.id === workout.id ? workout : w));
        return [workout, ...prev];
      });

      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) return;

      const { error } = await client
        .from("workouts")
        .upsert(toRow(workout, user.id));

      if (error) {
        // Offline or error: queue for later sync
        addToPending(workout);
      }
    },
    []
  );

  const deleteWorkout = useCallback(
    async (id: string) => {
      const client = createClient();
      await client.from("workouts").delete().eq("id", id);
      removeFromPending(id);
      setWorkouts(prev => prev.filter(w => w.id !== id));
    },
    []
  );

  const getForExercise = useCallback(
    (exerciseId: string) =>
      workouts
        .filter(w => w.endTime && w.exercises.some(e => e.exerciseId === exerciseId))
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [workouts]
  );

  const getLastForExercise = useCallback(
    (exerciseId: string) => {
      const sorted = workouts
        .filter(w => w.endTime && w.exercises.some(e => e.exerciseId === exerciseId))
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      if (!sorted.length) return null;
      const workout = sorted[0];
      return workout.exercises.find(e => e.exerciseId === exerciseId) || null;
    },
    [workouts]
  );

  return {
    workouts: workouts.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    ),
    loading,
    getById,
    save,
    deleteWorkout,
    getForExercise,
    getLastForExercise,
  };
}
