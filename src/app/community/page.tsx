"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { v4 as uuid } from "uuid";
import {
  Heart, MessageCircle, Trophy, Dumbbell, RefreshCw, ChevronDown, ChevronUp, Send,
  LayoutTemplate, Check,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useActivityFeed,
  type FeedEvent,
  type FeedFilter,
  type WorkoutPayload,
  type PRSummary,
  type FeedComment,
  type CurrentUserProfile,
  type TemplateSharePayload,
} from "@/hooks/use-activity-feed";
import { useTemplates } from "@/hooks/use-templates";
import { PR_METRIC_LABELS } from "@/lib/types";
import type { Template } from "@/lib/types";

// ── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className="h-10 w-10 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
      {username.charAt(0).toUpperCase()}
    </div>
  );
}

// ── PR row inside workout card ────────────────────────────────────────────────

function PRRow({ pr }: { pr: PRSummary }) {
  const metricLabel = PR_METRIC_LABELS[pr.metric as keyof typeof PR_METRIC_LABELS] ?? pr.metric;
  const diffSign = pr.diff > 0 ? "+" : "";
  const isReps = pr.metric === "reps" || pr.metric === "reps_bw";
  return (
    <div className="flex items-center gap-2 py-2">
      <Trophy className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium truncate">{pr.exerciseName}</span>
        <span className="text-xs text-muted-foreground">
          {" · "}
          {pr.weight > 0 ? `${pr.weight} kg × ${pr.reps}` : `${pr.reps} Wdh`}
          {" · "}{metricLabel}
        </span>
      </div>
      <span className="text-xs font-bold text-yellow-600 shrink-0">
        {diffSign}{pr.diff % 1 === 0 ? pr.diff : pr.diff.toFixed(1)}{isReps ? " Wdh" : " kg"}
      </span>
    </div>
  );
}

// ── Workout card content ──────────────────────────────────────────────────────

