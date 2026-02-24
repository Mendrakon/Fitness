"use client";

import { useCallback, useMemo } from "react";
import { v4 as uuid } from "uuid";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { BUILT_IN_EXERCISES } from "@/lib/exercise-seed";
import type { Exercise, MuscleGroup } from "@/lib/types";

export function useExercises() {
  const [customExercises, setCustomExercises] = useLocalStorage<Exercise[]>(
    STORAGE_KEYS.CUSTOM_EXERCISES,
    []
  );

  const allExercises = useMemo(
    () => [...BUILT_IN_EXERCISES, ...customExercises],
    [customExercises]
  );

  const getById = useCallback(
    (id: string) => allExercises.find(e => e.id === id),
    [allExercises]
  );

  const getByMuscleGroup = useCallback(
    (group: MuscleGroup) => allExercises.filter(e => e.muscleGroup === group),
    [allExercises]
  );

  const search = useCallback(
    (query: string) => {
      const q = query.toLowerCase();
      return allExercises.filter(
        e => e.name.toLowerCase().includes(q) || e.equipment.toLowerCase().includes(q)
      );
    },
    [allExercises]
  );

  const createCustom = useCallback(
    (exercise: Omit<Exercise, "id" | "isCustom">) => {
      const newExercise: Exercise = { ...exercise, id: uuid(), isCustom: true };
      setCustomExercises(prev => [...prev, newExercise]);
      return newExercise;
    },
    [setCustomExercises]
  );

  const updateExercise = useCallback(
    (id: string, updates: Partial<Exercise>) => {
      setCustomExercises(prev =>
        prev.map(e => (e.id === id ? { ...e, ...updates } : e))
      );
    },
    [setCustomExercises]
  );

  const deleteExercise = useCallback(
    (id: string) => {
      setCustomExercises(prev => prev.filter(e => e.id !== id));
    },
    [setCustomExercises]
  );

  return {
    exercises: allExercises,
    customExercises,
    getById,
    getByMuscleGroup,
    search,
    createCustom,
    updateExercise,
    deleteExercise,
  };
}
