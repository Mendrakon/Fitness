"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, GripVertical, Trash2, MoreVertical, Check, MessageSquare,
  ChevronDown, ChevronUp, Link2, Unlink, Minus, SkipForward, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useActiveWorkout } from "@/contexts/active-workout-context";
import { useTimer } from "@/contexts/timer-context";
import { useWorkouts } from "@/hooks/use-workouts";
import { useTemplates } from "@/hooks/use-templates";
import { useExercises } from "@/hooks/use-exercises";
import { useSettings } from "@/hooks/use-settings";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { formatDuration } from "@/lib/calculations";
import { detectPRs } from "@/lib/pr-detection";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { PR_METRIC_LABELS, formatPRDiff } from "@/lib/types";
import type { SetTag, RPE, WorkoutExercise, PREvent, Workout } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TAG_CYCLE: SetTag[] = [null, "warmup", "dropset", "failure"];
const TAG_LABELS: Record<string, { label: string; color: string }> = {
  warmup: { label: "W", color: "bg-yellow-500 text-white" },
  dropset: { label: "D", color: "bg-purple-500 text-white" },
  failure: { label: "F", color: "bg-red-500 text-white" },
};

const RPE_VALUES: RPE[] = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

export default function WorkoutPage() {
  const router = useRouter();
  const {
    activeWorkout, startEmptyWorkout, finishWorkout, discardWorkout,
    addExercise, removeExercise, reorderExercises, updateSet, addSet, removeSet,
    toggleSetComplete, setSetTag, setSetRpe, updateExerciseNotes,
    updateWorkoutNotes, updateWorkoutName, toggleSuperset, elapsedSeconds,
  } = useActiveWorkout();
  const { startTimer, timeRemaining, totalDuration, isRunning, activeExerciseId, activeSetId, skipTimer, addTime, setVisible } = useTimer();
  const { workouts, save, getLastForExercise } = useWorkouts();
  const { saveWorkoutAsTemplate } = useTemplates();
  const { getById: getExercise } = useExercises();
  const { settings } = useSettings();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [showWorkoutNotes, setShowWorkoutNotes] = useState(false);

  if (!activeWorkout) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 px-6 pt-24">
        <div className="flex flex-col items-center gap-2 text-center">
          <Plus className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-xl font-bold">Kein aktives Workout</h2>
          <p className="text-sm text-muted-foreground">
            Starte ein leeres Workout oder wähle eine Vorlage auf der Startseite.
          </p>
        </div>
        <Button className="w-full max-w-xs h-12 text-base font-semibold" onClick={startEmptyWorkout}>
          Leeres Workout starten
        </Button>
      </div>
    );
  }

  const handleFinish = () => {
    const finished = finishWorkout();
    if (finished) {
      save(finished);

      // PR Detection — read workouts directly from localStorage for reliability
      let allWorkouts: Workout[] = [];
      try {
        allWorkouts = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.WORKOUTS) || "[]"
        );
      } catch { /* empty */ }

      const prs = detectPRs(finished, allWorkouts, settings);
      if (prs.length > 0) {
        try {
          const existing: PREvent[] = JSON.parse(
            localStorage.getItem(STORAGE_KEYS.PR_EVENTS) || "[]"
          );
          const existingIds = new Set(existing.map((e) => e.id));
          const newPrs = prs.filter((e) => !existingIds.has(e.id));
          if (newPrs.length > 0) {
            localStorage.setItem(
              STORAGE_KEYS.PR_EVENTS,
              JSON.stringify([...newPrs, ...existing])
            );
          }
        } catch {
          localStorage.setItem(STORAGE_KEYS.PR_EVENTS, JSON.stringify(prs));
        }

        for (const pr of prs) {
          const exName = getExercise(pr.exerciseId)?.name ?? "Übung";
          toast.success(`🏆 Neuer PR: ${exName}`, {
            description: `${PR_METRIC_LABELS[pr.metric]}: ${formatPRDiff(pr)}`,
            duration: 5000,
          });
        }
      }

      if (saveAsTemplate && templateName.trim()) {
        saveWorkoutAsTemplate(finished, templateName.trim());
        toast.success("Workout gespeichert & Vorlage erstellt");
      } else {
        toast.success("Workout gespeichert!");
      }
    }
    setFinishDialogOpen(false);
    // Small delay to let toasts render before navigating
    setTimeout(() => router.push("/"), 100);
  };

  const handleDiscard = () => {
    discardWorkout();
    setDiscardDialogOpen(false);
    router.push("/");
  };

  const handleToggleSet = (exerciseInstanceId: string, setId: string) => {
    // Check current state BEFORE toggling
    const exercise = activeWorkout.exercises.find(e => e.id === exerciseInstanceId);
    const set = exercise?.sets.find(s => s.id === setId);
    const wasCompleted = set?.completed ?? false;

    toggleSetComplete(exerciseInstanceId, setId);

    // If we just completed the set (was not completed before), start timer
    if (!wasCompleted && settings.restTimerAutoStart) {
      const timerDuration =
        set?.tag === "warmup" ? settings.defaultRestTimerWarmup : settings.defaultRestTimerWork;
      startTimer(timerDuration, exerciseInstanceId, setId);
    }
    // If unchecking, stop timer for this set
    if (wasCompleted) {
      if (activeExerciseId === exerciseInstanceId && activeSetId === setId) {
        skipTimer();
      }
    }
  };

  const handleCycleTag = (exerciseInstanceId: string, setId: string, currentTag: SetTag) => {
    const idx = TAG_CYCLE.indexOf(currentTag);
    const nextTag = TAG_CYCLE[(idx + 1) % TAG_CYCLE.length];
    setSetTag(exerciseInstanceId, setId, nextTag);
  };

  const handleAddExercises = (exerciseIds: string[]) => {
    exerciseIds.forEach(id => addExercise(id));
  };

  // Drag & Drop reorder via simple move up/down
  const handleMoveExercise = (index: number, direction: "up" | "down") => {
    const exercises = activeWorkout.exercises;
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= exercises.length) return;
    const ids = exercises.map(e => e.id);
    [ids[index], ids[newIdx]] = [ids[newIdx], ids[index]];
    reorderExercises(ids);
  };

  // Get previous values for an exercise
  const getPreviousSets = (exerciseId: string) => {
    if (!settings.showPreviousValues) return null;
    const prev = getLastForExercise(exerciseId);
    return prev?.sets.filter(s => s.completed) ?? null;
  };

  // Superset color map: assign a color per supersetGroupId
  const supersetColors: Record<string, string> = {};
  const colorPalette = [
    "border-blue-500", "border-green-500", "border-orange-500",
    "border-purple-500", "border-pink-500", "border-cyan-500",
  ];
  let colorIdx = 0;
  activeWorkout.exercises.forEach(e => {
    if (e.supersetGroupId && !supersetColors[e.supersetGroupId]) {
      supersetColors[e.supersetGroupId] = colorPalette[colorIdx % colorPalette.length];
      colorIdx++;
    }
  });

  // Check if exercise is in superset with the next exercise
  const isLinkedWithNext = (idx: number) => {
    const curr = activeWorkout.exercises[idx];
    const next = activeWorkout.exercises[idx + 1];
    return curr?.supersetGroupId && next?.supersetGroupId === curr.supersetGroupId;
  };

  return (
    <div className="flex flex-col gap-3 px-4 pt-2 pb-4">
      {/* Top Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            value={activeWorkout.name}
            onChange={e => updateWorkoutName(e.target.value)}
            className="h-8 border-0 px-0 text-lg font-bold shadow-none focus-visible:ring-0"
          />
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatDuration(elapsedSeconds)}
          </p>
        </div>
        <Button variant="default" size="sm" onClick={() => setFinishDialogOpen(true)}>
          Beenden
        </Button>
      </div>

      {/* Workout Notes Toggle */}
      <button
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
        onClick={() => setShowWorkoutNotes(!showWorkoutNotes)}
      >
        <MessageSquare className="h-3 w-3" />
        Workout-Notizen
        {showWorkoutNotes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {showWorkoutNotes && (
        <Textarea
          placeholder="Notizen zum Workout..."
          value={activeWorkout.notes}
          onChange={e => updateWorkoutNotes(e.target.value)}
          className="min-h-[60px] text-sm"
        />
      )}

      {/* Exercise List */}
      {activeWorkout.exercises.map((we, exerciseIdx) => {
        const exercise = getExercise(we.exerciseId);
        if (!exercise) return null;

        const previousSets = getPreviousSets(we.exerciseId);

        return (
          <React.Fragment key={we.id}>
          <Card
            className={cn(
              "overflow-hidden",
              we.supersetGroupId && `border-l-4 ${supersetColors[we.supersetGroupId]}`
            )}
          >
            <CardHeader className="flex flex-row items-center gap-2 py-2.5 px-3 bg-muted/30">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-primary truncate">{exercise.name}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      setExpandedNotes(prev => ({ ...prev, [we.id]: !prev[we.id] }))
                    }
                  >
                    <MessageSquare className="mr-2 h-4 w-4" /> Notiz
                  </DropdownMenuItem>
                  {exerciseIdx > 0 && (
                    <DropdownMenuItem onClick={() => handleMoveExercise(exerciseIdx, "up")}>
                      Nach oben
                    </DropdownMenuItem>
                  )}
                  {exerciseIdx < activeWorkout.exercises.length - 1 && (
                    <DropdownMenuItem onClick={() => handleMoveExercise(exerciseIdx, "down")}>
                      Nach unten
                    </DropdownMenuItem>
                  )}
                  {exerciseIdx < activeWorkout.exercises.length - 1 && (
                    <DropdownMenuItem
                      onClick={() => {
                        const nextEx = activeWorkout.exercises[exerciseIdx + 1];
                        toggleSuperset(we.id, nextEx.id);
                      }}
                    >
                      {isLinkedWithNext(exerciseIdx) ? (
                        <><Unlink className="mr-2 h-4 w-4" /> Superset aufheben</>
                      ) : (
                        <><Link2 className="mr-2 h-4 w-4" /> Superset mit nächster</>
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => removeExercise(we.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Entfernen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>

            <CardContent className="p-0">
              {/* Pinned note */}
              {exercise.pinnedNote && (
                <div className="px-3 pt-2">
                  <p className="text-xs text-muted-foreground italic bg-muted/50 rounded px-2 py-1">
                    📌 {exercise.pinnedNote}
                  </p>
                </div>
              )}

              {/* Notes */}
              {expandedNotes[we.id] && (
                <div className="px-3 pt-2">
                  <Textarea
                    placeholder="Übungsnotiz..."
                    value={we.notes}
                    onChange={e => updateExerciseNotes(we.id, e.target.value)}
                    className="min-h-[40px] text-xs"
                  />
                </div>
              )}

              {/* Set Table Header */}
              <div className={cn(
                "grid gap-1 px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase",
                previousSets ? "grid-cols-[32px_1fr_1fr_1fr_36px]" : "grid-cols-[32px_1fr_1fr_36px]"
              )}>
                <span className="text-center">Set</span>
                {previousSets && <span className="text-center">Vorher</span>}
                <span className="text-center">{settings.weightUnit.toUpperCase()}</span>
                <span className="text-center">Wdh</span>
                <span className="text-center">
                  <Check className="h-3 w-3 mx-auto" />
                </span>
              </div>

              {/* Sets */}
              {we.sets.map((set, setIdx) => {
                const prevSet = previousSets?.[setIdx];
                return (
                  <div key={set.id}>
                    <div
                      className={cn(
                        "grid gap-1 items-center px-3 py-1.5",
                        previousSets ? "grid-cols-[32px_1fr_1fr_1fr_36px]" : "grid-cols-[32px_1fr_1fr_36px]",
                        set.completed && "bg-primary/5",
                        set.tag === "warmup" && "opacity-70"
                      )}
                    >
                      {/* Set Number / Tag */}
                      <button
                        className="flex items-center justify-center"
                        onClick={() => handleCycleTag(we.id, set.id, set.tag)}
                      >
                        {set.tag ? (
                          <span className={cn("text-[10px] font-bold rounded px-1.5 py-0.5", TAG_LABELS[set.tag].color)}>
                            {TAG_LABELS[set.tag].label}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">{setIdx + 1}</span>
                        )}
                      </button>

                      {/* Previous values */}
                      {previousSets && (
                        <div className="text-center">
                          {prevSet ? (
                            <span className="text-[11px] text-muted-foreground">
                              {prevSet.weight ?? "-"}×{prevSet.reps ?? "-"}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/40">-</span>
                          )}
                        </div>
                      )}

                      {/* Weight */}
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder={prevSet?.weight?.toString() ?? "-"}
                        value={set.weight ?? ""}
                        onChange={e =>
                          updateSet(we.id, set.id, {
                            weight: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        className="h-9 text-center text-sm font-medium border-muted/50"
                      />

                      {/* Reps */}
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder={prevSet?.reps?.toString() ?? "-"}
                        value={set.reps ?? ""}
                        onChange={e =>
                          updateSet(we.id, set.id, {
                            reps: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        className="h-9 text-center text-sm font-medium border-muted/50"
                      />

                      {/* Complete Checkbox */}
                      <div className="flex justify-center">
                        <Checkbox
                          checked={set.completed}
                          onCheckedChange={() => handleToggleSet(we.id, set.id)}
                          className="h-6 w-6 rounded-md"
                        />
                      </div>
                    </div>

                    {/* RPE row */}
                    {set.rpe && (
                      <div className="flex justify-end px-3 pb-1">
                        <Badge variant="outline" className="text-[10px] h-5">
                          RPE {set.rpe}
                        </Badge>
                      </div>
                    )}

                    {/* Inline Rest Timer — appears after the set that triggered it */}
                    {activeExerciseId === we.id && activeSetId === set.id && (isRunning || timeRemaining > 0) && (
                      <div className="mx-3 my-1.5 rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Timer className="h-3.5 w-3.5 text-primary" />
                            <span className="text-sm font-bold tabular-nums text-primary">
                              {formatDuration(timeRemaining)}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent"
                              onClick={() => addTime(-15)}
                            >
                              <Minus className="h-3 w-3 text-muted-foreground" />
                            </button>
                            <button
                              className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent"
                              onClick={() => addTime(15)}
                            >
                              <Plus className="h-3 w-3 text-muted-foreground" />
                            </button>
                            <button
                              className="h-6 px-1.5 flex items-center justify-center rounded hover:bg-accent text-[11px] text-muted-foreground font-medium"
                              onClick={() => skipTimer()}
                            >
                              <SkipForward className="h-3 w-3 mr-0.5" /> Skip
                            </button>
                          </div>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-1000 ease-linear",
                              timeRemaining > 0 ? "bg-primary" : "bg-green-500"
                            )}
                            style={{
                              width: `${totalDuration > 0 ? ((totalDuration - timeRemaining) / totalDuration) * 100 : 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Set + RPE */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => addSet(we.id)}
                >
                  <Plus className="mr-1 h-3 w-3" /> Set
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                      RPE
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[120px]">
                    {RPE_VALUES.map(val => (
                      <DropdownMenuItem
                        key={val}
                        onClick={() => {
                          const lastSet = we.sets[we.sets.length - 1];
                          if (lastSet) setSetRpe(we.id, lastSet.id, val);
                        }}
                      >
                        RPE {val}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        const lastSet = we.sets[we.sets.length - 1];
                        if (lastSet) setSetRpe(we.id, lastSet.id, null);
                      }}
                    >
                      Entfernen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
          {/* Superset connector */}
          {isLinkedWithNext(exerciseIdx) && (
            <div className="flex items-center justify-center -my-1.5">
              <div className={cn(
                "w-0.5 h-4 rounded-full",
                supersetColors[we.supersetGroupId!]?.replace("border-", "bg-")
              )} />
            </div>
          )}
          </React.Fragment>
        );
      })}

      {/* Add Exercise Button */}
      <Button
        variant="outline"
        className="w-full h-12 border-dashed"
        onClick={() => setPickerOpen(true)}
      >
        <Plus className="mr-2 h-5 w-5" /> Übung hinzufügen
      </Button>

      {/* Discard Button */}
      <Button
        variant="ghost"
        className="text-destructive"
        onClick={() => setDiscardDialogOpen(true)}
      >
        Workout verwerfen
      </Button>

      {/* Exercise Picker */}
      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAddExercises}
      />

      {/* Finish Dialog */}
      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workout beenden?</DialogTitle>
            <DialogDescription>
              Dein Workout wird gespeichert.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={saveAsTemplate}
                onCheckedChange={(v) => setSaveAsTemplate(!!v)}
              />
              Als Vorlage speichern
            </label>
            {saveAsTemplate && (
              <Input
                placeholder="Vorlagenname..."
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleFinish}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard Dialog */}
      <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workout verwerfen?</DialogTitle>
            <DialogDescription>
              Dein Fortschritt geht verloren und kann nicht wiederhergestellt werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscardDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDiscard}>
              Verwerfen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
