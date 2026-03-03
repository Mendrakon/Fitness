"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export function usePendingRequests() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let cleanup: (() => void) | undefined;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Initialer Wert
      const { count: initial } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      setCount(initial ?? 0);

      // Realtime: neue Anfragen rein
      const channel = supabase
        .channel(`pending-requests-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "friendships",
            filter: `receiver_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new.status === "pending") {
              setCount((c) => c + 1);
              // In-App Notification wenn Permission schon erteilt
              if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                new Notification("Neue Freundschaftsanfrage! 👋", {
                  body: "Jemand möchte mit dir befreundet sein.",
                  icon: "/icon-192.png",
                  tag: "friend-request",
                });
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "friendships",
            filter: `receiver_id=eq.${user.id}`,
          },
          async () => {
            // Count neu laden wenn eine Anfrage beantwortet wurde
            const { count: updated } = await supabase
              .from("friendships")
              .select("*", { count: "exact", head: true })
              .eq("receiver_id", user.id)
              .eq("status", "pending");
            setCount(updated ?? 0);
          }
        )
        .subscribe();

      cleanup = () => {
        supabase.removeChannel(channel);
      };
    }

    init();
    return () => cleanup?.();
  }, []);

  return count;
}
