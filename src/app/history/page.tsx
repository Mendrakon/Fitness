"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { useWorkouts } from "@/hooks/use-workouts";
import { useExercises } from "@/hooks/use-exercises";
import { formatDurationFromDates } from "@/lib/calculations";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function HistoryPage() {
  const router = useRouter();
  const { workouts } = useWorkouts();
  const { getById: getExercise } = useExercises();

  const completedWorkouts = workouts.filter(w => w.endTime);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof completedWorkouts>();
    completedWorkouts.forEach(w => {
      const key = format(new Date(w.startTime), "MMMM yyyy", { locale: de });
      const list = map.get(key) || [];
      list.push(w);
      map.set(key, list);
    });
    return map;
  }, [completedWorkouts]);

  return (
    <div className="flex flex-col gap-0">
      <PageHeader title="Verlauf" />

      <div className="px-4 py-3">
        {completedWorkouts.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="font-semibold mb-1">Noch kein Verlauf</h3>
            <p className="text-sm text-muted-foreground">
              Schließe dein erstes Workout ab, um es hier zu sehen.
            </p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([month, ws]) => (
            <div key={month} className="mb-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {month}
              </h3>
              <div className="space-y-2">
                {ws.map(w => {
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
