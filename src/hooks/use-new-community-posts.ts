"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

const STORAGE_KEY = "community_last_seen";

export function useNewCommunityPosts() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const onCommunityPage = pathname === "/community";

  // Mark as seen and reset badge when user is on the community page
  useEffect(() => {
    if (onCommunityPage) {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      setCount(0);
    }
  }, [onCommunityPage]);

  useEffect(() => {
    if (onCommunityPage) return;

    const supabase = createClient();
    let cleanup: (() => void) | undefined;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Seed lastSeen on first use
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
        return;
      }

      const lastSeen = localStorage.getItem(STORAGE_KEY)!;

      // Initial count of posts since last visit
      const { count: initial } = await supabase
        .from("feed_events")
        .select("id", { count: "exact", head: true })
        .gt("created_at", lastSeen);

      setCount(initial ?? 0);

      // Realtime: increment badge on new posts
      const channel = supabase
        .channel("community-new-posts")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "feed_events" },
          () => {
            setCount((c) => c + 1);
          }
        )
        .subscribe();

      cleanup = () => {
        supabase.removeChannel(channel);
      };
    }

    init();
    return () => cleanup?.();
  }, [onCommunityPage]);

  return count;
}
