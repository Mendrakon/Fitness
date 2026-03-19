"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useKlettersteigSession } from "@/contexts/klettersteig-session-context";
import { useKlettersteigRoutes } from "@/hooks/use-klettersteig-routes";
import { useKlettersteigSessions } from "@/hooks/use-klettersteig-sessions";
import { useKlettersteigPRs } from "@/hooks/use-klettersteig-prs";
import { useActivityFeed, type FeedVisibility } from "@/hooks/use-activity-feed";
import { detectKlettersteigPRs } from "@/lib/klettersteig-pr-detection";
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

  const selectedRoute =
    flow.step === "drawer" || flow.step === "input"
      ? flow.route
      : activeSession
        ? routes.find((r) => r.id === activeSession.routeId) ?? null
        : null;

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
            locationName: "Hohe Wand",
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
      <h1 className="text-3xl font-bold tracking-tight">Klettersteig</h1>
      <p className="text-sm text-muted-foreground -mt-2">Hohe Wand · {routes.length} Routen</p>

      {/* Map */}
      <div className="h-72 rounded-lg overflow-hidden border border-border">
        <RouteMap
          routes={routes}
          selectedRouteId={selectedRoute?.id ?? null}
          onRouteSelect={handleRouteSelect}
        />
      </div>

      {/* Route Legend */}
      <div className="flex flex-wrap gap-1.5">
        {routes.map((r) => (
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
