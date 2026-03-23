"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { KlettersteigBadge } from "@/lib/types";

type DbBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  session_id: string;
};

function toBadge(row: DbBadge): KlettersteigBadge {
  return {
    id: row.id,
    userId: row.user_id,
    badgeId: row.badge_id,
    earnedAt: row.earned_at,
    sessionId: row.session_id,
  };
}

function toRow(badge: KlettersteigBadge) {
  return {
    id: badge.id,
    user_id: badge.userId,
    badge_id: badge.badgeId,
    earned_at: badge.earnedAt,
    session_id: badge.sessionId,
  };
}

export function useKlettersteigBadges() {
  const [badges, setBadges] = useState<KlettersteigBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      client
        .from("klettersteig_badges")
        .select("*")
        .order("earned_at", { ascending: false })
        .then(({ data }) => {
          if (data) setBadges(data.map(toBadge));
          setLoading(false);
        });
    });
  }, []);

  const addBadges = useCallback(async (newBadges: KlettersteigBadge[]) => {
    if (newBadges.length === 0) return;
    const client = createClient();
    const rows = newBadges.map(toRow);
    await client.from("klettersteig_badges").upsert(rows);
    setBadges((prev) => {
      const ids = new Set(newBadges.map((b) => b.id));
      const filtered = prev.filter((b) => !ids.has(b.id));
      return [...newBadges, ...filtered].sort(
        (a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
      );
    });
  }, []);

  return { badges, loading, addBadges };
}
