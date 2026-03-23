"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useKlettersteigBadges } from "@/hooks/use-klettersteig-badges";
import { useKlettersteigSessions } from "@/hooks/use-klettersteig-sessions";
import { BADGE_DEFINITIONS } from "@/lib/klettersteig-badges";
import { GEBIRGE_LOCATIONS, getLocationName } from "@/lib/klettersteig-locations";
import { createClient } from "@/lib/supabase";
import type { BadgeCategory, KlettersteigBadge } from "@/lib/types";
import { Button } from "@/components/ui/button";

const CATEGORY_LABELS: Record<BadgeCategory | "all", string> = {
  all: "Alle",
  routen: "🗺️ Routen",
  speed: "⚡ Speed",
  gewicht: "🎒 Gewicht",
  kombi: "🔥 Kombi",
};

const CATEGORIES: (BadgeCategory | "all")[] = ["all", "routen", "speed", "gewicht", "kombi"];

export default function ChallengesPage() {
  const { badges, loading: badgesLoading, addBadges } = useKlettersteigBadges();
  const { sessions, loading: sessionsLoading } = useKlettersteigSessions();
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | "all">("all");
  const [activeGebirge, setActiveGebirge] = useState<string | "all">("all");

  // Compute which badges are earned directly from session data (source of truth)
  const earnedFromSessions = useMemo(
    () => new Set(BADGE_DEFINITIONS.filter((def) => def.check(sessions)).map((d) => d.id)),
    [sessions]
  );

  // DB records keyed by badgeId (for earned date display)
  const badgeRecordMap = useMemo(
    () => new Map(badges.map((b) => [b.badgeId, b])),
    [badges]
  );

  // Backfill: save any earned badges that are not yet in the DB
  useEffect(() => {
    if (badgesLoading || sessionsLoading || sessions.length === 0) return;
    const storedIds = new Set(badges.map((b) => b.badgeId));
    const missing = [...earnedFromSessions].filter((id) => !storedIds.has(id));
    if (missing.length === 0) return;

    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const now = new Date().toISOString();
      const toSave: KlettersteigBadge[] = missing.map((badgeId) => ({
        id: `${badgeId}_${user.id}`,
        userId: user.id,
        badgeId,
        earnedAt: now,
        sessionId: sessions.filter((s) => s.endTime).at(-1)?.id ?? "",
      }));
      addBadges(toSave);
    });
  }, [badgesLoading, sessionsLoading, sessions, badges, earnedFromSessions, addBadges]);

  const filteredDefs = useMemo(() => {
    let defs = BADGE_DEFINITIONS;
    if (activeCategory !== "all") {
      defs = defs.filter((d) => d.category === activeCategory);
    }
    if (activeGebirge !== "all") {
      defs = defs.filter((d) => d.gebirge === activeGebirge || !d.gebirge);
    }
    return defs;
  }, [activeCategory, activeGebirge]);

  const loading = badgesLoading || sessionsLoading;

  return (
    <div className="flex flex-col min-h-screen pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href="/workout?tab=klettersteig">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Badges</h1>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Lädt...</div>
        </div>
      ) : (
        <>
          {/* Stats bar */}
          <div className="mx-4 mt-4 bg-muted rounded-xl p-4 flex items-center gap-4">
            <span className="text-4xl">🏅</span>
            <div className="flex-1">
              <div className="font-bold text-lg">
                {filteredDefs.filter((d) => earnedFromSessions.has(d.id)).length}{" "}
                <span className="text-muted-foreground font-normal text-sm">
                  von {filteredDefs.length} freigeschaltet
                </span>
              </div>
              <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${filteredDefs.length > 0 ? (filteredDefs.filter((d) => earnedFromSessions.has(d.id)).length / filteredDefs.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Gebirge filter */}
          <div className="flex gap-2 px-4 mt-4 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveGebirge("all")}
              className={`whitespace-nowrap text-xs rounded-full px-3 py-1.5 transition-colors ${
                activeGebirge === "all"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Alle Gebirge
            </button>
            {GEBIRGE_LOCATIONS.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGebirge(g.id)}
                className={`whitespace-nowrap text-xs rounded-full px-3 py-1.5 transition-colors ${
                  activeGebirge === g.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Category filter chips */}
          <div className="flex gap-2 px-4 mt-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => {
              const count =
                cat === "all"
                  ? BADGE_DEFINITIONS.length
                  : BADGE_DEFINITIONS.filter((d) => d.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap text-xs rounded-full px-3 py-1.5 transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {CATEGORY_LABELS[cat]} ({count})
                </button>
              );
            })}
          </div>

          {/* Badge list */}
          <div className="flex flex-col gap-3 px-4 mt-4">
            {filteredDefs.map((def) => {
              const earned = earnedFromSessions.has(def.id);
              const badgeRecord = badgeRecordMap.get(def.id);
              const prog = earned ? null : def.progress(sessions);

              if (earned) {
                return (
                  <div
                    key={def.id}
                    className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-emerald-900/50 rounded-xl text-2xl">
                      {def.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{def.name}</span>
                        <span className="text-[10px] bg-emerald-800/60 text-emerald-400 px-2 py-0.5 rounded-full">
                          ✓ Freigeschaltet
                        </span>
                      </div>
                      <div className="text-xs text-emerald-400/80 mt-0.5">{def.description}</div>
                      {badgeRecord && (
                        <div className="text-[10px] text-emerald-500 mt-1">
                          {new Date(badgeRecord.earnedAt).toLocaleDateString("de-AT", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              const hasProgress = prog && prog.current > 0;

              return (
                <div
                  key={def.id}
                  className={`flex items-center gap-3 border border-border rounded-xl p-4 ${
                    hasProgress ? "bg-muted/30" : "bg-muted/10 opacity-60"
                  }`}
                >
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-muted rounded-xl text-2xl opacity-60">
                    {def.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-muted-foreground">{def.name}</div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5">{def.description}</div>
                    {prog && (
                      <>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (prog.current / prog.max) * 100)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-yellow-500/80 mt-1">{prog.hint}</div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
