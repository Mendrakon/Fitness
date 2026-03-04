"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import type {
  Template,
  SetTag,
  Exercise,
  ExerciseCategory,
  MuscleGroup,
} from "@/lib/types";

export type FeedEventType = "pr" | "workout_complete" | "template_share";

// ── Template share payload ────────────────────────────────────────────────────

export interface TemplateShareExercise {
  exerciseId: string;
  exerciseName: string;
  customExercise: SharedCustomExercise | null;
  sets: Array<{ reps: number | null; tag: SetTag }>;
}

export interface TemplateSharePayload {
  templateName: string;
  exercises: TemplateShareExercise[];
}

export interface SharedCustomExercise {
  name: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup;
  equipment: string;
  pinnedNote: string | null;
  defaultRestTimerWork: number | null;
  defaultRestTimerWarmup: number | null;
}

const TEMPLATE_SET_TAGS: Set<Exclude<SetTag, null>> = new Set([
  "warmup",
  "dropset",
  "failure",
]);
const EXERCISE_CATEGORIES: Set<ExerciseCategory> = new Set([
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "band",
  "kettlebell",
  "other",
]);
const MUSCLE_GROUPS: Set<MuscleGroup> = new Set([
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "full_body",
  "cardio",
  "other",
]);

function normalizeSetTag(tag: unknown): SetTag {
  if (tag === null || tag === undefined) return null;
  if (typeof tag !== "string") return null;
  return TEMPLATE_SET_TAGS.has(tag as Exclude<SetTag, null>)
    ? (tag as Exclude<SetTag, null>)
    : null;
}

function normalizeExerciseCategory(category: unknown): ExerciseCategory {
  if (typeof category !== "string") return "other";
  return EXERCISE_CATEGORIES.has(category as ExerciseCategory)
    ? (category as ExerciseCategory)
    : "other";
}

function normalizeMuscleGroup(muscleGroup: unknown): MuscleGroup {
  if (typeof muscleGroup !== "string") return "other";
  return MUSCLE_GROUPS.has(muscleGroup as MuscleGroup)
    ? (muscleGroup as MuscleGroup)
    : "other";
}

function normalizeCustomExercise(
  customExercise: unknown,
  fallbackName: string
): SharedCustomExercise | null {
  if (!customExercise || typeof customExercise !== "object") return null;
  const raw = customExercise as {
    name?: unknown;
    category?: unknown;
    muscleGroup?: unknown;
    equipment?: unknown;
    pinnedNote?: unknown;
    defaultRestTimerWork?: unknown;
    defaultRestTimerWarmup?: unknown;
  };
  return {
    name:
      typeof raw.name === "string" && raw.name.trim().length > 0
        ? raw.name
        : fallbackName,
    category: normalizeExerciseCategory(raw.category),
    muscleGroup: normalizeMuscleGroup(raw.muscleGroup),
    equipment: typeof raw.equipment === "string" ? raw.equipment : "",
    pinnedNote: typeof raw.pinnedNote === "string" ? raw.pinnedNote : null,
    defaultRestTimerWork:
      typeof raw.defaultRestTimerWork === "number" ? raw.defaultRestTimerWork : null,
    defaultRestTimerWarmup:
      typeof raw.defaultRestTimerWarmup === "number" ? raw.defaultRestTimerWarmup : null,
  };
}

