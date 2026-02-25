"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ChevronLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePersonalRecords } from "@/hooks/use-personal-records";
import { useExercises } from "@/hooks/use-exercises";
import { PR_METRIC_LABELS, MUSCLE_GROUP_LABELS, formatPRDiff } from "@/lib/types";
import type { MuscleGroup } from "@/lib/types";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function PersonalRecordsPage() {
  const router = useRouter();
  const { prEvents } = usePersonalRecords();
  const { getById: getExercise, exercises } = useExercises();
  const [filterExerciseId, setFilterExerciseId] = useState<string | null>(null);
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | null>(null);

  // Get unique exercises that have PRs
  const exercisesWithPRs = useMemo(() => {
    const ids = [...new Set(prEvents.map((e) => e.exerciseId))];
    return ids.map((id) => getExercise(id)).filter(Boolean);
  }, [prEvents, getExercise]);

  // Get unique muscle groups from PR exercises
  const muscleGroups = useMemo(() => {
    const groups = new Set(exercisesWithPRs.map((e) => e!.muscleGroup));
    return [...groups];
  }, [exercisesWithPRs]);

  const filtered = useMemo(() => {
    let result = prEvents;
    if (filterExerciseId) {
      result = result.filter((e) => e.exerciseId === filterExerciseId);
    }
    if (filterMuscle) {
      result = result.filter((e) => {
        const ex = getExercise(e.exerciseId);
        return ex?.muscleGroup === filterMuscle;
      });
    }
    return result;
  }, [prEvents, filterExerciseId, filterMuscle, getExercise]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Personal Records</h1>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-1.5">
        {/* Muscle group chips */}
        {muscleGroups.map((mg) => (
          <button
            key={mg}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              filterMuscle === mg
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            onClick={() => {
              setFilterMuscle(filterMuscle === mg ? null : mg);
              setFilterExerciseId(null);
            }}
          >
            {MUSCLE_GROUP_LABELS[mg]}
          </button>
        ))}
      </div>

      {/* Exercise filter chips (if muscle group selected) */}
      {filterMuscle && (
        <div className="flex flex-wrap gap-1.5">
          {exercisesWithPRs
            .filter((e) => e!.muscleGroup === filterMuscle)
            .map((e) => (
              <button
                key={e!.id}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterExerciseId === e!.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                onClick={() =>
                  setFilterExerciseId(filterExerciseId === e!.id ? null : e!.id)
                }
              >
                {e!.name}
              </button>
            ))}
        </div>
      )}

      {/* PR Feed */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
            <Trophy className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Keine Personal Records</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Beende Workouts, um deine ersten PRs zu setzen.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((pr) => {
            const exercise = getExercise(pr.exerciseId);
            const diffLabel = formatPRDiff(pr);
            return (
              <Card
                key={pr.id}
                className="cursor-pointer"
                onClick={() => router.push(`/personal-records/${pr.exerciseId}`)}
              >
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {exercise?.name ?? "Übung"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(pr.date), "d. MMM yyyy", { locale: de })}
                      {" · "}
                      {pr.weight > 0 ? `${pr.weight} kg × ${pr.reps}` : `${pr.reps} Wdh`}
                      {" · "}
                      {PR_METRIC_LABELS[pr.metric]}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-xs font-semibold text-yellow-700 bg-yellow-500/10"
                  >
                    {diffLabel}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
