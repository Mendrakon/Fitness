"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Dumbbell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { useExercises } from "@/hooks/use-exercises";
import {
  MUSCLE_GROUP_LABELS, CATEGORY_LABELS,
  type MuscleGroup, type ExerciseCategory
} from "@/lib/types";

const muscleGroups: MuscleGroup[] = [
  "chest", "back", "shoulders", "biceps", "triceps", "quads",
  "hamstrings", "glutes", "calves", "core", "forearms", "full_body",
];

export default function ExercisesPage() {
  const router = useRouter();
  const { exercises, createCustom } = useExercises();
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<ExerciseCategory>("barbell");
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>("chest");

  const filtered = useMemo(() => {
    let result = exercises;
    if (selectedGroup) result = result.filter(e => e.muscleGroup === selectedGroup);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(q));
    }
    return result;
  }, [exercises, query, selectedGroup]);

  const grouped = useMemo(() => {
    const map = new Map<MuscleGroup, typeof filtered>();
    filtered.forEach(e => {
      const list = map.get(e.muscleGroup) || [];
      list.push(e);
      map.set(e.muscleGroup, list);
    });
    return map;
  }, [filtered]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCustom({
      name: newName.trim(),
      category: newCategory,
      muscleGroup: newMuscle,
      equipment: CATEGORY_LABELS[newCategory],
    });
    setNewName("");
    setCreateOpen(false);
  };

  return (
    <div className="flex flex-col gap-0">
      <PageHeader
        title="Übungen"
        rightAction={
          <Button variant="ghost" size="icon" onClick={() => setCreateOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <div className="px-4 pt-3 pb-2">
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

      <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 no-scrollbar">
        <Badge
          variant={selectedGroup === null ? "default" : "outline"}
          className="cursor-pointer shrink-0"
          onClick={() => setSelectedGroup(null)}
        >
          Alle ({exercises.length})
        </Badge>
        {muscleGroups.map(g => {
          const count = exercises.filter(e => e.muscleGroup === g).length;
          return (
            <Badge
              key={g}
              variant={selectedGroup === g ? "default" : "outline"}
              className="cursor-pointer shrink-0"
              onClick={() => setSelectedGroup(g)}
            >
              {MUSCLE_GROUP_LABELS[g]} ({count})
            </Badge>
          );
        })}
      </div>

      <div className="flex-1 px-4 pb-4">
        {Array.from(grouped.entries()).map(([group, exs]) => (
          <div key={group} className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {MUSCLE_GROUP_LABELS[group]}
            </h3>
            <div className="space-y-0.5">
              {exs.map(ex => (
                <button
                  key={ex.id}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent active:bg-accent"
                  onClick={() => router.push(`/exercises/${ex.id}`)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[ex.category]}
                      {ex.isCustom && " · Eigene"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <Dumbbell className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Keine Übungen gefunden</p>
          </div>
        )}
      </div>

      {/* Create Exercise Drawer */}
      <Drawer open={createOpen} onOpenChange={setCreateOpen} repositionInputs={false}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Eigene Übung erstellen</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Übungsname..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={newCategory} onValueChange={v => setNewCategory(v as ExerciseCategory)}>
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
              <Select value={newMuscle} onValueChange={v => setNewMuscle(v as MuscleGroup)}>
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
            <Button onClick={handleCreate} disabled={!newName.trim()}>Erstellen</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
