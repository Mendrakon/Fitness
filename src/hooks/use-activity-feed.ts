"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";

export type FeedEventType = "pr" | "workout_complete";

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
  payload: WorkoutPayload;
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
      return {
        id: row.id,
        userId: row.user_id,
        type: row.type as FeedEventType,
        payload: row.payload as WorkoutPayload,
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
