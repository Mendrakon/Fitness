"use client";

import { createContext, useContext, useCallback, useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { Workout, WorkoutExercise, WorkoutSet, SetTag, RPE, Template } from "@/lib/types";

interface ActiveWorkoutContextValue {
  activeWorkout: Workout | null;
  startEmptyWorkout: () => void;
  startFromTemplate: (template: Template) => void;
  finishWorkout: () => Workout | null;
  discardWorkout: () => void;
  addExercise: (exerciseId: string) => void;
  removeExercise: (exerciseInstanceId: string) => void;
  reorderExercises: (exerciseIds: string[]) => void;
  updateSet: (exerciseInstanceId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  addSet: (exerciseInstanceId: string) => void;
  removeSet: (exerciseInstanceId: string, setId: string) => void;
  toggleSetComplete: (exerciseInstanceId: string, setId: string) => boolean;
  setSetTag: (exerciseInstanceId: string, setId: string, tag: SetTag) => void;
  setSetRpe: (exerciseInstanceId: string, setId: string, rpe: RPE) => void;
  updateExerciseNotes: (exerciseInstanceId: string, notes: string) => void;
  updateWorkoutNotes: (notes: string) => void;
  updateWorkoutName: (name: string) => void;
  elapsedSeconds: number;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContextValue | null>(null);

export function ActiveWorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useLocalStorage<Workout | null>(
    STORAGE_KEYS.ACTIVE_WORKOUT,
    null
  );
  const [elapsedSeconds, setElapsedSeconds] = useLocalStorage<number>("fitness-elapsed", 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeWorkout) {
      const updateElapsed = () => {
        const start = new Date(activeWorkout.startTime).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - start) / 1000));
      };
      updateElapsed();
      intervalRef.current = setInterval(updateElapsed, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      setElapsedSeconds(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [activeWorkout?.startTime, !!activeWorkout, setElapsedSeconds]);

  const mutate = useCallback(
    (fn: (w: Workout) => Workout) => {
      setActiveWorkout(prev => (prev ? fn(prev) : prev));
    },
    [setActiveWorkout]
  );

  const startEmptyWorkout = useCallback(() => {
    const workout: Workout = {
      id: uuid(),
      name: "Workout",
      templateId: null,
      startTime: new Date().toISOString(),
      endTime: null,
      exercises: [],
      notes: "",
    };
    setActiveWorkout(workout);
  }, [setActiveWorkout]);

  const startFromTemplate = useCallback(
    (template: Template) => {
      const exercises: WorkoutExercise[] = template.exercises.map(te => ({
        id: uuid(),
        exerciseId: te.exerciseId,
        sets: te.sets.map(ts => ({
          id: uuid(),
          weight: ts.weight,
          reps: ts.reps,
          completed: false,
          tag: ts.tag,
          rpe: ts.rpe,
        })),
        notes: te.notes,
        supersetGroupId: te.supersetGroupId,
      }));
      const workout: Workout = {
        id: uuid(),
        name: template.name,
        templateId: template.id,
        startTime: new Date().toISOString(),
        endTime: null,
        exercises,
        notes: template.notes,
      };
      setActiveWorkout(workout);
    },
    [setActiveWorkout]
  );

  const finishWorkout = useCallback(() => {
    if (!activeWorkout) return null;
    const finished = { ...activeWorkout, endTime: new Date().toISOString() };
    setActiveWorkout(null);
    return finished;
  }, [activeWorkout, setActiveWorkout]);

  const discardWorkout = useCallback(() => {
    setActiveWorkout(null);
  }, [setActiveWorkout]);

  const addExercise = useCallback(
    (exerciseId: string) => {
      mutate(w => ({
        ...w,
        exercises: [
          ...w.exercises,
          {
            id: uuid(),
            exerciseId,
            sets: [{ id: uuid(), weight: null, reps: null, completed: false, tag: null, rpe: null }],
            notes: "",
          },
        ],
      }));
    },
    [mutate]
  );

  const removeExercise = useCallback(
    (exerciseInstanceId: string) => {
      mutate(w => ({
        ...w,
        exercises: w.exercises.filter(e => e.id !== exerciseInstanceId),
      }));
    },
    [mutate]
  );

  const reorderExercises = useCallback(
    (exerciseIds: string[]) => {
      mutate(w => {
        const map = new Map(w.exercises.map(e => [e.id, e]));
        return {
          ...w,
          exercises: exerciseIds.map(id => map.get(id)!).filter(Boolean),
        };
      });
    },
    [mutate]
  );

  const updateSet = useCallback(
    (exerciseInstanceId: string, setId: string, updates: Partial<WorkoutSet>) => {
      mutate(w => ({
        ...w,
        exercises: w.exercises.map(e =>
          e.id === exerciseInstanceId
            ? { ...e, sets: e.sets.map(s => (s.id === setId ? { ...s, ...updates } : s)) }
            : e
        ),
      }));
    },
    [mutate]
  );

  const addSet = useCallback(
    (exerciseInstanceId: string) => {
      mutate(w => ({
        ...w,
        exercises: w.exercises.map(e =>
          e.id === exerciseInstanceId
            ? {
                ...e,
                sets: [
                  ...e.sets,
                  { id: uuid(), weight: null, reps: null, completed: false, tag: null, rpe: null },
                ],
              }
            : e
        ),
      }));
    },
    [mutate]
  );

  const removeSet = useCallback(
    (exerciseInstanceId: string, setId: string) => {
      mutate(w => ({
        ...w,
        exercises: w.exercises.map(e =>
          e.id === exerciseInstanceId
            ? { ...e, sets: e.sets.filter(s => s.id !== setId) }
            : e
        ),
      }));
    },
    [mutate]
  );

  const toggleSetComplete = useCallback(
    (exerciseInstanceId: string, setId: string): boolean => {
      let nowComplete = false;
      mutate(w => ({
        ...w,
        exercises: w.exercises.map(e =>
          e.id === exerciseInstanceId
            ? {
                ...e,
                sets: e.sets.map(s => {
                  if (s.id === setId) {
                    nowComplete = !s.completed;
                    return { ...s, completed: !s.completed };
                  }
                  return s;
                }),
              }
            : e
        ),
      }));
      return nowComplete;
    },
    [mutate]
  );

  const setSetTag = useCallback(
    (exerciseInstanceId: string, setId: string, tag: SetTag) => {
      updateSet(exerciseInstanceId, setId, { tag });
    },
    [updateSet]
  );

  const setSetRpe = useCallback(
    (exerciseInstanceId: string, setId: string, rpe: RPE) => {
      updateSet(exerciseInstanceId, setId, { rpe });
    },
    [updateSet]
  );

  const updateExerciseNotes = useCallback(
    (exerciseInstanceId: string, notes: string) => {
      mutate(w => ({
        ...w,
        exercises: w.exercises.map(e =>
          e.id === exerciseInstanceId ? { ...e, notes } : e
        ),
      }));
    },
    [mutate]
  );

  const updateWorkoutNotes = useCallback(
    (notes: string) => {
      mutate(w => ({ ...w, notes }));
    },
    [mutate]
  );

  const updateWorkoutName = useCallback(
    (name: string) => {
      mutate(w => ({ ...w, name }));
    },
    [mutate]
  );

  return (
    <ActiveWorkoutContext.Provider
      value={{
        activeWorkout,
        startEmptyWorkout,
        startFromTemplate,
        finishWorkout,
        discardWorkout,
        addExercise,
        removeExercise,
        reorderExercises,
        updateSet,
        addSet,
        removeSet,
        toggleSetComplete,
        setSetTag,
        setSetRpe,
        updateExerciseNotes,
        updateWorkoutNotes,
        updateWorkoutName,
        elapsedSeconds,
      }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export function useActiveWorkout() {
  const context = useContext(ActiveWorkoutContext);
  if (!context) throw new Error("useActiveWorkout must be used within ActiveWorkoutProvider");
  return context;
}
