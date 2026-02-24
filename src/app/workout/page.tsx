"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, X, GripVertical, Trash2, MoreVertical, Check, MessageSquare, ChevronDown, ChevronUp
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useActiveWorkout } from "@/contexts/active-workout-context";
import { useTimer } from "@/contexts/timer-context";
import { useWorkouts } from "@/hooks/use-workouts";
import { useTemplates } from "@/hooks/use-templates";
import { useExercises } from "@/hooks/use-exercises";
import { useSettings } from "@/hooks/use-settings";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { formatDuration } from "@/lib/calculations";
import type { SetTag, RPE } from "@/lib/types";
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
    addExercise, removeExercise, updateSet, addSet, removeSet,
    toggleSetComplete, setSetTag, setSetRpe, updateExerciseNotes,
    updateWorkoutNotes, updateWorkoutName, elapsedSeconds,
  } = useActiveWorkout();
  const { startTimer } = useTimer();
  const { save } = useWorkouts();
  const { saveWorkoutAsTemplate } = useTemplates();
  const { getById: getExercise } = useExercises();
  const { settings } = useSettings();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [showRpe, setShowRpe] = useState<string | null>(null);
  const [showWorkoutNotes, setShowWorkoutNotes] = useState(false);

  // Start empty workout if none active
  if (!activeWorkout) {
    startEmptyWorkout();
    return null;
  }

  const handleFinish = () => {
    const finished = finishWorkout();
    if (finished) {
      save(finished);
      if (saveAsTemplate && templateName.trim()) {
        saveWorkoutAsTemplate(finished, templateName.trim());
        toast.success("Workout gespeichert & Vorlage erstellt");
      } else {
        toast.success("Workout gespeichert!");
      }
    }
    setFinishDialogOpen(false);
    router.push("/");
  };

  const handleDiscard = () => {
    discardWorkout();
    setDiscardDialogOpen(false);
    router.push("/");
  };

  const handleToggleSet = (exerciseInstanceId: string, setId: string) => {
    const completed = toggleSetComplete(exerciseInstanceId, setId);
    if (completed && settings.restTimerAutoStart) {
      const exercise = activeWorkout.exercises.find(e => e.id === exerciseInstanceId);
      const set = exercise?.sets.find(s => s.id === setId);
      const timerDuration =
        set?.tag === "warmup" ? settings.defaultRestTimerWarmup : settings.defaultRestTimerWork;
      startTimer(timerDuration);
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

  const getLastValues = (exerciseId: string): string => {
    // Placeholder - will show previous values
    return "";
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
      {activeWorkout.exercises.map((we) => {
        const exercise = getExercise(we.exerciseId);
        if (!exercise) return null;

        return (
          <Card key={we.id} className="overflow-hidden">
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
              <div className="grid grid-cols-[36px_1fr_1fr_40px] gap-1 px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase">
                <span className="text-center">Set</span>
                <span className="text-center">{settings.weightUnit.toUpperCase()}</span>
                <span className="text-center">Wdh</span>
                <span className="text-center">
                  <Check className="h-3 w-3 mx-auto" />
                </span>
              </div>

              {/* Sets */}
              {we.sets.map((set, setIdx) => (
                <div key={set.id}>
                  <div
                    className={cn(
                      "grid grid-cols-[36px_1fr_1fr_40px] gap-1 items-center px-3 py-1.5",
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

                    {/* Weight */}
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="-"
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
                      placeholder="-"
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
                </div>
              ))}

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
