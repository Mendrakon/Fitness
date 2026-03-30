"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter
} from "@/components/ui/drawer";
import { PageHeader } from "@/components/layout/page-header";
import { useExercises } from "@/hooks/use-exercises";
import { useWorkouts } from "@/hooks/use-workouts";
import {
  MUSCLE_GROUP_LABELS, CATEGORY_LABELS,
  type MuscleGroup, type ExerciseCategory
} from "@/lib/types";
import { estimate1RM, exerciseVolume } from "@/lib/calculations";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Trophy, TrendingUp, Dumbbell, Calendar, BarChart3, Pencil, Trash2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const muscleGroups: MuscleGroup[] = [
  "chest", "back", "shoulders", "biceps", "triceps", "quads",
  "hamstrings", "glutes", "calves", "core", "forearms", "full_body", "cardio",
];

export default function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getById, updateExercise, deleteExercise } = useExercises();
  const { getForExercise } = useWorkouts();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<ExerciseCategory>("barbell");
  const [editMuscle, setEditMuscle] = useState<MuscleGroup>("chest");

  const exercise = getById(id);
  const workoutsWithExercise = getForExercise(id);

  interface RecordsData {
    bestWeight: { weight: number; reps: number; date: string } | null;
    bestVolume: { volume: number; date: string } | null;
    best1RM: { value: number; date: string } | null;
    bestByReps: Record<number, { weight: number; date: string }>;
  }

  const records: RecordsData | null = useMemo((): RecordsData | null => {
    if (!workoutsWithExercise.length) return null;
    const result: RecordsData = { bestWeight: null, bestVolume: null, best1RM: null, bestByReps: {} };
    workoutsWithExercise.forEach(w => {
      const we = w.exercises.find(e => e.exerciseId === id);
      if (!we) return;
      we.sets.forEach(s => {
        if (!s.completed || s.tag === "warmup" || !s.weight || !s.reps) return;
        if (!result.bestWeight || s.weight > result.bestWeight.weight) {
          result.bestWeight = { weight: s.weight, reps: s.reps, date: w.startTime };
        }
        const vol = s.weight * s.reps;
        if (!result.bestVolume || vol > result.bestVolume.volume) {
          result.bestVolume = { volume: vol, date: w.startTime };
        }
        if (s.reps <= 12) {
          const rm = estimate1RM(s.weight, s.reps);
          if (!result.best1RM || rm > result.best1RM.value) {
            result.best1RM = { value: rm, date: w.startTime };
          }
        }
        if (s.reps <= 12) {
          if (!result.bestByReps[s.reps] || s.weight > result.bestByReps[s.reps].weight) {
            result.bestByReps[s.reps] = { weight: s.weight, date: w.startTime };
          }
        }
      });
    });
    return result;
  }, [workoutsWithExercise, id]);

  // Chart data
  const chartData = useMemo(() => {
    return [...workoutsWithExercise]
      .reverse()
      .map(w => {
        const we = w.exercises.find(e => e.exerciseId === id);
        if (!we) return null;

        const volume = exerciseVolume(we.sets);
        let best1rm = 0;
        we.sets.forEach(s => {
          if (!s.completed || s.tag === "warmup" || !s.weight || !s.reps) return;
          if (s.reps <= 12) {
            const rm = estimate1RM(s.weight, s.reps);
            if (rm > best1rm) best1rm = rm;
          }
        });

        return {
          date: format(new Date(w.startTime), "d.M.", { locale: de }),
          volume,
          est1RM: best1rm || undefined,
        };
      })
      .filter(Boolean);
  }, [workoutsWithExercise, id]);

  const openEdit = () => {
    setEditName(exercise!.name);
    setEditCategory(exercise!.category);
    setEditMuscle(exercise!.muscleGroup);
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!editName.trim()) return;
    updateExercise(id, {
      name: editName.trim(),
      category: editCategory,
      muscleGroup: editMuscle,
      equipment: CATEGORY_LABELS[editCategory],
    });
    setEditOpen(false);
  };

  const handleDelete = () => {
    deleteExercise(id);
    router.back();
  };

  if (!exercise) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Übung nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={exercise.name}
        showBack
        rightAction={
          exercise.isCustom ? (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={openEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ) : undefined
        }
      />

      <Tabs defaultValue="info" className="px-4 pt-3">
        <TabsList className="w-full">
          <TabsTrigger value="info" className="flex-1 text-xs">Info</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 text-xs">Verlauf</TabsTrigger>
          <TabsTrigger value="records" className="flex-1 text-xs">Rekorde</TabsTrigger>
          <TabsTrigger value="charts" className="flex-1 text-xs">Charts</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
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

        {/* History Tab */}
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

        {/* Records Tab */}
        <TabsContent value="records" className="mt-3 space-y-3">
          {!records || (!records.bestWeight && !records.best1RM) ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Trophy className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Noch keine Rekorde</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {records.bestWeight ? (
                  <Card>
                    <CardContent className="py-3 text-center">
                      <Dumbbell className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold">{records.bestWeight.weight} kg</p>
                      <p className="text-[10px] text-muted-foreground">
                        Bestes Gewicht ({records.bestWeight.reps} Wdh)
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
                {records.best1RM ? (
                  <Card>
                    <CardContent className="py-3 text-center">
                      <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold">{records.best1RM.value} kg</p>
                      <p className="text-[10px] text-muted-foreground">Geschätzte 1RM</p>
                    </CardContent>
                  </Card>
                ) : null}
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

        {/* Charts Tab */}
        <TabsContent value="charts" className="mt-3 mb-4 space-y-4">
          {chartData.length < 2 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Mindestens 2 Workouts nötig für Charts
              </p>
            </div>
          ) : (
            <>
              {/* Volume Chart */}
              <Card>
                <CardContent className="py-3">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">
                    Volumen (kg)
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        className="text-muted-foreground"
                        width={45}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "hsl(var(--primary))" }}
                        name="Volumen"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 1RM Chart */}
              {chartData.some(d => d && "est1RM" in d && d.est1RM) && (
                <Card>
                  <CardContent className="py-3">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">
                      Geschätzte 1RM (kg)
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          className="text-muted-foreground"
                          width={45}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="est1RM"
                          stroke="hsl(var(--chart-5))"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "hsl(var(--chart-5))" }}
                          name="Est. 1RM"
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Drawer */}
      <Drawer open={editOpen} onOpenChange={setEditOpen} repositionInputs={false}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Übung bearbeiten</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Übungsname..."
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={editCategory} onValueChange={v => setEditCategory(v as ExerciseCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as ExerciseCategory[]).map(c => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Muskelgruppe</Label>
              <Select value={editMuscle} onValueChange={v => setEditMuscle(v as MuscleGroup)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {muscleGroups.map(g => (
                    <SelectItem key={g} value={g}>{MUSCLE_GROUP_LABELS[g]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSave} disabled={!editName.trim()}>Speichern</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Drawer */}
      <Drawer open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Übung löschen?</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <p className="text-sm text-muted-foreground">
              „{exercise.name}" wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
          <DrawerFooter>
            <Button variant="destructive" onClick={handleDelete}>Löschen</Button>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Abbrechen</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
