import type { KlettersteigSession, KlettersteigBadge, BadgeCategory } from "./types";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: BadgeCategory;
  check: (sessions: KlettersteigSession[]) => boolean;
  progress: (sessions: KlettersteigSession[]) => { current: number; max: number; hint: string } | null;
}

const completedSessions = (sessions: KlettersteigSession[]) =>
  sessions.filter((s) => s.endTime);

const uniqueRoutes = (sessions: KlettersteigSession[]) =>
  new Set(completedSessions(sessions).map((s) => s.routeId));

const bestTimeForRoute = (sessions: KlettersteigSession[], routeId: string): number | null => {
  const times = completedSessions(sessions)
    .filter((s) => s.routeId === routeId)
    .map((s) => s.durationSeconds);
  return times.length > 0 ? Math.min(...times) : null;
};

const B_ROUTE_IDS = ["hohe-wand-gebirgsvereinssteig", "hohe-wand-guenther-schlesinger"];
const C_ROUTE_IDS = ["hohe-wand-wildenauersteig", "hohe-wand-voellerin-steig", "hohe-wand-steirerspur"];
const ALL_ROUTE_IDS = [
  "hohe-wand-steirerspur",
  "hohe-wand-hanselsteig",
  "hohe-wand-wildenauersteig",
  "hohe-wand-gebirgsvereinssteig",
  "hohe-wand-guenther-schlesinger",
  "hohe-wand-htl-steig",
  "hohe-wand-hubertussteig",
  "hohe-wand-voellerin-steig",
  "hohe-wand-springlessteig",
];

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ── Routen-Sammler ────────────────────────────────────────────────────────
  {
    id: "route-rookie",
    name: "Hohe Wand Rookie",
    description: "Erste Route überhaupt absolviert",
    emoji: "🥾",
    category: "routen",
    check: (sessions) => completedSessions(sessions).length > 0,
    progress: (sessions) => {
      const count = Math.min(completedSessions(sessions).length, 1);
      return { current: count, max: 1, hint: "Erste Route absolvieren" };
    },
  },
  {
    id: "route-explorer",
    name: "Hohe Wand Entdecker",
    description: "5 verschiedene Routen absolviert",
    emoji: "🗺️",
    category: "routen",
    check: (sessions) => uniqueRoutes(sessions).size >= 5,
    progress: (sessions) => {
      const count = Math.min(uniqueRoutes(sessions).size, 5);
      return { current: count, max: 5, hint: `${count} von 5 verschiedenen Routen absolviert` };
    },
  },
  {
    id: "route-completer",
    name: "Hohe Wand Komplettierer",
    description: "Alle 9 Routen der Hohe Wand absolviert",
    emoji: "🏔️",
    category: "routen",
    check: (sessions) => {
      const done = uniqueRoutes(sessions);
      return ALL_ROUTE_IDS.every((id) => done.has(id));
    },
    progress: (sessions) => {
      const done = uniqueRoutes(sessions);
      const count = ALL_ROUTE_IDS.filter((id) => done.has(id)).length;
      return { current: count, max: 9, hint: `${count} von 9 Routen absolviert` };
    },
  },
  {
    id: "difficulty-b",
    name: "B-Routen Meister",
    description: "Alle B-Schwierigkeitsrouten absolviert",
    emoji: "⭐",
    category: "routen",
    check: (sessions) => {
      const done = uniqueRoutes(sessions);
      return B_ROUTE_IDS.every((id) => done.has(id));
    },
    progress: (sessions) => {
      const done = uniqueRoutes(sessions);
      const count = B_ROUTE_IDS.filter((id) => done.has(id)).length;
      return { current: count, max: B_ROUTE_IDS.length, hint: `${count} von ${B_ROUTE_IDS.length} B-Routen absolviert` };
    },
  },
  {
    id: "difficulty-c",
    name: "C-Routen Meister",
    description: "Alle C/C/D-Routen absolviert",
    emoji: "⭐⭐",
    category: "routen",
    check: (sessions) => {
      const done = uniqueRoutes(sessions);
      return C_ROUTE_IDS.every((id) => done.has(id));
    },
    progress: (sessions) => {
      const done = uniqueRoutes(sessions);
      const count = C_ROUTE_IDS.filter((id) => done.has(id)).length;
      return { current: count, max: C_ROUTE_IDS.length, hint: `${count} von ${C_ROUTE_IDS.length} C-Routen absolviert` };
    },
  },

  // ── Speed ─────────────────────────────────────────────────────────────────
  {
    id: "speed-hansel-i",
    name: "Hanselsteig Speedrunner I",
    description: "Hanselsteig in unter 45 Minuten",
    emoji: "⚡",
    category: "speed",
    check: (sessions) => {
      const best = bestTimeForRoute(sessions, "hohe-wand-hanselsteig");
      return best !== null && best < 45 * 60;
    },
    progress: (sessions) => {
      const best = bestTimeForRoute(sessions, "hohe-wand-hanselsteig");
      if (best === null) return { current: 0, max: 1, hint: "Hanselsteig noch nicht absolviert" };
      if (best < 45 * 60) return null;
      const mins = Math.ceil((best - 45 * 60) / 60);
      return { current: Math.max(0, 45 * 60 - best), max: 45 * 60, hint: `Bestzeit: ${Math.floor(best / 60)} Min — noch ${mins} Min zu verbessern` };
    },
  },
  {
    id: "speed-hansel-ii",
    name: "Hanselsteig Speedrunner II",
    description: "Hanselsteig in unter 30 Minuten",
    emoji: "⚡⚡",
    category: "speed",
    check: (sessions) => {
      const best = bestTimeForRoute(sessions, "hohe-wand-hanselsteig");
      return best !== null && best < 30 * 60;
    },
    progress: (sessions) => {
      const best = bestTimeForRoute(sessions, "hohe-wand-hanselsteig");
      if (best === null) return { current: 0, max: 1, hint: "Hanselsteig noch nicht absolviert" };
      if (best < 30 * 60) return null;
      const mins = Math.ceil((best - 30 * 60) / 60);
      return { current: Math.max(0, 30 * 60 - best), max: 30 * 60, hint: `Bestzeit: ${Math.floor(best / 60)} Min — noch ${mins} Min zu verbessern` };
    },
  },
  {
    id: "speed-steirerspur",
    name: "Steirerspur-Sprinter",
    description: "Steirerspur in unter 70 Minuten",
    emoji: "🔥",
    category: "speed",
    check: (sessions) => {
      const best = bestTimeForRoute(sessions, "hohe-wand-steirerspur");
      return best !== null && best < 70 * 60;
    },
    progress: (sessions) => {
      const best = bestTimeForRoute(sessions, "hohe-wand-steirerspur");
      if (best === null) return { current: 0, max: 1, hint: "Steirerspur noch nicht absolviert" };
      if (best < 70 * 60) return null;
      const mins = Math.ceil((best - 70 * 60) / 60);
      return { current: Math.max(0, 70 * 60 - best), max: 70 * 60, hint: `Bestzeit: ${Math.floor(best / 60)} Min — noch ${mins} Min zu verbessern` };
    },
  },
  {
    id: "speed-any-c",
    name: "C-Route Sprinter",
    description: "Wildenauersteig oder Völlerin-Steig in unter 55 Minuten",
    emoji: "⚡",
    category: "speed",
    check: (sessions) => {
      return ["hohe-wand-wildenauersteig", "hohe-wand-voellerin-steig"].some((routeId) => {
        const best = bestTimeForRoute(sessions, routeId);
        return best !== null && best < 55 * 60;
      });
    },
    progress: (sessions) => {
      const bests = ["hohe-wand-wildenauersteig", "hohe-wand-voellerin-steig"]
        .map((id) => bestTimeForRoute(sessions, id))
        .filter((t): t is number => t !== null);
      if (bests.length === 0) return { current: 0, max: 1, hint: "Wildenauersteig oder Völlerin-Steig absolvieren" };
      const best = Math.min(...bests);
      if (best < 55 * 60) return null;
      const mins = Math.ceil((best - 55 * 60) / 60);
      return { current: Math.max(0, 55 * 60 - best), max: 55 * 60, hint: `Bestzeit: ${Math.floor(best / 60)} Min — noch ${mins} Min zu verbessern` };
    },
  },

  // ── Gewicht ───────────────────────────────────────────────────────────────
  {
    id: "weight-10",
    name: "Lastentier I",
    description: "Eine Route mit mindestens 10 kg Zusatzgewicht absolviert",
    emoji: "🎒",
    category: "gewicht",
    check: (sessions) => completedSessions(sessions).some((s) => s.extraWeightKg >= 10),
    progress: (sessions) => {
      const max = Math.max(0, ...completedSessions(sessions).map((s) => s.extraWeightKg));
      if (max >= 10) return null;
      return { current: max, max: 10, hint: `Bisher max. ${max} kg — noch ${10 - max} kg mehr` };
    },
  },
  {
    id: "weight-15",
    name: "Lastentier II",
    description: "Eine Route mit mindestens 15 kg Zusatzgewicht absolviert",
    emoji: "🏋️",
    category: "gewicht",
    check: (sessions) => completedSessions(sessions).some((s) => s.extraWeightKg >= 15),
    progress: (sessions) => {
      const max = Math.max(0, ...completedSessions(sessions).map((s) => s.extraWeightKg));
      if (max >= 15) return null;
      return { current: max, max: 15, hint: `Bisher max. ${max} kg — noch ${15 - max} kg mehr` };
    },
  },
  {
    id: "weight-20",
    name: "Lastentier III",
    description: "Eine Route mit mindestens 20 kg Zusatzgewicht absolviert",
    emoji: "🦾",
    category: "gewicht",
    check: (sessions) => completedSessions(sessions).some((s) => s.extraWeightKg >= 20),
    progress: (sessions) => {
      const max = Math.max(0, ...completedSessions(sessions).map((s) => s.extraWeightKg));
      if (max >= 20) return null;
      return { current: max, max: 20, hint: `Bisher max. ${max} kg — noch ${20 - max} kg mehr` };
    },
  },

  // ── Kombi ─────────────────────────────────────────────────────────────────
  {
    id: "kombi-hanselsteig",
    name: "Eisenmann",
    description: "Hanselsteig unter 40 Minuten mit ≥10 kg Zusatzgewicht",
    emoji: "🔥",
    category: "kombi",
    check: (sessions) =>
      completedSessions(sessions).some(
        (s) => s.routeId === "hohe-wand-hanselsteig" && s.durationSeconds < 40 * 60 && s.extraWeightKg >= 10
      ),
    progress: (sessions) => {
      const relevant = completedSessions(sessions).filter(
        (s) => s.routeId === "hohe-wand-hanselsteig"
      );
      if (relevant.length === 0) return { current: 0, max: 1, hint: "Hanselsteig noch nicht absolviert" };
      const bestWithWeight = relevant
        .filter((s) => s.extraWeightKg >= 10)
        .map((s) => s.durationSeconds);
      if (bestWithWeight.length === 0)
        return { current: 0, max: 1, hint: "Hanselsteig mit ≥10 kg noch nicht absolviert" };
      const best = Math.min(...bestWithWeight);
      if (best < 40 * 60) return null;
      const mins = Math.ceil((best - 40 * 60) / 60);
      return { current: Math.max(0, 40 * 60 - best), max: 40 * 60, hint: `Bestzeit mit ≥10 kg: ${Math.floor(best / 60)} Min — noch ${mins} Min zu verbessern` };
    },
  },
  {
    id: "kombi-steirerspur",
    name: "Steirerspur Profi",
    description: "Steirerspur unter 75 Minuten mit ≥5 kg Zusatzgewicht",
    emoji: "🏋️",
    category: "kombi",
    check: (sessions) =>
      completedSessions(sessions).some(
        (s) => s.routeId === "hohe-wand-steirerspur" && s.durationSeconds < 75 * 60 && s.extraWeightKg >= 5
      ),
    progress: (sessions) => {
      const relevant = completedSessions(sessions).filter(
        (s) => s.routeId === "hohe-wand-steirerspur"
      );
      if (relevant.length === 0) return { current: 0, max: 1, hint: "Steirerspur noch nicht absolviert" };
      const bestWithWeight = relevant
        .filter((s) => s.extraWeightKg >= 5)
        .map((s) => s.durationSeconds);
      if (bestWithWeight.length === 0)
        return { current: 0, max: 1, hint: "Steirerspur mit ≥5 kg noch nicht absolviert" };
      const best = Math.min(...bestWithWeight);
      if (best < 75 * 60) return null;
      const mins = Math.ceil((best - 75 * 60) / 60);
      return { current: Math.max(0, 75 * 60 - best), max: 75 * 60, hint: `Bestzeit mit ≥5 kg: ${Math.floor(best / 60)} Min — noch ${mins} Min zu verbessern` };
    },
  },
];

export function detectKlettersteigBadges(
  allSessions: KlettersteigSession[],
  alreadyEarnedIds: string[],
  triggeringSession: KlettersteigSession
): KlettersteigBadge[] {
  const earnedSet = new Set(alreadyEarnedIds);
  const newBadges: KlettersteigBadge[] = [];

  for (const def of BADGE_DEFINITIONS) {
    if (earnedSet.has(def.id)) continue;
    if (def.check(allSessions)) {
      newBadges.push({
        id: `${def.id}_${triggeringSession.userId}`,
        userId: triggeringSession.userId,
        badgeId: def.id,
        earnedAt: triggeringSession.endTime ?? new Date().toISOString(),
        sessionId: triggeringSession.id,
      });
    }
  }

  return newBadges;
}
