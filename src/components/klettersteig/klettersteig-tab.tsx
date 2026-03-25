"use client";

import { useState, useCallback, useMemo } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useKlettersteigSession } from "@/contexts/klettersteig-session-context";
import { useKlettersteigRoutes } from "@/hooks/use-klettersteig-routes";
import { useKlettersteigSessions } from "@/hooks/use-klettersteig-sessions";
import { useKlettersteigPRs } from "@/hooks/use-klettersteig-prs";
import { useKlettersteigBadges } from "@/hooks/use-klettersteig-badges";
import { useActivityFeed, type FeedVisibility } from "@/hooks/use-activity-feed";
import { detectKlettersteigPRs } from "@/lib/klettersteig-pr-detection";
import { detectKlettersteigBadges, BADGE_DEFINITIONS } from "@/lib/klettersteig-badges";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { GEBIRGE_LOCATIONS, GEBIRGE_MAP, getLocationName } from "@/lib/klettersteig-locations";
import { getParkingForRoute } from "@/lib/klettersteig-parking";
import { Button } from "@/components/ui/button";
import { RouteDrawer } from "./route-drawer";
import { SessionInput } from "./session-input";
import { ActiveSession } from "./active-session";
import { SessionSummary } from "./session-summary";
import {
  formatKlettersteigTime,
  KLETTERSTEIG_PR_METRIC_LABELS,
  formatKlettersteigPRDiff,
} from "@/lib/types";
import type { KlettersteigRoute, KlettersteigWeather, KlettersteigSession, KlettersteigPREvent } from "@/lib/types";
import { toast } from "sonner";

// Dynamic import for Leaflet (no SSR)
const RouteMap = dynamic(
  () => import("./route-map").then((mod) => mod.RouteMap),
  { ssr: false, loading: () => <div className="h-64 rounded-lg bg-muted animate-pulse" /> }
);

type FlowState =
  | { step: "map" }
  | { step: "drawer"; route: KlettersteigRoute }
  | { step: "input"; route: KlettersteigRoute }
  | { step: "active" }
  | { step: "summary"; session: KlettersteigSession; prs: KlettersteigPREvent[] };

