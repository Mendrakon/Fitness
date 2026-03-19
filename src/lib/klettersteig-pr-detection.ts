import type { KlettersteigSession, KlettersteigPREvent } from "./types";

export function detectKlettersteigPRs(
  session: KlettersteigSession,
  previousSessions: KlettersteigSession[]
): KlettersteigPREvent[] {
  const prs: KlettersteigPREvent[] = [];
  const routeSessions = previousSessions.filter(
    (s) => s.routeId === session.routeId && s.endTime && s.id !== session.id
  );

  const isFirst = routeSessions.length === 0;

  // Best time
  const prevBestTime = isFirst
    ? 0
    : Math.min(...routeSessions.map((s) => s.durationSeconds));

  if (isFirst || session.durationSeconds < prevBestTime) {
    const diff = isFirst ? 0 : prevBestTime - session.durationSeconds;
    const diffPercent = prevBestTime > 0 ? Math.round((diff / prevBestTime) * 100) : 0;
    prs.push({
      id: `${session.id}-${session.routeId}-best_time`,
      userId: session.userId,
      routeId: session.routeId,
      sessionId: session.id,
      date: session.endTime!,
      metric: "best_time",
      newValue: session.durationSeconds,
      oldValue: prevBestTime,
      diff,
      diffPercent,
      durationSeconds: session.durationSeconds,
      extraWeightKg: session.extraWeightKg,
    });
  }

  // Max extra weight
  const prevMaxWeight = isFirst
    ? 0
    : Math.max(...routeSessions.map((s) => s.extraWeightKg));

  if (session.extraWeightKg > 0 && (isFirst || session.extraWeightKg > prevMaxWeight)) {
    const diff = session.extraWeightKg - prevMaxWeight;
    const diffPercent = prevMaxWeight > 0 ? Math.round((diff / prevMaxWeight) * 100) : 0;
    prs.push({
      id: `${session.id}-${session.routeId}-max_weight`,
      userId: session.userId,
      routeId: session.routeId,
      sessionId: session.id,
      date: session.endTime!,
      metric: "max_weight",
      newValue: session.extraWeightKg,
      oldValue: prevMaxWeight,
      diff,
      diffPercent,
      durationSeconds: session.durationSeconds,
      extraWeightKg: session.extraWeightKg,
    });
  }

  // Best weighted time: fastest time at >= the same extra weight
  if (session.extraWeightKg > 0) {
    const sameOrHeavierSessions = routeSessions.filter(
      (s) => s.extraWeightKg >= session.extraWeightKg
    );

    if (sameOrHeavierSessions.length === 0) {
      // First session at this weight level — automatic PR
      prs.push({
        id: `${session.id}-${session.routeId}-best_weighted_time`,
        userId: session.userId,
        routeId: session.routeId,
        sessionId: session.id,
        date: session.endTime!,
        metric: "best_weighted_time",
        newValue: session.durationSeconds,
        oldValue: 0,
        diff: 0,
        diffPercent: 0,
        durationSeconds: session.durationSeconds,
        extraWeightKg: session.extraWeightKg,
      });
    } else {
      const prevBestWeightedTime = Math.min(
        ...sameOrHeavierSessions.map((s) => s.durationSeconds)
      );
      if (session.durationSeconds < prevBestWeightedTime) {
        const diff = prevBestWeightedTime - session.durationSeconds;
        const diffPercent = Math.round((diff / prevBestWeightedTime) * 100);
        prs.push({
          id: `${session.id}-${session.routeId}-best_weighted_time`,
          userId: session.userId,
          routeId: session.routeId,
          sessionId: session.id,
          date: session.endTime!,
          metric: "best_weighted_time",
          newValue: session.durationSeconds,
          oldValue: prevBestWeightedTime,
          diff,
          diffPercent,
          durationSeconds: session.durationSeconds,
          extraWeightKg: session.extraWeightKg,
        });
      }
    }
  }

  return prs;
}
