"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Folder, Play, MoreVertical, Copy, Trash2, Dumbbell, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/layout/page-header";
import { useTemplates } from "@/hooks/use-templates";
import { useFolders } from "@/hooks/use-folders";
import { useExercises } from "@/hooks/use-exercises";
import { useActiveWorkout } from "@/contexts/active-workout-context";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function TemplatesPage() {
  const router = useRouter();
  const { templates, deleteTemplate, duplicate } = useTemplates();
  const { folders, create: createFolder, deleteFolder } = useFolders();
  const { getById: getExercise } = useExercises();
  const { activeWorkout, startFromTemplate } = useActiveWorkout();

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const displayTemplates = selectedFolder === null
    ? templates
    : templates.filter(t => t.folderId === selectedFolder);

  const handleCreateFolder = () => {
    if (folderName.trim()) {
      createFolder(folderName.trim());
      setFolderName("");
      setFolderDialogOpen(false);
    }
  };

  const handleStart = (template: typeof templates[0]) => {
    if (!activeWorkout) {
      startFromTemplate(template);
      router.push("/workout");
    }
  };

  return (
    <div className="flex flex-col gap-0">
      <PageHeader
        title="Vorlagen"
        rightAction={
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setFolderDialogOpen(true)}>
              <FolderPlus className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push("/templates/new")}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      {/* Folder chips */}
      {folders.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto px-4 py-3 no-scrollbar">
          <Badge
            variant={selectedFolder === null ? "default" : "outline"}
            className="cursor-pointer shrink-0"
            onClick={() => setSelectedFolder(null)}
          >
            Alle
          </Badge>
          {folders.map(f => (
            <Badge
              key={f.id}
              variant={selectedFolder === f.id ? "default" : "outline"}
              className="cursor-pointer shrink-0"
              onClick={() => setSelectedFolder(f.id)}
            >
              <Folder className="mr-1 h-3 w-3" /> {f.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Template List */}
      <div className="px-4 pb-4 space-y-2">
        {displayTemplates.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Dumbbell className="h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="font-semibold mb-1">Keine Vorlagen</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Erstelle deine erste Vorlage oder speichere ein Workout als Vorlage.
            </p>
            <Button className="mt-4" onClick={() => router.push("/templates/new")}>
              <Plus className="mr-2 h-4 w-4" /> Vorlage erstellen
            </Button>
          </div>
        ) : (
          displayTemplates.map(t => (
            <Card key={t.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => router.push(`/templates/${t.id}`)}
                >
                  <p className="font-medium text-sm truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.exercises.length} Übungen
                    {t.exercises.slice(0, 3).map(te => {
                      const ex = getExercise(te.exerciseId);
                      return ex ? ` · ${ex.name}` : "";
                    }).join("")}
                  </p>
                  {t.lastUsed && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Zuletzt: {format(new Date(t.lastUsed), "d. MMM", { locale: de })}
                    </p>
                  )}
                </div>

                <Button
                  size="icon"
                  variant="default"
                  className="h-9 w-9 rounded-full shrink-0"
                  onClick={() => handleStart(t)}
                  disabled={!!activeWorkout}
                >
                  <Play className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/templates/${t.id}`)}>
                      Bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicate(t.id)}>
                      <Copy className="mr-2 h-4 w-4" /> Duplizieren
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteTemplate(t.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Ordner</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Ordnername..."
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleCreateFolder} disabled={!folderName.trim()}>Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
