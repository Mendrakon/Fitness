"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { KlettersteigSession, KlettersteigWeather } from "@/lib/types";

type DbSession = {
  id: string;
  user_id: string;
  route_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  extra_weight_kg: number;
  weather: KlettersteigWeather;
  notes: string;
  created_at: string;
};

function toSession(row: DbSession): KlettersteigSession {
  return {
    id: row.id,
    userId: row.user_id,
    routeId: row.route_id,
    startTime: row.start_time,
    endTime: row.end_time,
    durationSeconds: row.duration_seconds,
    extraWeightKg: Number(row.extra_weight_kg),
    weather: row.weather,
    notes: row.notes,
  };
}

function toRow(session: KlettersteigSession, userId: string) {
  return {
    id: session.id,
    user_id: userId,
    route_id: session.routeId,
    start_time: session.startTime,
    end_time: session.endTime,
    duration_seconds: session.durationSeconds,
    extra_weight_kg: session.extraWeightKg,
    weather: session.weather,
    notes: session.notes,
  };
}

export function useKlettersteigSessions() {
  const [sessions, setSessions] = useState<KlettersteigSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      client
        .from("klettersteig_sessions")
        .select("*")
        .order("start_time", { ascending: false })
        .then(({ data }) => {
          if (data) setSessions(data.map(toSession));
          setLoading(false);
        });
    });
  }, []);

  const save = useCallback(async (session: KlettersteigSession) => {
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    await client.from("klettersteig_sessions").upsert(toRow(session, user.id));

    setSessions((prev) => {
      const exists = prev.find((s) => s.id === session.id);
      if (exists) return prev.map((s) => (s.id === session.id ? session : s));
      return [session, ...prev];
    });
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    const client = createClient();
    await client.from("klettersteig_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getForRoute = useCallback(
    (routeId: string) =>
      sessions
        .filter((s) => s.routeId === routeId && s.endTime)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [sessions]
  );

  const getBestTime = useCallback(
    (routeId: string) => {
      const routeSessions = sessions.filter((s) => s.routeId === routeId && s.endTime);
      if (routeSessions.length === 0) return null;
      return Math.min(...routeSessions.map((s) => s.durationSeconds));
    },
    [sessions]
  );

  const getMaxWeight = useCallback(
    (routeId: string) => {
      const routeSessions = sessions.filter((s) => s.routeId === routeId && s.endTime);
      if (routeSessions.length === 0) return null;
      return Math.max(...routeSessions.map((s) => s.extraWeightKg));
    },
    [sessions]
  );

  const getRecent = useCallback(
    (limit: number) =>
      sessions
        .filter((s) => s.endTime)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, limit),
    [sessions]
  );

  return {
    sessions,
    loading,
    save,
    deleteSession,
    getForRoute,
    getBestTime,
    getMaxWeight,
    getRecent,
  };
}
