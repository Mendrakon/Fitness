import type { Workout, WorkoutSet, AppSettings, PREvent, PRMetric } from "./types";
import { estimate1RM, exerciseVolume } from "./calculations";

interface BestSet {
  weight: number;
  reps: number;
  volume: number;
  estimated1rm: number;
}

function getBestSet(sets: WorkoutSet[]): BestSet | null {
  // Allow bodyweight exercises (weight = 0 or null), only require reps > 0
  const workingSets = sets.filter(
    (s) => s.completed && s.tag !== "warmup" && s.reps != null && s.reps > 0
  );
  if (workingSets.length === 0) return null;

  let bestWeight = 0;
  let bestReps = 0;
  let best1RM = 0;
  let bestWeightSet: WorkoutSet = workingSets[0];

  for (const s of workingSets) {
    const w = s.weight ?? 0;
    const r = s.reps!;
    const e1rm = w > 0 ? estimate1RM(w, r) : 0;

    if (w > bestWeight || (w === bestWeight && r > bestReps)) {
      bestWeight = w;
      bestReps = r;
      bestWeightSet = s;
    }
    if (e1rm > best1RM) {
      best1RM = e1rm;
    }
  }

  return {
    weight: bestWeightSet.weight ?? 0,
    reps: bestWeightSet.reps!,
    volume: exerciseVolume(sets),
    estimated1rm: best1RM,
  };
}

function getPreviousBest(
  exerciseId: string,
  currentWorkoutId: string,
  previousWorkouts: Workout[]
): BestSet | null {
  // Aggregate best across ALL previous completed workouts
  let bestWeight = 0;
  let bestReps = 0;
  let bestVolume = 0;
  let best1RM = 0;
  let found = false;

  for (const w of previousWorkouts) {
    if (w.id === currentWorkoutId || !w.endTime) continue;
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;

    const best = getBestSet(ex.sets);
    if (!best) continue;
    found = true;

    if (best.weight > bestWeight || (best.weight === bestWeight && best.reps > bestReps)) {
      bestWeight = best.weight;
      bestReps = best.reps;
    }
    if (best.volume > bestVolume) bestVolume = best.volume;
    if (best.estimated1rm > best1RM) best1RM = best.estimated1rm;
  }

  if (!found) return null;
  return { weight: bestWeight, reps: bestReps, volume: bestVolume, estimated1rm: best1RM };
}

export function detectPRs(
  workout: Workout,
  previousWorkouts: Workout[],
  settings: AppSettings
): PREvent[] {
  const events: PREvent[] = [];

  // Fallback defaults in case settings are missing PR threshold fields
  const thresholdWeight = settings.prThresholdWeight ?? 2.5;
  const thresholdReps = settings.prThresholdReps ?? 1;
  const thresholdVolPct = settings.prThresholdVolumePercent ?? 5;
  const threshold1RMPct = settings.prThreshold1RMPercent ?? 2;

  for (const ex of workout.exercises) {
    const current = getBestSet(ex.sets);
    if (!current) continue;

    const previous = getPreviousBest(ex.exerciseId, workout.id, previousWorkouts);

    // First workout for this exercise — initial PR
    if (!previous) {
      if (current.weight > 0) {
        events.push(makePREvent(ex.exerciseId, workout, "weight", current.weight, 0, current));
      } else {
        // Bodyweight exercise: track reps as the primary PR
        events.push(makePREvent(ex.exerciseId, workout, "reps", current.reps, 0, current));
      }
      continue;
    }

    // Weight PR
    if (current.weight >= previous.weight + thresholdWeight) {
      events.push(
        makePREvent(ex.exerciseId, workout, "weight", current.weight, previous.weight, current)
      );
    }

    // Reps PR (at same or higher weight)
    if (
      current.weight >= previous.weight &&
      current.reps >= previous.reps + thresholdReps
    ) {
      events.push(
        makePREvent(ex.exerciseId, workout, "reps", current.reps, previous.reps, current)
      );
    }

    // Volume PR
    const volThreshold = previous.volume * (1 + thresholdVolPct / 100);
    if (current.volume >= volThreshold && previous.volume > 0) {
      events.push(
        makePREvent(ex.exerciseId, workout, "volume", current.volume, previous.volume, current)
      );
    }

    // Estimated 1RM PR
    const e1rmThreshold = previous.estimated1rm * (1 + threshold1RMPct / 100);
    if (current.estimated1rm >= e1rmThreshold && previous.estimated1rm > 0) {
      events.push(
        makePREvent(
          ex.exerciseId,
          workout,
          "estimated1rm",
          current.estimated1rm,
          previous.estimated1rm,
          current
        )
      );
    }
  }

  return events;
}

/**
 * Scans all existing workouts chronologically and generates PR events.
 * Used to backfill PRs for workouts completed before PR detection was added.
 */
export function backfillPRs(workouts: Workout[], settings: AppSettings): PREvent[] {
  const sorted = [...workouts]
    .filter((w) => w.endTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const allEvents: PREvent[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const workout = sorted[i];
    // Only pass workouts BEFORE the current one as "previous"
    const previous = sorted.slice(0, i);
    const prs = detectPRs(workout, previous, settings);
    allEvents.push(...prs);
  }

  return allEvents;
}

function makePREvent(
  exerciseId: string,
  workout: Workout,
  metric: PRMetric,
  newValue: number,
  oldValue: number,
  current: BestSet
): PREvent {
  const diff = Math.round((newValue - oldValue) * 100) / 100;
  const diffPercent = oldValue > 0 ? Math.round((diff / oldValue) * 1000) / 10 : 100;
  return {
    id: `${workout.id}-${exerciseId}-${metric}`,
    exerciseId,
    date: workout.startTime,
    workoutId: workout.id,
    metric,
    newValue,
    oldValue,
    diff,
    diffPercent,
    weight: current.weight,
    reps: current.reps,
    volume: current.volume,
    estimated1rm: current.estimated1rm,
  };
}
