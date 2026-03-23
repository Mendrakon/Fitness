"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { KlettersteigPREvent } from "@/lib/types";

type DbPREvent = {
  id: string;
  user_id: string;
  route_id: string;
  session_id: string;
  date: string;
  metric: string;
  new_value: number;
  old_value: number;
  diff: number;
  diff_percent: number;
  duration_seconds: number;
  extra_weight_kg: number;
};

function toPREvent(row: DbPREvent): KlettersteigPREvent {
  return {
    id: row.id,
    userId: row.user_id,
    routeId: row.route_id,
    sessionId: row.session_id,
    date: row.date,
    metric: row.metric as KlettersteigPREvent["metric"],
    newValue: Number(row.new_value),
    oldValue: Number(row.old_value),
    diff: Number(row.diff),
    diffPercent: Number(row.diff_percent),
    durationSeconds: row.duration_seconds,
    extraWeightKg: Number(row.extra_weight_kg),
  };
}

function toRow(pr: KlettersteigPREvent) {
  return {
    id: pr.id,
    user_id: pr.userId,
    route_id: pr.routeId,
    session_id: pr.sessionId,
    date: pr.date,
    metric: pr.metric,
    new_value: pr.newValue,
    old_value: pr.oldValue,
    diff: pr.diff,
    diff_percent: pr.diffPercent,
    duration_seconds: pr.durationSeconds,
    extra_weight_kg: pr.extraWeightKg,
  };
}

export function useKlettersteigPRs() {
  const [prEvents, setPREvents] = useState<KlettersteigPREvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      client
        .from("klettersteig_pr_events")
        .select("*")
        .order("date", { ascending: false })
        .then(({ data }) => {
          if (data) setPREvents(data.map(toPREvent));
          setLoading(false);
        });
    });
  }, []);

  const addPREvents = useCallback(async (events: KlettersteigPREvent[]) => {
    if (events.length === 0) return;
    const client = createClient();
    const rows = events.map(toRow);
    await client.from("klettersteig_pr_events").upsert(rows);
    setPREvents((prev) => {
      const ids = new Set(events.map((e) => e.id));
      const filtered = prev.filter((p) => !ids.has(p.id));
      return [...events, ...filtered].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
  }, []);

  const getForRoute = useCallback(
    (routeId: string) => prEvents.filter((p) => p.routeId === routeId),
    [prEvents]
  );

  const getRecent = useCallback(
    (limit: number) => prEvents.slice(0, limit),
    [prEvents]
  );

  return { prEvents, loading, addPREvents, getForRoute, getRecent };
}
