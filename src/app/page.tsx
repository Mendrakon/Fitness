"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Dumbbell, Clock, TrendingUp, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useActiveWorkout } from "@/contexts/active-workout-context";
import { useWorkouts } from "@/hooks/use-workouts";
import { useTemplates } from "@/hooks/use-templates";
import { useExercises } from "@/hooks/use-exercises";
import { formatDurationFromDates } from "@/lib/calculations";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function HomePage() {
  const router = useRouter();
  const { activeWorkout, startEmptyWorkout, elapsedSeconds } = useActiveWorkout();
  const { workouts } = useWorkouts();
  const { templates } = useTemplates();
  const { getById: getExercise } = useExercises();

  const completedWorkouts = workouts.filter(w => w.endTime);
  const recentWorkouts = completedWorkouts.slice(0, 5);

  // Stats
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  const workoutsThisWeek = completedWorkouts.filter(
    w => new Date(w.startTime) >= weekStart
  ).length;

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">FeetTrack</h1>
        <p className="text-sm text-muted-foreground">
          {format(now, "EEEE, d. MMMM", { locale: de })}
        </p>
      </div>

      {/* Active Workout Banner */}
      {activeWorkout && (
        <Card
          className="cursor-pointer border-green-500/50 bg-green-500/10"
          onClick={() => router.push("/workout")}
        >
          <CardContent className="flex items-center gap-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-700">{activeWorkout.name}</p>
              <p className="text-sm text-green-600">
                {activeWorkout.exercises.length} Übungen &middot; Läuft
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-green-600" />
          </CardContent>
        </Card>
      )}

      {/* Quick Start */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Schnellstart
        </h2>
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={() => {
            if (!activeWorkout) startEmptyWorkout();
            router.push("/workout");
          }}
        >
          <Plus className="mr-2 h-5 w-5" />
          {activeWorkout ? "Workout fortsetzen" : "Leeres Workout starten"}
        </Button>
        {templates.length > 0 && (
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => router.push("/templates")}
          >
            <Dumbbell className="mr-2 h-4 w-4" />
            Aus Vorlage starten
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center py-3 px-2">
            <Flame className="h-5 w-5 text-primary mb-1" />
            <p className="text-xl font-bold">{workoutsThisWeek}</p>
            <p className="text-[10px] text-muted-foreground text-center">Diese Woche</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-3 px-2">
            <TrendingUp className="h-5 w-5 text-primary mb-1" />
            <p className="text-xl font-bold">{completedWorkouts.length}</p>
            <p className="text-[10px] text-muted-foreground text-center">Gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-3 px-2">
            <Dumbbell className="h-5 w-5 text-primary mb-1" />
            <p className="text-xl font-bold">{templates.length}</p>
            <p className="text-[10px] text-muted-foreground text-center">Vorlagen</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Letzte Workouts
            </h2>
            <Link href="/history" className="text-xs text-primary font-medium">
              Alle anzeigen
            </Link>
          </div>
          <div className="space-y-2">
            {recentWorkouts.map(w => (
              <Card key={w.id} className="cursor-pointer" onClick={() => router.push(`/history/${w.id}`)}>
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{w.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(w.startTime), "d. MMM yyyy", { locale: de })}
                      {" · "}
                      {w.exercises.length} Übungen
                      {w.endTime && ` · ${formatDurationFromDates(w.startTime, w.endTime)}`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {completedWorkouts.length === 0 && !activeWorkout && (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Dumbbell className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Bereit loszulegen?</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Starte dein erstes Workout oder erstelle eine Vorlage für deine Trainingsroutine.
          </p>
        </div>
      )}
    </div>
  );
}
