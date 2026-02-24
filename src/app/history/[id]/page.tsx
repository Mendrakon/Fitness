"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Save, Clock, Dumbbell, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { useWorkouts } from "@/hooks/use-workouts";
import { useTemplates } from "@/hooks/use-templates";
import { useExercises } from "@/hooks/use-exercises";
import { formatDurationFromDates, exerciseVolume } from "@/lib/calculations";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";

export default function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getById, deleteWorkout } = useWorkouts();
  const { saveWorkoutAsTemplate } = useTemplates();
  const { getById: getExercise } = useExercises();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const workout = getById(id);

  if (!workout) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Workout nicht gefunden</p>
      </div>
    );
  }

  const totalVolume = workout.exercises.reduce(
    (sum, ex) => sum + exerciseVolume(ex.sets),
    0
  );
  const totalSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
    0
  );

  const handleDelete = () => {
    deleteWorkout(id);
    toast.success("Workout gelöscht");
    router.push("/history");
  };

  const handleSaveAsTemplate = () => {
    saveWorkoutAsTemplate(workout, workout.name);
    toast.success("Als Vorlage gespeichert");
  };

  return (
    <div className="flex flex-col gap-0">
      <PageHeader title={workout.name} showBack />

      <div className="px-4 py-3 space-y-4">
        {/* Summary */}
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground mb-2">
              {format(new Date(workout.startTime), "EEEE, d. MMMM yyyy · HH:mm", { locale: de })}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <Clock className="h-4 w-4 text-primary mx-auto mb-0.5" />
                <p className="text-sm font-bold">
                  {formatDurationFromDates(workout.startTime, workout.endTime)}
                </p>
                <p className="text-[10px] text-muted-foreground">Dauer</p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-4 w-4 text-primary mx-auto mb-0.5" />
                <p className="text-sm font-bold">{totalVolume.toLocaleString("de-DE")} kg</p>
                <p className="text-[10px] text-muted-foreground">Volumen</p>
              </div>
              <div className="text-center">
                <Dumbbell className="h-4 w-4 text-primary mx-auto mb-0.5" />
                <p className="text-sm font-bold">{totalSets}</p>
                <p className="text-[10px] text-muted-foreground">Sets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {workout.notes && (
          <Card>
            <CardContent className="py-2.5">
              <p className="text-xs text-muted-foreground mb-1">Notizen</p>
              <p className="text-sm">{workout.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Exercises */}
        {workout.exercises.map(we => {
          const exercise = getExercise(we.exerciseId);
          if (!exercise) return null;

          return (
            <Card key={we.id}>
              <CardHeader className="py-2.5 px-3 bg-muted/30">
                <p className="font-semibold text-sm text-primary">{exercise.name}</p>
              </CardHeader>
              <CardContent className="p-0 px-3 pb-2 pt-1">
                {we.notes && (
                  <p className="text-xs text-muted-foreground italic mb-1">{we.notes}</p>
                )}
                <div className="space-y-0.5">
                  {we.sets.map((set, i) => (
                    <div
                      key={set.id}
                      className="flex items-center gap-2 text-sm py-0.5"
                    >
                      <span className="text-muted-foreground w-5 text-right text-xs">
                        {i + 1}
                      </span>
                      {set.completed ? (
                        <span className="font-medium">
                          {set.weight ?? 0} kg × {set.reps ?? 0}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Nicht abgeschlossen</span>
                      )}
                      {set.tag && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1">
                          {set.tag === "warmup" ? "W" : set.tag === "dropset" ? "D" : "F"}
                        </Badge>
                      )}
                      {set.rpe && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1">
                          RPE {set.rpe}
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
        })}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleSaveAsTemplate}>
            <Save className="mr-2 h-4 w-4" /> Als Vorlage
          </Button>
          <Button
            variant="outline"
            className="text-destructive border-destructive/30"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workout löschen?</DialogTitle>
            <DialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
