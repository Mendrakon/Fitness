"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { MuscleHeatmap } from "@/components/muscle-heatmap";
import { useWorkouts } from "@/hooks/use-workouts";
import { useKlettersteigSessions } from "@/hooks/use-klettersteig-sessions";
import { useKlettersteigRoutes } from "@/hooks/use-klettersteig-routes";
import { Skeleton } from "@/components/ui/skeleton";
import { useExercises } from "@/hooks/use-exercises";
import { formatDurationFromDates } from "@/lib/calculations";
import { formatKlettersteigTime, KLETTERSTEIG_DIFFICULTY_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type HistoryItem =
  | { type: "workout"; id: string; startTime: string; data: ReturnType<typeof useWorkouts>["workouts"][0] }
  | { type: "klettersteig"; id: string; startTime: string; data: ReturnType<typeof useKlettersteigSessions>["sessions"][0] };

export default function HistoryPage() {
  const router = useRouter();
  const { workouts, loading } = useWorkouts();
  const { getById: getExercise } = useExercises();
  const { sessions: klettersteigSessions, loading: ksLoading } = useKlettersteigSessions();
  const { getById: getRoute } = useKlettersteigRoutes();

  const completedWorkouts = workouts.filter(w => w.endTime);
  const completedKS = klettersteigSessions.filter(s => s.endTime);

  const getMuscleGroup = useCallback(
    (exerciseId: string) => getExercise(exerciseId)?.muscleGroup,
    [getExercise]
  );

  const allItems: HistoryItem[] = useMemo(() => {
    const items: HistoryItem[] = [
      ...completedWorkouts.map((w): HistoryItem => ({ type: "workout", id: w.id, startTime: w.startTime, data: w })),
      ...completedKS.map((s): HistoryItem => ({ type: "klettersteig", id: s.id, startTime: s.startTime, data: s })),
    ];
    items.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return items;
  }, [completedWorkouts, completedKS]);

  const grouped = useMemo(() => {
    const map = new Map<string, HistoryItem[]>();
    allItems.forEach(item => {
      const key = format(new Date(item.startTime), "MMMM yyyy", { locale: de });
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    });
    return map;
  }, [allItems]);

  if (loading || ksLoading) {
    return (
      <div className="flex flex-col gap-0">
        <PageHeader title="Verlauf" />
        <div className="px-4 py-3 space-y-4">
          {/* Heatmap skeleton */}
          <Skeleton className="h-48 w-full rounded-xl" />
          {/* Month group skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            {[0, 1].map(i => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      <PageHeader title="Verlauf" />

      <div className="px-4 py-3">
        <MuscleHeatmap
          workouts={completedWorkouts}
          getMuscleGroup={getMuscleGroup}
        />

        {allItems.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="font-semibold mb-1">Noch kein Verlauf</h3>
            <p className="text-sm text-muted-foreground">
              Schließe dein erstes Workout oder deine erste Klettersteig-Session ab.
            </p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([month, items]) => (
            <div key={month} className="mb-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {month}
              </h3>
              <div className="space-y-2">
                {items.map(item => {
                  if (item.type === "klettersteig") {
                    const s = item.data as typeof klettersteigSessions[0];
                    const route = getRoute(s.routeId);
                    return (
                      <Card
                        key={s.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/klettersteig/session/${s.id}`)}
                      >
                        <CardContent className="flex items-center gap-3 py-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-xs shrink-0",
                              route ? KLETTERSTEIG_DIFFICULTY_COLORS[route.difficulty] : "bg-muted"
                            )}
                          >
                            {route?.difficulty ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-sm truncate">{route?.name ?? "Route"}</p>
                              <Badge variant="outline" className="text-[10px] h-4 px-1">Klettersteig</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(s.startTime), "EEE, d. MMM · HH:mm", { locale: de })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatKlettersteigTime(s.durationSeconds)}
                              {s.extraWeightKg > 0 && ` · ${s.extraWeightKg} kg`}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </CardContent>
                      </Card>
                    );
                  }

                  const w = item.data as typeof completedWorkouts[0];
                  const totalVolume = w.exercises.reduce((sum, ex) => {
                    return sum + ex.sets
                      .filter(s => s.completed && s.tag !== "warmup" && s.weight && s.reps)
                      .reduce((s, set) => s + (set.weight! * set.reps!), 0);
                  }, 0);

                  return (
                    <Card
                      key={w.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/history/${w.id}`)}
                    >
                      <CardContent className="flex items-center gap-3 py-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <Dumbbell className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{w.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(w.startTime), "EEE, d. MMM · HH:mm", { locale: de })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {w.exercises.length} Übungen
                            {" · "}
                            {formatDurationFromDates(w.startTime, w.endTime)}
                            {totalVolume > 0 && ` · ${totalVolume.toLocaleString("de-DE")} kg`}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
