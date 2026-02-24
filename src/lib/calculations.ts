import type { WorkoutSet } from "./types";

export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  if (reps > 12) return weight;
  return Math.round(weight * (36 / (37 - reps)) * 10) / 10;
}

export function setVolume(weight: number | null, reps: number | null): number {
  if (!weight || !reps) return 0;
  return weight * reps;
}

export function exerciseVolume(sets: WorkoutSet[]): number {
  return sets
    .filter(s => s.completed && s.tag !== "warmup" && s.weight && s.reps)
    .reduce((sum, s) => sum + (s.weight! * s.reps!), 0);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDurationFromDates(start: string, end: string | null): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diffSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
  return formatDuration(Math.max(0, diffSeconds));
}

export function totalWorkoutVolume(sets: WorkoutSet[]): number {
  return sets
    .filter(s => s.completed && s.tag !== "warmup" && s.weight && s.reps)
    .reduce((sum, s) => sum + (s.weight! * s.reps!), 0);
}

export function totalCompletedSets(sets: WorkoutSet[]): number {
  return sets.filter(s => s.completed).length;
}
