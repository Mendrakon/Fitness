"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { Workout } from "@/lib/types";

export function useWorkouts() {
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>(STORAGE_KEYS.WORKOUTS, []);

  const getById = useCallback(
    (id: string) => workouts.find(w => w.id === id),
    [workouts]
  );

  const save = useCallback(
    (workout: Workout) => {
      setWorkouts(prev => {
        const exists = prev.find(w => w.id === workout.id);
        if (exists) {
          return prev.map(w => (w.id === workout.id ? workout : w));
        }
        return [workout, ...prev];
      });
    },
    [setWorkouts]
  );

  const deleteWorkout = useCallback(
    (id: string) => {
      setWorkouts(prev => prev.filter(w => w.id !== id));
    },
    [setWorkouts]
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
    getById,
    save,
    deleteWorkout,
    getForExercise,
    getLastForExercise,
  };
}
