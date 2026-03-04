"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { BUILT_IN_EXERCISES } from "@/lib/exercise-seed";
import { createClient } from "@/lib/supabase";
import type { Exercise, MuscleGroup } from "@/lib/types";

// ── DB ↔ Exercise converters ──────────────────────────────────────────────────

type ExerciseRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  muscle_group: string;
  equipment: string;
  pinned_note: string | null;
  rest_work: number | null;
  rest_warmup: number | null;
};

function toRow(ex: Exercise, userId: string): ExerciseRow {
  return {
    id: ex.id,
    user_id: userId,
    name: ex.name,
    category: ex.category,
    muscle_group: ex.muscleGroup,
    equipment: ex.equipment,
    pinned_note: ex.pinnedNote ?? null,
    rest_work: ex.defaultRestTimerWork ?? null,
    rest_warmup: ex.defaultRestTimerWarmup ?? null,
  };
}

function fromRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Exercise["category"],
    muscleGroup: row.muscle_group as Exercise["muscleGroup"],
    equipment: row.equipment ?? "",
    isCustom: true,
    pinnedNote: row.pinned_note ?? undefined,
    defaultRestTimerWork: row.rest_work ?? undefined,
    defaultRestTimerWarmup: row.rest_warmup ?? undefined,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useExercises() {
  const [customExercises, setCustomExercises] = useLocalStorage<Exercise[]>(
    STORAGE_KEYS.CUSTOM_EXERCISES,
    []
  );

  // Ref so the mount effect can read the current localStorage value
  // without it being a reactive dependency (avoids infinite loop).
  const customExercisesRef = useRef(customExercises);
  customExercisesRef.current = customExercises;

  // On mount: load from Supabase and replace localStorage cache.
  // Also migrates any existing localStorage-only exercises up to Supabase.
  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const { data: rows } = await client
        .from("custom_exercises")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!rows) return;

      const fromDb = rows.map(fromRow);
      const dbIds = new Set(fromDb.map((e) => e.id));

      // Upload any exercises that only exist in localStorage
      const localOnly = customExercisesRef.current.filter((e) => !dbIds.has(e.id));
      if (localOnly.length > 0) {
        await client
          .from("custom_exercises")
          .upsert(localOnly.map((e) => toRow(e, user.id)));
      }

      setCustomExercises([...fromDb, ...localOnly]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allExercises = useMemo(
    () => [...BUILT_IN_EXERCISES, ...customExercises],
    [customExercises]
  );

  const getById = useCallback(
    (id: string) => allExercises.find((e) => e.id === id),
    [allExercises]
  );

  const getByMuscleGroup = useCallback(
    (group: MuscleGroup) => allExercises.filter((e) => e.muscleGroup === group),
    [allExercises]
  );

  const search = useCallback(
    (query: string) => {
      const q = query.toLowerCase();
      return allExercises.filter(
        (e) => e.name.toLowerCase().includes(q) || e.equipment.toLowerCase().includes(q)
      );
    },
    [allExercises]
  );

  const createCustom = useCallback(
    async (
      exercise: Omit<Exercise, "id" | "isCustom">,
      options?: { throwOnError?: boolean }
    ) => {
      const newExercise: Exercise = { ...exercise, id: uuid(), isCustom: true };

      // Optimistic local update
      setCustomExercises((prev) => [...prev, newExercise]);

      // Persist to Supabase
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const { error } = await client.from("custom_exercises").insert(toRow(newExercise, user.id));
        if (error) {
          // Roll back optimistic insert if DB write failed
          setCustomExercises((prev) => prev.filter((e) => e.id !== newExercise.id));
          if (options?.throwOnError) throw error;
        }
      } else if (options?.throwOnError) {
        setCustomExercises((prev) => prev.filter((e) => e.id !== newExercise.id));
        throw new Error("Not authenticated");
      }

      return newExercise;
    },
    [setCustomExercises]
  );

  const updateExercise = useCallback(
    async (id: string, updates: Partial<Exercise>) => {
      // Optimistic local update
      setCustomExercises((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );

      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) return;

      const dbUpdates: Partial<ExerciseRow> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.muscleGroup !== undefined) dbUpdates.muscle_group = updates.muscleGroup;
      if (updates.equipment !== undefined) dbUpdates.equipment = updates.equipment;
      if (updates.pinnedNote !== undefined) dbUpdates.pinned_note = updates.pinnedNote;
      if (updates.defaultRestTimerWork !== undefined) dbUpdates.rest_work = updates.defaultRestTimerWork;
      if (updates.defaultRestTimerWarmup !== undefined) dbUpdates.rest_warmup = updates.defaultRestTimerWarmup;

      await client
        .from("custom_exercises")
        .update(dbUpdates)
        .eq("id", id)
        .eq("user_id", user.id);
    },
    [setCustomExercises]
  );

  const deleteExercise = useCallback(
    async (id: string) => {
      // Optimistic local update
      setCustomExercises((prev) => prev.filter((e) => e.id !== id));

      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        await client
          .from("custom_exercises")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);
      }
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
