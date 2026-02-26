"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Check } from "lucide-react";
import { useExercises } from "@/hooks/use-exercises";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exerciseIds: string[]) => void;
  multiSelect?: boolean;
}

const muscleGroups: MuscleGroup[] = [
  "chest", "back", "shoulders", "biceps", "triceps", "quads",
  "hamstrings", "glutes", "calves", "core", "forearms", "full_body",
];

export function ExercisePicker({ open, onOpenChange, onSelect, multiSelect = true }: ExercisePickerProps) {
  const { exercises } = useExercises();
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let result = exercises;
    if (selectedGroup) result = result.filter(e => e.muscleGroup === selectedGroup);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(q));
    }
    return result;
  }, [exercises, query, selectedGroup]);

  const handleSelect = (id: string) => {
    if (multiSelect) {
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    } else {
      onSelect([id]);
      setSelectedIds([]);
      setQuery("");
      setSelectedGroup(null);
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    if (selectedIds.length > 0) {
      onSelect(selectedIds);
      setSelectedIds([]);
      setQuery("");
      setSelectedGroup(null);
      onOpenChange(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setSelectedIds([]);
      setQuery("");
      setSelectedGroup(null);
    }
    onOpenChange(v);
  };

  return (
    <Drawer open={open} onOpenChange={handleClose} repositionInputs={false}>
      <DrawerContent className="flex flex-col min-h-[70dvh] max-h-[90dvh]">
        <DrawerHeader className="pb-2 shrink-0">
          <DrawerTitle>Übung hinzufügen</DrawerTitle>
        </DrawerHeader>

        {/* Search */}
        <div className="px-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Übung suchen..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Muscle group filter chips - horizontal scroll */}
        <div className="shrink-0 px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: "touch" }}>
            <button
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                selectedGroup === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
              onClick={() => setSelectedGroup(null)}
            >
              Alle
            </button>
            {muscleGroups.map(g => (
              <button
                key={g}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedGroup === g
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
                onClick={() => setSelectedGroup(g)}
              >
                {MUSCLE_GROUP_LABELS[g]}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise list - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 min-h-0">
          <div className="space-y-0.5 pb-2">
            {filtered.map(exercise => {
              const isSelected = selectedIds.includes(exercise.id);
              return (
                <button
                  key={exercise.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                    isSelected ? "bg-primary/10" : "active:bg-accent"
                  )}
                  onClick={() => handleSelect(exercise.id)}
                >
                  {multiSelect && (
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                      isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">{MUSCLE_GROUP_LABELS[exercise.muscleGroup]}</p>
                  </div>
                  {!multiSelect && <Plus className="h-4 w-4 text-muted-foreground" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Keine Übungen gefunden
              </p>
            )}
          </div>
        </div>

        {/* Sticky confirm button at bottom */}
        {multiSelect && (
          <div className="shrink-0 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
            >
              {selectedIds.length > 0
                ? `${selectedIds.length} Übung${selectedIds.length > 1 ? "en" : ""} hinzufügen`
                : "Übungen auswählen"}
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