function normalizeTemplateSharePayload(payload: unknown): TemplateSharePayload {
  const raw = payload as {
    templateName?: unknown;
    exercises?: Array<{
      exerciseId?: unknown;
      exerciseName?: unknown;
      customExercise?: unknown;
      sets?: Array<{ reps?: unknown; tag?: unknown }>;
    }>;
  };

  const exercises: TemplateShareExercise[] = [];
  const rawExercises = Array.isArray(raw?.exercises) ? raw.exercises : [];

  for (const exercise of rawExercises) {
    if (typeof exercise?.exerciseId !== "string" || !exercise.exerciseId) continue;

    const exerciseName =
      typeof exercise.exerciseName === "string" && exercise.exerciseName.trim().length > 0
        ? exercise.exerciseName
        : "Unbekannte Uebung";
    const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
    exercises.push({
      exerciseId: exercise.exerciseId,
      exerciseName,
      customExercise: normalizeCustomExercise(exercise.customExercise, exerciseName),
      // Keep only reps + tag from shared payload (no carried-over weights).
      sets: sets.map((set) => ({
        reps: typeof set?.reps === "number" ? set.reps : null,
        tag: normalizeSetTag(set?.tag),
      })),
    });
  }

  return {
    templateName:
      typeof raw?.templateName === "string" && raw.templateName.trim().length > 0
        ? raw.templateName
        : "Geteilte Vorlage",
    exercises,
  };
}

// Standalone function – does NOT mount the full feed hook.
export async function shareTemplateToFeed(
  template: Template,
  getExerciseById: (id: string) => Exercise | undefined,
  visibility: FeedVisibility = "global"
): Promise<void> {
  const client = createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;

  const payload: TemplateSharePayload = {
    templateName: template.name,
    exercises: template.exercises.map((te) => {
      const exercise = getExerciseById(te.exerciseId);
      const exerciseName = exercise?.name ?? "Unbekannte Uebung";
      return {
        exerciseId: te.exerciseId,
        exerciseName,
        customExercise: exercise?.isCustom
          ? {
              name: exercise.name,
              category: exercise.category,
              muscleGroup: exercise.muscleGroup,
              equipment: exercise.equipment,
              pinnedNote: exercise.pinnedNote ?? null,
              defaultRestTimerWork: exercise.defaultRestTimerWork ?? null,
              defaultRestTimerWarmup: exercise.defaultRestTimerWarmup ?? null,
            }
          : null,
        sets: te.sets.map((s) => ({ reps: s.reps, tag: s.tag })),
      };
    }),
  };

  await client.from("feed_events").insert({
    user_id: user.id,
    type: "template_share",
    visibility,
    payload,
  });
}

export interface PRSummary {
  exerciseName: string;
  weight: number;
  reps: number;
  diff: number;
  metric: string;
}

export interface WorkoutPayload {
  workoutName: string;
  exerciseCount: number;
  durationMinutes: number;
  totalVolume: number;
  prs: PRSummary[];
}

export interface FeedEvent {
  id: string;
  userId: string;
  type: FeedEventType;
  payload: WorkoutPayload | TemplateSharePayload;
  createdAt: string;
  profile: {
    username: string;
    avatarUrl: string | null;
  };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

export interface FeedComment {
  id: string;
  eventId: string;
  userId: string;
  content: string;
  createdAt: string;
  profile: {
    username: string;
    avatarUrl: string | null;
  };
}

export type FeedFilter = "global" | "friends";
export type FeedVisibility = "global" | "friends";

export interface CurrentUserProfile {
  userId: string;
  username: string;
  avatarUrl: string | null;
}

export function useActivityFeed(filter: FeedFilter = "global") {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null);
  const currentUserId = useRef<string | null>(null);

  // Load current user and friend IDs
  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      currentUserId.current = user.id;

      const [{ data: friendships }, { data: profile }] = await Promise.all([
        client
          .from("friendships")
          .select("sender_id, receiver_id")
          .eq("status", "accepted")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
        client
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single(),
      ]);