function WorkoutContent({ payload }: { payload: WorkoutPayload }) {
  const [showPRs, setShowPRs] = useState(false);
  const hours = Math.floor(payload.durationMinutes / 60);
  const mins = payload.durationMinutes % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  const prs = Array.isArray(payload.prs) ? payload.prs : [];
  const hasPRs = prs.length > 0;

  return (
    <div className="mt-2 rounded-xl border border-border bg-muted/40 overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Dumbbell className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{payload.workoutName}</p>
          <p className="text-xs text-muted-foreground">
            {payload.exerciseCount} Übungen · {durationStr}
            {payload.totalVolume > 0 && ` · ${Math.round(payload.totalVolume).toLocaleString("de-DE")} kg`}
          </p>
        </div>
        {hasPRs && (
          <button
            onClick={() => setShowPRs((v) => !v)}
            className="flex items-center gap-1 shrink-0 rounded-lg bg-yellow-500/10 px-3 min-h-[44px] text-yellow-700 hover:bg-yellow-500/20 active:bg-yellow-500/30 transition-colors"
          >
            <Trophy className="h-3 w-3" />
            <span className="text-xs font-semibold">{prs.length} PR{prs.length > 1 ? "s" : ""}</span>
            {showPRs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>
      {hasPRs && showPRs && (
        <div className="border-t border-border/60 px-3 pb-2 divide-y divide-border/40">
          {prs.map((pr, i) => <PRRow key={i} pr={pr} />)}
        </div>
      )}
    </div>
  );
}

// ── Set summary helper ────────────────────────────────────────────────────────

function formatSets(sets: TemplateSharePayload["exercises"][0]["sets"]): string {
  // Group by reps count and format as "3 × 8, 1 × 6 Wdh"
  const groups = new Map<number | null, number>();
  for (const s of sets) {
    groups.set(s.reps, (groups.get(s.reps) ?? 0) + 1);
  }
  return Array.from(groups.entries())
    .map(([reps, count]) => `${count} × ${reps ?? "?"} Wdh`)
    .join(", ");
}

// ── Template share card content ───────────────────────────────────────────────

function TemplateShareContent({
  payload,
  eventId,
  templates,
  isOwnEvent,
  onSave,
}: {
  payload: TemplateSharePayload;
  eventId: string;
  templates: Template[];
  isOwnEvent: boolean;
  onSave: (payload: TemplateSharePayload, eventId: string) => void;
}) {
  const [showExercises, setShowExercises] = useState(false);
  const alreadySaved = templates.some((t) => t.sourceEventId === eventId);

  return (
    <div className="mt-2 rounded-xl border border-border bg-muted/40 overflow-hidden">
      {/* Template header row */}
      <div className="flex items-center gap-2 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
          <LayoutTemplate className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{payload.templateName}</p>
          <p className="text-xs text-muted-foreground">
            {payload.exercises.length} Übungen
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Details toggle — 44pt touch target */}
          <button
            onClick={() => setShowExercises((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-muted px-3 min-h-[44px] text-xs font-medium text-foreground hover:bg-muted/60 active:bg-muted/40 transition-colors"
          >
            Details
            {showExercises ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {/* Save button — 44pt touch target */}
          {!isOwnEvent && (alreadySaved ? (
            <div className="flex items-center gap-1 px-3 min-h-[44px] text-xs font-medium text-green-600">
              <Check className="h-3.5 w-3.5" />
              <span>Gespeichert</span>
            </div>
          ) : (
            <button
              onClick={() => onSave(payload, eventId)}
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 min-h-[44px] text-xs font-medium text-primary hover:bg-primary/20 active:bg-primary/30 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Speichern</span>
            </button>
          ))}
        </div>
      </div>

      {/* Exercise list */}
      {showExercises && (
        <div className="border-t border-border/60 divide-y divide-border/40">
          {payload.exercises.map((ex, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 shrink-0">
                <Dumbbell className="h-3 w-3 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{ex.exerciseName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatSets(ex.sets)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Comment section ───────────────────────────────────────────────────────────

function CommentSection({
  eventId,
  currentUserProfile,
  fetchComments,
  addComment,
}: {
  eventId: string;
  currentUserProfile: CurrentUserProfile | null;
  fetchComments: (id: string) => Promise<FeedComment[]>;
  addComment: (id: string, text: string) => Promise<void>;
}) {
  const [comments, setComments] = useState<FeedComment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchComments(eventId);
    setComments(data);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;

    const savedText = text.trim();
    const tempId = `temp-${Date.now()}`;

    const optimisticComment: FeedComment = {
      id: tempId,
      eventId,
      userId: currentUserProfile?.userId ?? "",
      content: savedText,
      createdAt: new Date().toISOString(),
      profile: {
        username: currentUserProfile?.username ?? "Du",
        avatarUrl: currentUserProfile?.avatarUrl ?? null,
      },
    };
    setText("");
    setSending(true);
    setComments((prev) => [...(prev ?? []), optimisticComment]);

    try {
      await addComment(eventId, savedText);
      const data = await fetchComments(eventId);
      setComments(data);
    } catch {
      setComments((prev) => (prev ?? []).filter((c) => c.id !== tempId));
      setText(savedText);
    } finally {
      setSending(false);
    }
  };

  if (comments === null && !loading) {
    load();
    return <div className="h-8 flex items-center"><Skeleton className="h-3 w-32" /></div>;
  }

  if (loading) {
    return (
      <div className="space-y-2 pt-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      {comments?.map((c) => (
        <div key={c.id} className={cn("flex gap-2", c.id.startsWith("temp-") && "opacity-60")}>
          <Avatar username={c.profile.username} avatarUrl={c.profile.avatarUrl} />
          <div className="rounded-xl bg-muted/60 px-3 py-2 flex-1 min-w-0">
            <span className="text-xs font-semibold">{c.profile.username} </span>
            <span className="text-xs text-muted-foreground">{c.content}</span>
          </div>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Kommentar schreiben..."
          className="h-11 text-sm"
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-11 w-11 shrink-0"
          onClick={handleSend}
          disabled={sending || !text.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Feed Card ─────────────────────────────────────────────────────────────────

function FeedCard({
  event,
  currentUserProfile,
  templates,
  onLike,
  onSaveTemplate,
  fetchComments,
  addComment,
}: {
  event: FeedEvent;
  currentUserProfile: CurrentUserProfile | null;
  templates: Template[];
  onLike: (id: string) => void;
  onSaveTemplate: (payload: TemplateSharePayload, eventId: string) => void;
  fetchComments: (id: string) => Promise<FeedComment[]>;
  addComment: (id: string, text: string) => Promise<void>;
}) {
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: de });

  const isLikeAnimating = useRef(false);
  const handleLike = () => {
    if (isLikeAnimating.current) return;
    isLikeAnimating.current = true;
    onLike(event.id);
    setTimeout(() => { isLikeAnimating.current = false; }, 300);
  };

  const goToProfile = () => router.push(`/profile/${event.userId}`);

  const subtitle =
    event.type === "template_share"
      ? "hat eine Vorlage geteilt"
      : "hat ein Workout abgeschlossen";

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={goToProfile}
          className="shrink-0 -m-1 p-1 rounded-full"
          style={{ minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Avatar username={event.profile.username} avatarUrl={event.profile.avatarUrl} />
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={goToProfile} className="text-left min-h-[44px] flex items-center">
            <p className="text-sm font-semibold truncate hover:underline">{event.profile.username}</p>
          </button>
          <p className="text-xs text-muted-foreground -mt-2">{subtitle}</p>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0 pt-1">{timeAgo}</span>
      </div>

      {/* Content — workout or template */}
      {event.type === "template_share" ? (
        <TemplateShareContent
          payload={event.payload as TemplateSharePayload}
          eventId={event.id}
          templates={templates}
          isOwnEvent={event.userId === currentUserProfile?.userId}
          onSave={onSaveTemplate}
        />
      ) : (
        <WorkoutContent payload={event.payload as WorkoutPayload} />
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 -mx-1">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-colors min-h-[44px] min-w-[44px] px-2 rounded-xl active:scale-95",
            event.likedByMe ? "text-red-500" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className={cn("h-[18px] w-[18px]", event.likedByMe && "fill-current")} />
          <span className="tabular-nums">{event.likeCount > 0 ? event.likeCount : ""}</span>
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] px-2 rounded-xl active:scale-95"
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          <span className="tabular-nums">{event.commentCount > 0 ? event.commentCount : ""}</span>
          {showComments ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {showComments && (
        <CommentSection
          eventId={event.id}
          currentUserProfile={currentUserProfile}
          fetchComments={fetchComments}
          addComment={addComment}
        />
      )}
    </div>
  );
}

// ── Feed Skeleton ─────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card px-4 py-3 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-16 rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyFeed({ filter }: { filter: FeedFilter }) {
  return (
    <div className="flex flex-col items-center py-16 text-center gap-3">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Dumbbell className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">Noch nichts hier</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          {filter === "friends"
            ? "Deine Freunde haben noch keine Workouts geteilt. Füge mehr Freunde hinzu!"
            : "Beende dein erstes Workout und teile es, um es im Feed zu sehen."}
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [filter, setFilter] = useState<FeedFilter>("global");
  const { events, loading, currentUserProfile, toggleLike, fetchComments, addComment, refresh } =
    useActivityFeed(filter);
  const { templates, create: createTemplate } = useTemplates();

  const handleSaveTemplate = (payload: TemplateSharePayload, eventId: string) => {
    if (templates.some((t) => t.sourceEventId === eventId)) return;
    const event = events.find((e) => e.id === eventId);
    if (event?.userId === currentUserProfile?.userId) return;
    createTemplate({
      name: payload.templateName,
      folderId: null,
      notes: "",
      sourceEventId: eventId,
      exercises: payload.exercises.map((ex) => ({
        id: uuid(),
        exerciseId: ex.exerciseId,
        notes: "",
        sets: ex.sets.map((s) => ({
          id: uuid(),
          weight: null,
          reps: s.reps,
          tag: s.tag,
          rpe: null,
        })),
      })),
    });
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Community"
        rightAction={
          <button
            onClick={refresh}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {(["global", "friends"] as FeedFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 rounded-lg py-3 text-xs font-medium transition-all active:scale-[0.98]",
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "global" ? "Global" : "Freunde"}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-3 px-4 py-3">
        {loading ? (
          <FeedSkeleton />
        ) : events.length === 0 ? (
          <EmptyFeed filter={filter} />
        ) : (
          events.map((event) => (
            <FeedCard
              key={event.id}
              event={event}
              currentUserProfile={currentUserProfile}
              templates={templates}
              onLike={toggleLike}
              onSaveTemplate={handleSaveTemplate}
              fetchComments={fetchComments}
              addComment={addComment}
            />
          ))
        )}
      </div>
    </div>
  );
}
