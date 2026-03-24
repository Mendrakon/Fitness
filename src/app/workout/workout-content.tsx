"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, GripVertical, Trash2, MoreVertical, Check, MessageSquare,
  ChevronDown, ChevronUp, Link2, Unlink, Minus, SkipForward, Timer, Clock,
  Globe, Users, X, Share2, Play, Pencil,
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
import { useKlettersteigSession } from "@/contexts/klettersteig-session-context";
import { KlettersteigTab } from "@/components/klettersteig/klettersteig-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mountain, Dumbbell } from "lucide-react";
import { useTimer } from "@/contexts/timer-context";
import { useWorkouts } from "@/hooks/use-workouts";
import { useTemplates } from "@/hooks/use-templates";
import { useExercises } from "@/hooks/use-exercises";
import { useSettings } from "@/hooks/use-settings";
import { usePersonalRecords } from "@/hooks/use-personal-records";
import { useActivityFeed, shareTemplateToFeed, type FeedVisibility } from "@/hooks/use-activity-feed";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { formatDuration } from "@/lib/calculations";
import { detectPRs } from "@/lib/pr-detection";
import { PR_METRIC_LABELS, formatPRDiff } from "@/lib/types";
import type { SetTag, RPE, WorkoutExercise, Template, CardioData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TAG_CYCLE: SetTag[] = [null, "warmup", "dropset", "failure"];
const TAG_LABELS: Record<string, { label: string; color: string }> = {
  warmup: { label: "W", color: "bg-yellow-500 text-white" },
  dropset: { label: "D", color: "bg-purple-500 text-white" },
  failure: { label: "F", color: "bg-red-500 text-white" },
};

const RPE_VALUES: RPE[] = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

// ── Example Templates ────────────────────────────────────────────────────────

const EXAMPLE_TEMPLATES: Template[] = [
  {
    id: "example-push-a",
    name: "Push A",
    folderId: null,
    notes: "Brust, Schultern & Trizeps",
    lastUsed: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    exercises: [
      { id: "et-push-1", exerciseId: "ex-bench-press", notes: "", sets: [
        { id: "s1", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s2", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s3", weight: null, reps: 5, tag: null, rpe: null },
      ]},
      { id: "et-push-2", exerciseId: "ex-incline-bench", notes: "", sets: [
        { id: "s4", weight: null, reps: 10, tag: null, rpe: null },
        { id: "s5", weight: null, reps: 10, tag: null, rpe: null },
        { id: "s6", weight: null, reps: 10, tag: null, rpe: null },
      ]},
      { id: "et-push-3", exerciseId: "ex-db-ohp", notes: "", sets: [
        { id: "s7", weight: null, reps: 10, tag: null, rpe: null },
        { id: "s8", weight: null, reps: 10, tag: null, rpe: null },
        { id: "s9", weight: null, reps: 10, tag: null, rpe: null },
      ]},
      { id: "et-push-4", exerciseId: "ex-lateral-raise", notes: "", sets: [
        { id: "s10", weight: null, reps: 15, tag: null, rpe: null },
        { id: "s11", weight: null, reps: 15, tag: null, rpe: null },
        { id: "s12", weight: null, reps: 15, tag: null, rpe: null },
      ]},
      { id: "et-push-5", exerciseId: "ex-tricep-pushdown", notes: "", sets: [
        { id: "s13", weight: null, reps: 12, tag: null, rpe: null },
        { id: "s14", weight: null, reps: 12, tag: null, rpe: null },
        { id: "s15", weight: null, reps: 12, tag: null, rpe: null },
      ]},
    ],
  },
  {
    id: "example-pull-a",
    name: "Pull A",
    folderId: null,
    notes: "Rücken & Bizeps",
    lastUsed: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    exercises: [
      { id: "et-pull-1", exerciseId: "ex-pull-up", notes: "", sets: [
        { id: "s16", weight: null, reps: 8, tag: null, rpe: null },
        { id: "s17", weight: null, reps: 8, tag: null, rpe: null },
        { id: "s18", weight: null, reps: 8, tag: null, rpe: null },
      ]},
      { id: "et-pull-2", exerciseId: "ex-lat-pulldown", notes: "", sets: [
        { id: "s19", weight: null, reps: 10, tag: null, rpe: null },
        { id: "s20", weight: null, reps: 10, tag: null, rpe: null },
        { id: "s21", weight: null, reps: 10, tag: null, rpe: null },
      ]},
      { id: "et-pull-3", exerciseId: "ex-barbell-row", notes: "", sets: [
        { id: "s22", weight: null, reps: 8, tag: null, rpe: null },
        { id: "s23", weight: null, reps: 8, tag: null, rpe: null },
        { id: "s24", weight: null, reps: 8, tag: null, rpe: null },
      ]},
      { id: "et-pull-4", exerciseId: "ex-db-curl", notes: "", sets: [
        { id: "s25", weight: null, reps: 12, tag: null, rpe: null },
        { id: "s26", weight: null, reps: 12, tag: null, rpe: null },
        { id: "s27", weight: null, reps: 12, tag: null, rpe: null },
      ]},
      { id: "et-pull-5", exerciseId: "ex-hammer-curl", notes: "", sets: [
        { id: "s28", weight: null, reps: 12, tag: null, rpe: null },
        { id: "s29", weight: null, reps: 12, tag: null, rpe: null },
        { id: "s30", weight: null, reps: 12, tag: null, rpe: null },
      ]},
    ],
  },
  {
    id: "example-legs-a",
    name: "Beine A",
    folderId: null,
    notes: "Quads, Hamstrings & Waden",
    lastUsed: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    exercises: [
      { id: "et-leg-1", exerciseId: "ex-squat", notes: "", sets: [
        { id: "s31", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s32", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s33", weight: null, reps: 5, tag: null, rpe: null },
      ]},
      { id: "et-leg-2", exerciseId: "ex-leg-press", notes: "", sets: [
        { id: "s34", weight: null, reps: 10, tag: null, rpe: null },
        { id: "s35", weight: null, reps: 10, tag: null, rpe: null },
        { id: "s36", weight: null, reps: 10, tag: null, rpe: null },
      ]},
      { id: "et-leg-3", exerciseId: "ex-leg-extension", notes: "", sets: [
        { id: "s37", weight: null, reps: 12, tag: null, rpe: null },
        { id: "s38", weight: null, reps: 12, tag: null, rpe: null },
        { id: "s39", weight: null, reps: 12, tag: null, rpe: null },
      ]},
      { id: "et-leg-4", exerciseId: "ex-leg-curl", notes: "", sets: [
        { id: "s40", weight: null, reps: 12, tag: null, rpe: null },
        { id: "s41", weight: null, reps: 12, tag: null, rpe: null },
        { id: "s42", weight: null, reps: 12, tag: null, rpe: null },
      ]},
      { id: "et-leg-5", exerciseId: "ex-standing-calf-raise", notes: "", sets: [
        { id: "s43", weight: null, reps: 15, tag: null, rpe: null },
        { id: "s44", weight: null, reps: 15, tag: null, rpe: null },
        { id: "s45", weight: null, reps: 15, tag: null, rpe: null },
      ]},
    ],
  },
  {
    id: "example-upper-body",
    name: "Oberkörper",
    folderId: null,
    notes: "Brust, Rücken & Schultern",
    lastUsed: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    exercises: [
      { id: "et-ub-1", exerciseId: "ex-bench-press", notes: "", sets: [
        { id: "s46", weight: null, reps: 8, tag: null, rpe: null },
        { id: "s47", weight: null, reps: 8, tag: null, rpe: null },
        { id: "s48", weight: null, reps: 8, tag: null, rpe: null },
      ]},
      { id: "et-ub-2", exerciseId: "ex-pull-up", notes: "", sets: [
        { id: "s49", weight: null, reps: 8, tag: null, rpe: null },
        { id: "s50", weight: null, reps: 8, tag: null, rpe: null },
        { id: "s51", weight: null, reps: 8, tag: null, rpe: null },
      ]},
      { id: "et-ub-3", exerciseId: "ex-db-ohp", notes: "", sets: [
        { id: "s52", weight: null, reps: 10, tag: null, rpe: null },
        { id: "s53", weight: null, reps: 10, tag: null, rpe: null },
        { id: "s54", weight: null, reps: 10, tag: null, rpe: null },
      ]},
      { id: "et-ub-4", exerciseId: "ex-lateral-raise", notes: "", sets: [
        { id: "s55", weight: null, reps: 15, tag: null, rpe: null },
        { id: "s56", weight: null, reps: 15, tag: null, rpe: null },
        { id: "s57", weight: null, reps: 15, tag: null, rpe: null },
      ]},
    ],
  },
  {
    id: "example-fullbody",
    name: "Ganzkörper",
    folderId: null,
    notes: "Compound-Übungen Ganzkörper",
    lastUsed: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    exercises: [
      { id: "et-fb-1", exerciseId: "ex-squat", notes: "", sets: [
        { id: "s58", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s59", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s60", weight: null, reps: 5, tag: null, rpe: null },
      ]},
      { id: "et-fb-2", exerciseId: "ex-bench-press", notes: "", sets: [
        { id: "s61", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s62", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s63", weight: null, reps: 5, tag: null, rpe: null },
      ]},
      { id: "et-fb-3", exerciseId: "ex-pull-up", notes: "", sets: [
        { id: "s64", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s65", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s66", weight: null, reps: 5, tag: null, rpe: null },
      ]},
      { id: "et-fb-4", exerciseId: "ex-deadlift", notes: "", sets: [
        { id: "s67", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s68", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s69", weight: null, reps: 5, tag: null, rpe: null },
      ]},
      { id: "et-fb-5", exerciseId: "ex-ohp", notes: "", sets: [
        { id: "s70", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s71", weight: null, reps: 5, tag: null, rpe: null },
        { id: "s72", weight: null, reps: 5, tag: null, rpe: null },
      ]},
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatLastUsed(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  if (diffDays < 30) return `vor ${diffDays} Tagen`;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Template Card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  exercisePreview,
  timeLabel,
  onStart,
  onDelete,
  onShare,
  isExample,
}: {
  template: Template;
  exercisePreview: string;
  timeLabel: string | null;
  onStart: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  isExample?: boolean;
}) {
  return (
    <div
      className="relative flex flex-col rounded-2xl border border-border bg-card p-3 cursor-pointer hover:border-primary/40 active:scale-[0.98] transition-all select-none"
      onClick={onStart}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <h3 className="font-bold text-sm leading-tight flex-1 min-w-0 break-words">
          {template.name}
        </h3>
        {!isExample && onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 -mr-1 -mt-0.5 rounded-lg bg-muted/70 hover:bg-muted"
                onClick={e => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
              <DropdownMenuItem onClick={onStart}>
                <Play className="mr-2 h-4 w-4" /> Starten
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/templates/${template.id}`}>
                  <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
                </Link>
              </DropdownMenuItem>
              {onShare && (
                <DropdownMenuItem onClick={onShare}>
                  <Share2 className="mr-2 h-4 w-4" /> Im Feed teilen
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-3 mb-2 flex-1">
        {exercisePreview || "Keine Übungen"}
      </p>

      {timeLabel && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
          <Clock className="h-2.5 w-2.5 shrink-0" />
          <span>{timeLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── Workout Start Screen ──────────────────────────────────────────────────────

function WorkoutStartScreen() {
  const { startEmptyWorkout, startFromTemplate } = useActiveWorkout();
  const { templates, deleteTemplate, markUsed } = useTemplates();
  const { getById: getExercise } = useExercises();

  const getExercisePreview = (tmpl: Template) =>
    tmpl.exercises
      .map(te => getExercise(te.exerciseId)?.name ?? "")
      .filter(Boolean)
      .join(", ");

  const handleStartTemplate = (tmpl: Template, isUserTemplate: boolean) => {
    startFromTemplate(tmpl);
    if (isUserTemplate) markUsed(tmpl.id);
  };

  const handleShare = async (tmpl: Template) => {
    await shareTemplateToFeed(tmpl, (id) => getExercise(id));
    toast.success("Vorlage geteilt", { description: "Im Community-Feed sichtbar." });
  };

  return (
    <div className="flex flex-col px-4 pt-5 pb-28 gap-7">
      <h1 className="text-3xl font-bold tracking-tight">Workout beginnen</h1>

      {/* Quick Start */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Schnellstart
        </p>
        <Button
          className="w-full h-13 text-base font-semibold rounded-xl shadow-md"
          onClick={startEmptyWorkout}
        >
          Ein leeres Workout beginnen
        </Button>
      </section>

      {/* User Templates */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Vorlagen</h2>
          <Link href="/templates">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-sm">
              <Plus className="h-3.5 w-3.5" />
              Vorlage
            </Button>
          </Link>
        </div>

        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Vorlagen. Erstelle eine oder starte mit einem Beispiel.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground/80">
              Meine Vorlagen ({templates.length})
            </p>
            <div className="grid grid-cols-2 gap-3">
              {templates.map(tmpl => (
                <TemplateCard
                  key={tmpl.id}
                  template={tmpl}
                  exercisePreview={getExercisePreview(tmpl)}
                  timeLabel={formatLastUsed(tmpl.lastUsed ?? tmpl.updatedAt)}
                  onStart={() => handleStartTemplate(tmpl, true)}
                  onDelete={() => deleteTemplate(tmpl.id)}
                  onShare={() => handleShare(tmpl)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Example Templates */}
      <section className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-foreground/80">
          Beispiel Vorlagen ({EXAMPLE_TEMPLATES.length})
        </p>
        <div className="grid grid-cols-2 gap-3">
          {EXAMPLE_TEMPLATES.map(tmpl => (
            <TemplateCard
              key={tmpl.id}
              template={tmpl}
              exercisePreview={getExercisePreview(tmpl)}
              timeLabel={null}
              onStart={() => handleStartTemplate(tmpl, false)}
              isExample
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Klettersteig Active Hint ─────────────────────────────────────────────────

function KlettersteigActiveHint({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 pt-20 gap-4 text-center">
      <Mountain className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-lg font-bold">Aktive Klettersteig-Session</h2>
      <p className="text-sm text-muted-foreground">
        Du hast eine laufende Klettersteig-Session. Beende sie zuerst, bevor du ein Gym-Workout startest.
      </p>
      <Button onClick={onSwitch}>Zur Klettersteig-Session</Button>
    </div>
  );
}

function GymActiveHint({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 pt-20 gap-4 text-center">
      <div className="text-4xl">🏋️</div>
      <h2 className="text-lg font-bold">Aktives Gym-Workout</h2>
      <p className="text-sm text-muted-foreground">
        Du hast ein laufendes Gym-Workout. Beende es zuerst, bevor du eine Klettersteig-Session startest.
      </p>
      <Button onClick={onSwitch}>Zum Gym-Workout</Button>
    </div>
  );
}

// ── Main Workout Page ─────────────────────────────────────────────────────────

function WorkoutPageInner() {
  const router = useRouter();
  const {
    activeWorkout, startEmptyWorkout, finishWorkout, discardWorkout,
    addExercise, removeExercise, reorderExercises, updateSet, addSet, removeSet,
    toggleSetComplete, setSetTag, setSetRpe, updateExerciseNotes,
    updateWorkoutNotes, updateWorkoutName, toggleSuperset, elapsedSeconds,
  } = useActiveWorkout();
  const { startTimer, timeRemaining, totalDuration, isRunning, activeExerciseId, activeSetId, skipTimer, addTime, setVisible } = useTimer();
  const { workouts, save, getLastForExercise } = useWorkouts();
  const { templates, saveWorkoutAsTemplate } = useTemplates();
  const { getById: getExercise } = useExercises();
  const { settings } = useSettings();
  const { addPREvents } = usePersonalRecords();
  const { createFeedEvent } = useActivityFeed();

  const { activeSession: activeKlettersteigSession } = useKlettersteigSession();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>(
    activeKlettersteigSession ? "klettersteig" : (searchParams.get("tab") ?? "gym")
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [showWorkoutNotes, setShowWorkoutNotes] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const pendingShareRef = useRef<Parameters<typeof createFeedEvent>[1] | null>(null);

  const swipeTouchStartX = useRef<number>(0);
  const swipingSetId = useRef<string | null>(null);
  const currentSwipeOffset = useRef<number>(0);
  const [swipedSetId, setSwipedSetId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const SWIPE_DELETE_THRESHOLD = 80;

  const handleShare = (visibility: FeedVisibility | null) => {
    setShareDialogOpen(false);
    if (visibility && pendingShareRef.current) {
      createFeedEvent("workout_complete", pendingShareRef.current, visibility);
    }
    pendingShareRef.current = null;
    setTimeout(() => router.push("/"), 100);
  };

  if (!activeWorkout) {
    return (
      <>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-3">
            <TabsList className="w-full">
              <TabsTrigger value="gym" className="flex-1 gap-1.5"><Dumbbell className="h-3.5 w-3.5" /> Gym</TabsTrigger>
              <TabsTrigger value="klettersteig" className="flex-1 gap-1.5">
                <Mountain className="h-3.5 w-3.5" /> Klettersteig
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="gym">
            {activeKlettersteigSession ? (
              <KlettersteigActiveHint onSwitch={() => setActiveTab("klettersteig")} />
            ) : (
              <WorkoutStartScreen />
            )}
          </TabsContent>
          <TabsContent value="klettersteig">
            <KlettersteigTab />
          </TabsContent>
        </Tabs>
        <Dialog open={shareDialogOpen} onOpenChange={() => handleShare(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Workout teilen?</DialogTitle>
              <DialogDescription>
                Wähle, wer dein Workout sehen kann. PRs werden mit dem gleichen Sichtbarkeits-Setting geteilt.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-1">
              <button
                onClick={() => handleShare("global")}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Global</p>
                  <p className="text-xs text-muted-foreground">Alle FitTrack-Nutzer können es sehen</p>
                </div>
              </button>
              <button
                onClick={() => handleShare("friends")}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Nur Freunde</p>
                  <p className="text-xs text-muted-foreground">Nur deine Freunde sehen es</p>
                </div>
              </button>
              <button
                onClick={() => handleShare(null)}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <X className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Nicht teilen</p>
                  <p className="text-xs text-muted-foreground">Nur in deinem eigenen Verlauf sichtbar</p>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const isUserTemplate = !!(
    activeWorkout.templateId &&
    templates.some(t => t.id === activeWorkout.templateId)
  );

  const handleFinish = () => {
    const finished = finishWorkout();
    if (finished) {
      save(finished);

      // PR Detection — use workouts already loaded from DB
      const prs = detectPRs(finished, workouts, settings);
      const prSummaries: import("@/hooks/use-activity-feed").PRSummary[] = [];
      if (prs.length > 0) {
        addPREvents(prs);
        for (const pr of prs) {
          const exName = getExercise(pr.exerciseId)?.name ?? "Übung";
          toast.success(`🏆 Neuer PR: ${exName}`, {
            description: `${PR_METRIC_LABELS[pr.metric]}: ${formatPRDiff(pr)}`,
            duration: 5000,
          });
          prSummaries.push({
            exerciseName: exName,
            weight: pr.weight,
            reps: pr.reps,
            diff: pr.diff,
            metric: pr.metric,
          });
        }
      }

      // Build workout payload for optional sharing
      const durationMs =
        new Date(finished.endTime!).getTime() - new Date(finished.startTime).getTime();
      const exercisesWithSets = finished.exercises.filter(e =>
        e.sets.some(s => s.completed)
      );
      const totalVolume = finished.exercises.reduce((acc, ex) =>
        acc + ex.sets
          .filter(s => s.completed && s.weight && s.reps)
          .reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0), 0
      );
      pendingShareRef.current = {
        workoutName: finished.name,
        exerciseCount: exercisesWithSets.length,
        durationMinutes: Math.round(durationMs / 60000),
        totalVolume,
        prs: prSummaries,
      };

      if (saveAsTemplate && templateName.trim()) {
        saveWorkoutAsTemplate(finished, templateName.trim());
        toast.success("Workout gespeichert & Vorlage erstellt");
      } else {
        toast.success("Workout gespeichert!");
      }
    }
    setFinishDialogOpen(false);
    setShareDialogOpen(true);
  };

  const handleDiscard = () => {
    discardWorkout();
    setDiscardDialogOpen(false);
    setFinishDialogOpen(false);
    setShowDiscardConfirm(false);
    router.push("/");
  };

  const handleToggleSet = (exerciseInstanceId: string, setId: string) => {
    // Check current state BEFORE toggling
    const workoutExercise = activeWorkout.exercises.find(e => e.id === exerciseInstanceId);
    const set = workoutExercise?.sets.find(s => s.id === setId);
    const wasCompleted = set?.completed ?? false;
    const exerciseDef = workoutExercise ? getExercise(workoutExercise.exerciseId) : null;
    const isCardio = exerciseDef?.muscleGroup === "cardio";

    toggleSetComplete(exerciseInstanceId, setId);

    // No rest timer for cardio
    if (isCardio) return;

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
              {exercise.muscleGroup === "cardio" ? (
                <div className="grid grid-cols-[28px_1fr_1fr_1fr_1fr_32px] gap-1 px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase">
                  <span className="text-center">Set</span>
                  <span className="text-center">Min</span>
                  <span className="text-center">km</span>
                  <span className="text-center">km/h</span>
                  <span className="text-center">Stg.%</span>
                  <span className="text-center"><Check className="h-3 w-3 mx-auto" /></span>
                </div>
              ) : (
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
              )}

              {/* Sets */}
              {we.sets.map((set, setIdx) => {
                const prevSet = previousSets?.[setIdx];
                const isCardio = exercise.muscleGroup === "cardio";
                return (
                  <div key={set.id} className="relative overflow-hidden">
                    {/* Swipe-to-delete background — only rendered while swiping */}
                    {swipedSetId === set.id && swipeOffset < 0 && (
                      <div className="absolute inset-0 flex items-center justify-end bg-destructive pr-4 pointer-events-none">
                        <Trash2 className="h-4 w-4 text-destructive-foreground" />
                      </div>
                    )}
                    {/* Swipe wrapper */}
                    <div
                      className="bg-background"
                      style={{
                        transform: swipedSetId === set.id ? `translateX(${swipeOffset}px)` : "translateX(0)",
                        transition: swipedSetId === set.id ? "none" : "transform 0.25s ease",
                      }}
                      onTouchStart={(e) => {
                        swipeTouchStartX.current = e.touches[0].clientX;
                        swipingSetId.current = set.id;
                        currentSwipeOffset.current = 0;
                        setSwipedSetId(set.id);
                        setSwipeOffset(0);
                      }}
                      onTouchMove={(e) => {
                        if (swipingSetId.current !== set.id) return;
                        const delta = e.touches[0].clientX - swipeTouchStartX.current;
                        const offset = delta < 0 ? Math.max(delta, -120) : 0;
                        currentSwipeOffset.current = offset;
                        setSwipeOffset(offset);
                      }}
                      onTouchEnd={() => {
                        if (swipingSetId.current === set.id && currentSwipeOffset.current < -SWIPE_DELETE_THRESHOLD) {
                          removeSet(we.id, set.id);
                        }
                        swipingSetId.current = null;
                        currentSwipeOffset.current = 0;
                        setSwipeOffset(0);
                        setSwipedSetId(null);
                      }}
                    >
                    {isCardio ? (
                      /* ── Cardio Set Row ── */
                      (() => {
                        const updateCardio = (field: keyof CardioData, val: string) =>
                          updateSet(we.id, set.id, {
                            cardio: {
                              durationMin: set.cardio?.durationMin ?? null,
                              distanceKm: set.cardio?.distanceKm ?? null,
                              speedKmh: set.cardio?.speedKmh ?? null,
                              incline: set.cardio?.incline ?? null,
                              calories: set.cardio?.calories ?? null,
                              [field]: val ? parseFloat(val) : null,
                            },
                          });
                        return (
                          <div className={cn(
                            "grid grid-cols-[28px_1fr_1fr_1fr_1fr_32px] gap-1 items-center px-3 py-1.5",
                            set.completed && "bg-primary/5"
                          )}>
                            <span className="text-xs font-medium text-muted-foreground text-center">{setIdx + 1}</span>
                            <Input type="number" inputMode="decimal" placeholder="-"
                              value={set.cardio?.durationMin ?? ""}
                              onChange={e => updateCardio("durationMin", e.target.value)}
                              className="h-9 text-center text-sm font-medium border-muted/50" />
                            <Input type="number" inputMode="decimal" placeholder="-"
                              value={set.cardio?.distanceKm ?? ""}
                              onChange={e => updateCardio("distanceKm", e.target.value)}
                              className="h-9 text-center text-sm font-medium border-muted/50" />
                            <Input type="number" inputMode="decimal" placeholder="-"
                              value={set.cardio?.speedKmh ?? ""}
                              onChange={e => updateCardio("speedKmh", e.target.value)}
                              className="h-9 text-center text-sm font-medium border-muted/50" />
                            <Input type="number" inputMode="decimal" placeholder="-"
                              value={set.cardio?.incline ?? ""}
                              onChange={e => updateCardio("incline", e.target.value)}
                              className="h-9 text-center text-sm font-medium border-muted/50" />
                            <div className="flex justify-center">
                              <Checkbox
                                checked={set.completed}
                                onCheckedChange={() => toggleSetComplete(we.id, set.id)}
                                className="h-6 w-6 rounded-md"
                              />
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      /* ── Strength Set Row ── */
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
                    )}

                    {/* RPE row (only for strength) */}
                    {!isCardio && set.rpe && (
                      <div className="flex justify-end px-3 pb-1">
                        <Badge variant="outline" className="text-[10px] h-5">
                          RPE {set.rpe}
                        </Badge>
                      </div>
                    )}

                    {/* Inline Rest Timer — only for strength */}
                    {!isCardio && activeExerciseId === we.id && activeSetId === set.id && (isRunning || timeRemaining > 0) && (
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
                    </div>{/* end swipe wrapper */}
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

      {/* Exercise Picker */}
      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAddExercises}
      />

      {/* Finish Dialog */}
      <Dialog
        open={finishDialogOpen}
        onOpenChange={(open) => {
          setFinishDialogOpen(open);
          if (!open) setShowDiscardConfirm(false);
        }}
      >
        <DialogContent>
          {showDiscardConfirm ? (
            <>
              <DialogHeader>
                <DialogTitle>Bist du sicher?</DialogTitle>
                <DialogDescription>
                  Dein Workout wird nicht gespeichert und geht verloren.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDiscardConfirm(false)}>
                  Zurück
                </Button>
                <Button variant="destructive" onClick={handleDiscard}>
                  Verwerfen
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Workout beenden?</DialogTitle>
                {!isUserTemplate && (
                  <DialogDescription>Dein Workout wird gespeichert.</DialogDescription>
                )}
              </DialogHeader>
              {!isUserTemplate && (
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
              )}
              <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setFinishDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDiscardConfirm(true)}
                >
                  Beenden ohne Speichern
                </Button>
                <Button onClick={handleFinish}>Speichern</Button>
              </DialogFooter>
            </>
          )}
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

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={() => handleShare(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workout teilen?</DialogTitle>
            <DialogDescription>
              Wähle, wer dein Workout sehen kann. PRs werden mit dem gleichen Sichtbarkeits-Setting geteilt.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-1">
            <button
              onClick={() => handleShare("global")}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Global</p>
                <p className="text-xs text-muted-foreground">Alle FitTrack-Nutzer können es sehen</p>
              </div>
            </button>
            <button
              onClick={() => handleShare("friends")}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Nur Freunde</p>
                <p className="text-xs text-muted-foreground">Nur deine Freunde sehen es</p>
              </div>
            </button>
            <button
              onClick={() => handleShare(null)}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <X className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Nicht teilen</p>
                <p className="text-xs text-muted-foreground">Nur in deinem eigenen Verlauf sichtbar</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { WorkoutPageInner };

