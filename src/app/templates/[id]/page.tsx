"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import { Plus, Trash2, GripVertical, Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { useTemplates } from "@/hooks/use-templates";
import { useFolders } from "@/hooks/use-folders";
import { useExercises } from "@/hooks/use-exercises";
import { useActiveWorkout } from "@/contexts/active-workout-context";
import type { TemplateExercise, TemplateSet } from "@/lib/types";
import { toast } from "sonner";

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getById, create, update } = useTemplates();
  const { folders } = useFolders();
  const { getById: getExercise } = useExercises();
  const { activeWorkout, startFromTemplate } = useActiveWorkout();

  const isNew = id === "new";
  const existing = !isNew ? getById(id) : null;

  const [name, setName] = useState(existing?.name || "");
  const [folderId, setFolderId] = useState<string>(existing?.folderId || "none");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [exercises, setExercises] = useState<TemplateExercise[]>(
    existing?.exercises || []
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleAddExercises = (exerciseIds: string[]) => {
    const newExercises: TemplateExercise[] = exerciseIds.map(exId => ({
      id: uuid(),
      exerciseId: exId,
      sets: [{ id: uuid(), weight: null, reps: null, tag: null, rpe: null }],
      notes: "",
    }));
    setExercises(prev => [...prev, ...newExercises]);
  };

  const handleRemoveExercise = (instanceId: string) => {
    setExercises(prev => prev.filter(e => e.id !== instanceId));
  };

  const handleAddSet = (instanceId: string) => {
    setExercises(prev =>
      prev.map(e =>
        e.id === instanceId
          ? {
              ...e,
              sets: [...e.sets, { id: uuid(), weight: null, reps: null, tag: null, rpe: null }],
            }
          : e
      )
    );
  };

  const handleRemoveSet = (instanceId: string, setId: string) => {
    setExercises(prev =>
      prev.map(e =>
        e.id === instanceId
          ? { ...e, sets: e.sets.filter(s => s.id !== setId) }
          : e
      )
    );
  };

  const handleUpdateSet = (instanceId: string, setId: string, updates: Partial<TemplateSet>) => {
    setExercises(prev =>
      prev.map(e =>
        e.id === instanceId
          ? { ...e, sets: e.sets.map(s => (s.id === setId ? { ...s, ...updates } : s)) }
          : e
      )
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Bitte gib einen Namen ein");
      return;
    }
    const folderValue = folderId === "none" ? null : folderId;
    if (isNew) {
      create({ name: name.trim(), folderId: folderValue, exercises, notes });
      toast.success("Vorlage erstellt");
    } else {
      update(id, { name: name.trim(), folderId: folderValue, exercises, notes });
      toast.success("Vorlage gespeichert");
    }
    router.push("/templates");
  };

  const handleStart = () => {
    if (activeWorkout) return;
    const template = existing || {
      id: uuid(),
      name: name.trim() || "Workout",
      folderId: folderId === "none" ? null : folderId,
      exercises,
      notes,
      lastUsed: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    startFromTemplate(template);
    router.push("/workout");
  };

  return (
    <div className="flex flex-col gap-0">
      <PageHeader
        title={isNew ? "Neue Vorlage" : "Vorlage bearbeiten"}
        showBack
        rightAction={
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-1 h-4 w-4" /> Speichern
          </Button>
        }
      />

      <div className="px-4 pt-3 pb-4 space-y-4">
        {/* Name & Folder */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              placeholder="Vorlagenname..."
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          {folders.length > 0 && (
            <div className="space-y-1.5">
              <Label>Ordner</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Ordner</SelectItem>
                  {folders.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Notizen</Label>
            <Textarea
              placeholder="Notizen zur Vorlage..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="min-h-[60px]"
            />
          </div>
        </div>

        {/* Exercises */}
        {exercises.map(te => {
          const exercise = getExercise(te.exerciseId);
          if (!exercise) return null;

          return (
            <Card key={te.id}>
              <CardHeader className="flex flex-row items-center gap-2 py-2.5 px-3 bg-muted/30">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <p className="flex-1 font-semibold text-sm text-primary truncate">
                  {exercise.name}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleRemoveExercise(te.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-[36px_1fr_1fr_32px] gap-1 px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase">
                  <span className="text-center">Set</span>
                  <span className="text-center">KG</span>
                  <span className="text-center">Wdh</span>
                  <span />
                </div>
                {te.sets.map((set, i) => (
                  <div key={set.id} className="grid grid-cols-[36px_1fr_1fr_32px] gap-1 items-center px-3 py-1">
                    <span className="text-xs text-center text-muted-foreground">{i + 1}</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="-"
                      value={set.weight ?? ""}
                      onChange={e =>
                        handleUpdateSet(te.id, set.id, {
                          weight: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      className="h-8 text-center text-sm"
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="-"
                      value={set.reps ?? ""}
                      onChange={e =>
                        handleUpdateSet(te.id, set.id, {
                          reps: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="h-8 text-center text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveSet(te.id, set.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                <div className="px-3 py-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleAddSet(te.id)}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Set
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button
          variant="outline"
          className="w-full h-11 border-dashed"
          onClick={() => setPickerOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Übung hinzufügen
        </Button>

        {exercises.length > 0 && (
          <Button
            className="w-full h-12"
            onClick={handleStart}
            disabled={!!activeWorkout}
          >
            <Play className="mr-2 h-4 w-4" /> Workout starten
          </Button>
        )}
      </div>

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAddExercises}
      />
    </div>
  );
}