      const ids = (friendships ?? []).map((f) =>
        f.sender_id === user.id ? f.receiver_id : f.sender_id
      );
      setFriendIds(ids);
      if (profile) {
        setCurrentUserProfile({
          userId: user.id,
          username: profile.username ?? "Du",
          avatarUrl: profile.avatar_url ?? null,
        });
      }
    });
  }, []);

  const fetchFeed = useCallback(async () => {
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) { setLoading(false); return; }

    setLoading(true);

    let query = client
      .from("feed_events")
      .select(`
        id, user_id, type, payload, created_at,
        profiles!feed_events_user_id_fkey(username, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter === "friends") {
      const allowedIds = [...friendIds, user.id];
      query = query.in("user_id", allowedIds.length > 0 ? allowedIds : ["__none__"]);
    }

    const { data: rows } = await query;
    if (!rows) { setLoading(false); return; }

    const eventIds = rows.map((r) => r.id);

    // Fetch reactions
    const { data: reactions } = await client
      .from("feed_reactions")
      .select("event_id, user_id")
      .in("event_id", eventIds.length > 0 ? eventIds : ["__none__"]);

    // Fetch comment counts
    const { data: comments } = await client
      .from("feed_comments")
      .select("event_id")
      .in("event_id", eventIds.length > 0 ? eventIds : ["__none__"]);

    const reactionsByEvent = new Map<string, { count: number; likedByMe: boolean }>();
    for (const r of reactions ?? []) {
      const entry = reactionsByEvent.get(r.event_id) ?? { count: 0, likedByMe: false };
      entry.count++;
      if (r.user_id === user.id) entry.likedByMe = true;
      reactionsByEvent.set(r.event_id, entry);
    }

    const commentCountByEvent = new Map<string, number>();
    for (const c of comments ?? []) {
      commentCountByEvent.set(c.event_id, (commentCountByEvent.get(c.event_id) ?? 0) + 1);
    }

    const mapped: FeedEvent[] = rows.map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const rxn = reactionsByEvent.get(row.id) ?? { count: 0, likedByMe: false };
      const type = row.type as FeedEventType;
      const payload =
        type === "template_share"
          ? normalizeTemplateSharePayload(row.payload)
          : (row.payload as WorkoutPayload);
      return {
        id: row.id,
        userId: row.user_id,
        type,
        payload,
        createdAt: row.created_at,
        profile: {
          username: profile?.username ?? "Unknown",
          avatarUrl: profile?.avatar_url ?? null,
        },
        likeCount: rxn.count,
        commentCount: commentCountByEvent.get(row.id) ?? 0,
        likedByMe: rxn.likedByMe,
      };
    });

    setEvents(mapped);
    setLoading(false);
  }, [filter, friendIds]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const toggleLike = useCallback(async (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    // Optimistic update immediately
    const wasLiked = event.likedByMe;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, likedByMe: !wasLiked, likeCount: wasLiked ? e.likeCount - 1 : e.likeCount + 1 }
          : e
      )
    );

    try {
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (wasLiked) {
        const { error } = await client
          .from("feed_reactions")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await client
          .from("feed_reactions")
          .insert({ event_id: eventId, user_id: user.id });
        if (error) throw error;
      }
    } catch {
      // Rollback on error
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? event : e))
      );
    }
  }, [events]);

  const fetchComments = useCallback(async (eventId: string): Promise<FeedComment[]> => {
    const client = createClient();
    const { data } = await client
      .from("feed_comments")
      .select(`
        id, event_id, user_id, content, created_at,
        profiles!feed_comments_user_id_fkey(username, avatar_url)
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (!data) return [];
    return data.map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        id: row.id,
        eventId: row.event_id,
        userId: row.user_id,
        content: row.content,
        createdAt: row.created_at,
        profile: {
          username: profile?.username ?? "Unknown",
          avatarUrl: profile?.avatar_url ?? null,
        },
      };
    });
  }, []);

  const addComment = useCallback(async (eventId: string, content: string) => {
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user || !content.trim()) return;

    const { error } = await client.from("feed_comments").insert({
      event_id: eventId,
      user_id: user.id,
      content: content.trim(),
    });

    if (error) throw error;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, commentCount: e.commentCount + 1 } : e
      )
    );
  }, []);

  const createFeedEvent = useCallback(
    async (
      type: FeedEventType,
      payload: WorkoutPayload,
      visibility: FeedVisibility = "global"
    ) => {
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) return;

      await client.from("feed_events").insert({
        user_id: user.id,
        type,
        visibility,
        payload,
      });
    },
    []
  );

  return {
    events,
    loading,
    currentUserProfile,
    toggleLike,
    fetchComments,
    addComment,
    createFeedEvent,
    refresh: fetchFeed,
  };
}

