"use client";

import { use, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { useExercises } from "@/hooks/use-exercises";
import { useWorkouts } from "@/hooks/use-workouts";
import { MUSCLE_GROUP_LABELS, CATEGORY_LABELS } from "@/lib/types";
import { estimate1RM, exerciseVolume } from "@/lib/calculations";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Trophy, TrendingUp, Dumbbell, Calendar } from "lucide-react";

export default function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getById } = useExercises();
  const { getForExercise } = useWorkouts();

  const exercise = getById(id);
  const workoutsWithExercise = getForExercise(id);

  const records = useMemo(() => {
    if (!workoutsWithExercise.length) return null;

    let bestWeight: { weight: number; reps: number; date: string } | null = null;
    let bestVolume: { volume: number; date: string } | null = null;
    let best1RM: { value: number; date: string } | null = null;
    const bestByReps: Record<number, { weight: number; date: string }> = {};

    workoutsWithExercise.forEach(w => {
      const we = w.exercises.find(e => e.exerciseId === id);
      if (!we) return;

      we.sets.forEach(s => {
        if (!s.completed || s.tag === "warmup" || !s.weight || !s.reps) return;

        if (!bestWeight || s.weight > bestWeight.weight) {
          bestWeight = { weight: s.weight, reps: s.reps, date: w.startTime };
        }

        const vol = s.weight * s.reps;
        if (!bestVolume || vol > bestVolume.volume) {
          bestVolume = { volume: vol, date: w.startTime };
        }

        if (s.reps <= 12) {
          const rm = estimate1RM(s.weight, s.reps);
          if (!best1RM || rm > best1RM.value) {
            best1RM = { value: rm, date: w.startTime };
          }
        }

        if (s.reps <= 12) {
          if (!bestByReps[s.reps] || s.weight > bestByReps[s.reps].weight) {
            bestByReps[s.reps] = { weight: s.weight, date: w.startTime };
          }
        }
      });
    });

    return { bestWeight, bestVolume, best1RM, bestByReps };
  }, [workoutsWithExercise, id]);

  if (!exercise) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Übung nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={exercise.name} showBack />

      <Tabs defaultValue="info" className="px-4 pt-3">
        <TabsList className="w-full">
          <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">Verlauf</TabsTrigger>
          <TabsTrigger value="records" className="flex-1">Rekorde</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-3 space-y-3">
          <Card>
            <CardContent className="py-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kategorie</span>
                <Badge variant="outline">{CATEGORY_LABELS[exercise.category]}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Muskelgruppe</span>
                <Badge variant="outline">{MUSCLE_GROUP_LABELS[exercise.muscleGroup]}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Equipment</span>
                <span className="text-sm font-medium">{exercise.equipment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Trainiert</span>
                <span className="text-sm font-medium">{workoutsWithExercise.length}x</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-3 space-y-2">
          {workoutsWithExercise.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Noch keine Einträge</p>
            </div>
          ) : (
            workoutsWithExercise.map(w => {
              const we = w.exercises.find(e => e.exerciseId === id);
              if (!we) return null;
              return (
                <Card key={w.id}>
                  <CardContent className="py-2.5">
                    <p className="text-xs text-muted-foreground mb-1.5">
                      {format(new Date(w.startTime), "d. MMM yyyy", { locale: de })}
                    </p>
                    <div className="space-y-0.5">
                      {we.sets.filter(s => s.completed).map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground w-5 text-right text-xs">{i + 1}</span>
                          <span className="font-medium">
                            {s.weight ?? 0} kg × {s.reps ?? 0}
                          </span>
                          {s.tag && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                              {s.tag === "warmup" ? "W" : s.tag === "dropset" ? "D" : "F"}
                            </Badge>
                          )}
                          {s.rpe && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                              RPE {s.rpe}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vol: {exerciseVolume(we.sets).toLocaleString("de-DE")} kg
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="records" className="mt-3 space-y-3">
          {!records || !records.bestWeight ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Trophy className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Noch keine Rekorde</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {records.bestWeight && (
                  <Card>
                    <CardContent className="py-3 text-center">
                      <Dumbbell className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold">{records.bestWeight.weight} kg</p>
                      <p className="text-[10px] text-muted-foreground">
                        Bestes Gewicht ({records.bestWeight.reps} Wdh)
                      </p>
                    </CardContent>
                  </Card>
                )}
                {records.best1RM && (
                  <Card>
                    <CardContent className="py-3 text-center">
                      <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold">{records.best1RM.value} kg</p>
                      <p className="text-[10px] text-muted-foreground">Geschätzte 1RM</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {Object.keys(records.bestByReps).length > 0 && (
                <Card>
                  <CardContent className="py-3">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                      Bestes Gewicht pro Wiederholung
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(reps => {
                        const record = records.bestByReps[reps];
                        if (!record) return null;
                        return (
                          <div key={reps} className="text-center">
                            <p className="text-xs text-muted-foreground">{reps} Wdh</p>
                            <p className="text-sm font-bold">{record.weight}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