export function KlettersteigTab() {
  const { routes } = useKlettersteigRoutes();

  const { sessions, save, getForRoute, getBestTime, getMaxWeight } = useKlettersteigSessions();
  const { addPREvents } = useKlettersteigPRs();
  const { badges, addBadges } = useKlettersteigBadges();
  const { activeSession, startSession, finishSession, discardSession, updateNotes, elapsedSeconds } =
    useKlettersteigSession();
  const { createFeedEvent } = useActivityFeed();

  // Determine initial flow state based on active session
  const getInitialState = (): FlowState => {
    if (activeSession) return { step: "active" };
    return { step: "map" };
  };

  const [flow, setFlow] = useState<FlowState>(getInitialState);
  const [summaryNotes, setSummaryNotes] = useState("");
  const [selectedGebirge, setSelectedGebirge] = useState<string | null>(null);
  const [showParking, setShowParking] = useState(false);
  const [isMapMaximized, setIsMapMaximized] = useState(false);

  const filteredRoutes = useMemo(
    () => selectedGebirge ? routes.filter((r) => r.locationId === selectedGebirge) : routes,
    [routes, selectedGebirge]
  );

  const mapCenter: [number, number] = useMemo(
    () => selectedGebirge ? GEBIRGE_MAP[selectedGebirge]?.center ?? [47.77, 15.92] : [47.77, 15.92],
    [selectedGebirge]
  );

  const mapZoom = useMemo(
    () => selectedGebirge ? GEBIRGE_MAP[selectedGebirge]?.zoom ?? 11 : 11,
    [selectedGebirge]
  );

  const selectedRoute =
    flow.step === "drawer" || flow.step === "input"
      ? flow.route
      : activeSession
        ? routes.find((r) => r.id === activeSession.routeId) ?? null
        : null;

  const visibleParking = useMemo(() => {
    if (!showParking) return [];
    const allIds = new Set(filteredRoutes.flatMap((r) => r.parkingIds ?? []));
    return getParkingForRoute([...allIds]);
  }, [filteredRoutes, showParking]);

  const handleRouteSelect = useCallback(
    (route: KlettersteigRoute) => {
      setFlow({ step: "drawer", route });
    },
    []
  );

  const handleStartInput = useCallback(() => {
    if (flow.step === "drawer") {
      setFlow({ step: "input", route: flow.route });
    }
  }, [flow]);

  const handleStartSession = useCallback(
    (extraWeightKg: number, weather: KlettersteigWeather) => {
      if (flow.step !== "input") return;
      startSession(flow.route.id, extraWeightKg, weather);
      setFlow({ step: "active" });
    },
    [flow, startSession]
  );

  const handleFinishSession = useCallback(() => {
    const finished = finishSession();
    if (!finished) return;

    // Detect PRs
    const routeSessions = sessions.filter(
      (s) => s.routeId === finished.routeId && s.endTime
    );
    const prs = detectKlettersteigPRs(finished, routeSessions);

    if (prs.length > 0) {
      addPREvents(prs);
      for (const pr of prs) {
        const routeName = routes.find((r) => r.id === pr.routeId)?.name ?? "Route";
        toast.success(`🏆 Neuer PR: ${routeName}`, {
          description: `${KLETTERSTEIG_PR_METRIC_LABELS[pr.metric]}: ${formatKlettersteigPRDiff(pr)}`,
          duration: 5000,
        });
      }
    }

    const newBadges = detectKlettersteigBadges(
      [...sessions, finished],
      badges.map((b) => b.badgeId),
      finished
    );
    if (newBadges.length > 0) {
      addBadges(newBadges);
      for (const badge of newBadges) {
        const def = BADGE_DEFINITIONS.find((d) => d.id === badge.badgeId);
        toast.success(`${def?.emoji} Badge freigeschaltet!`, {
          description: def?.name,
          duration: 5000,
        });
      }
    }

    setSummaryNotes("");
    setFlow({ step: "summary", session: finished, prs });
  }, [finishSession, sessions, routes, addPREvents]);

  const handleSaveSummary = useCallback(
    async (visibility: FeedVisibility | null) => {
      if (flow.step !== "summary") return;
      const { session, prs } = flow;

      // Update notes
      const sessionWithNotes = { ...session, notes: summaryNotes };
      await save(sessionWithNotes);

      // Share to feed if requested
      if (visibility) {
        const route = routes.find((r) => r.id === session.routeId);
        createFeedEvent(
          "klettersteig_complete",
          {
            sessionId: session.id,
            routeName: route?.name ?? "Route",
            routeDifficulty: route?.difficulty ?? "B",
            locationName: getLocationName(route?.locationId ?? "hohe-wand"),
            durationSeconds: session.durationSeconds,
            extraWeightKg: session.extraWeightKg,
            weather: session.weather,
            prs: prs.map((p) => ({
              metric: p.metric,
              newValue: p.newValue,
              oldValue: p.oldValue,
            })),
          },
          visibility
        );
      }

      toast.success("Klettersteig-Session gespeichert!");
      setFlow({ step: "map" });
    },
    [flow, summaryNotes, save, routes, createFeedEvent]
  );

  const newBadgeCount = useMemo(() => {
    if (typeof window === "undefined") return 0;
    const seen: string[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.KLETTERSTEIG_SEEN_BADGES) ?? "[]"
    );
    const seenSet = new Set(seen);
    return badges.filter((b) => !seenSet.has(b.badgeId)).length;
  }, [badges]);

  const markBadgesSeen = useCallback(() => {
    const ids = badges.map((b) => b.badgeId);
    localStorage.setItem(STORAGE_KEYS.KLETTERSTEIG_SEEN_BADGES, JSON.stringify(ids));
  }, [badges]);

  // Active session view
  if (flow.step === "active" && activeSession) {
    const route = routes.find((r) => r.id === activeSession.routeId);
    if (!route) return null;
    const bestTime = getBestTime(route.id);
    return (
      <ActiveSession
        route={route}
        elapsedSeconds={elapsedSeconds}
        extraWeightKg={activeSession.extraWeightKg}
        weatherCondition={activeSession.weather.condition}
        temperature={activeSession.weather.temperature}
        bestTime={bestTime}
        onFinish={handleFinishSession}
      />
    );
  }

  // Input view
  if (flow.step === "input") {
    return (
      <SessionInput
        route={flow.route}
        onStart={handleStartSession}
        onBack={() => setFlow({ step: "drawer", route: flow.route })}
      />
    );
  }

  // Summary view
  if (flow.step === "summary") {
    const route = routes.find((r) => r.id === flow.session.routeId);
    if (!route) return null;
    return (
      <SessionSummary
        route={route}
        session={flow.session}
        prs={flow.prs}
        notes={summaryNotes}
        onNotesChange={setSummaryNotes}
        onSave={handleSaveSummary}
      />
    );
  }

  // Map view (default)
  const drawerRoute = flow.step === "drawer" ? flow.route : null;

  return (
    <div className="flex flex-col px-4 pt-5 pb-28 gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Klettersteig</h1>
          <p className="text-sm text-muted-foreground">
            {selectedGebirge ? getLocationName(selectedGebirge) : "Alle Gebirge"} · {filteredRoutes.length} Routen
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="relative mt-1" onClick={markBadgesSeen}>
          <Link href="/klettersteig/challenges">
            🏅 Badges
            {newBadgeCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5">
                {newBadgeCount}
              </span>
            )}
          </Link>
        </Button>
      </div>

      {/* Gebirge Filter + Parkplatz Toggle */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedGebirge(null)}
          className={`whitespace-nowrap text-xs rounded-full px-3 py-1.5 transition-colors ${
            selectedGebirge === null
              ? "bg-primary text-primary-foreground font-semibold"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Alle ({routes.length})
        </button>
        {GEBIRGE_LOCATIONS.map((g) => {
          const count = routes.filter((r) => r.locationId === g.id).length;
          if (count === 0) return null;
          return (
            <button
              key={g.id}
              onClick={() => setSelectedGebirge(g.id)}
              className={`whitespace-nowrap text-xs rounded-full px-3 py-1.5 transition-colors ${
                selectedGebirge === g.id
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {g.name} ({count})
            </button>
          );
        })}
        <button
          onClick={() => setShowParking((v) => !v)}
          className={`whitespace-nowrap text-xs rounded-full px-3 py-1.5 transition-colors ${
            showParking
              ? "bg-primary text-primary-foreground font-semibold"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🅿 Parkplätze
        </button>
      </div>

      {/* Map */}
      {isMapMaximized ? (
        <div className="fixed inset-0 z-50 bg-background" style={{ height: "100dvh" }}>
          <RouteMap
            routes={filteredRoutes}
            selectedRouteId={selectedRoute?.id ?? null}
            onRouteSelect={handleRouteSelect}
            center={mapCenter}
            zoom={mapZoom}
            parkingSpots={visibleParking}
            fullscreen
          />
          <button
            onClick={() => setIsMapMaximized(false)}
            className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-md bg-white/90 shadow-md hover:bg-white transition-colors"
            style={{ zIndex: 1000 }}
            aria-label="Karte minimieren"
          >
            <Minimize2 size={18} className="text-gray-700" />
          </button>
        </div>
      ) : (
        <div className="relative h-72 rounded-lg overflow-hidden border border-border">
          <RouteMap
            routes={filteredRoutes}
            selectedRouteId={selectedRoute?.id ?? null}
            onRouteSelect={handleRouteSelect}
            center={mapCenter}
            zoom={mapZoom}
            parkingSpots={visibleParking}
          />
          <button
            onClick={() => setIsMapMaximized(true)}
            className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-md bg-white/90 shadow-md hover:bg-white transition-colors"
            style={{ zIndex: 1000 }}
            aria-label="Karte maximieren"
          >
            <Maximize2 size={16} className="text-gray-700" />
          </button>
        </div>
      )}

      {/* Route Legend */}
      <div className="flex flex-wrap gap-1.5">
        {filteredRoutes.map((r) => (
          <button
            key={r.id}
            onClick={() => handleRouteSelect(r)}
            className="text-[11px] rounded-full px-2.5 py-1 bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {r.name} <span className="font-semibold">{r.difficulty}</span>
          </button>
        ))}
      </div>

      {/* Route Drawer */}
      <RouteDrawer
        route={drawerRoute}
        open={flow.step === "drawer"}
        onOpenChange={(open) => { if (!open) setFlow({ step: "map" }); }}
        sessions={drawerRoute ? getForRoute(drawerRoute.id) : []}
        bestTime={drawerRoute ? getBestTime(drawerRoute.id) : null}
        maxWeight={drawerRoute ? getMaxWeight(drawerRoute.id) : null}
        onStartSession={handleStartInput}
      />
    </div>
  );
}
