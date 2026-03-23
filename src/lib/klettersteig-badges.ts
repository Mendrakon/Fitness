import type { KlettersteigSession, KlettersteigBadge, BadgeCategory } from "./types";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: BadgeCategory;
  gebirge?: string;
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

// ── Hohe Wand Route IDs ───────────────────────────────────────────────────────

const HW_B_ROUTE_IDS = ["hohe-wand-gebirgsvereinssteig", "hohe-wand-guenther-schlesinger"];
const HW_C_ROUTE_IDS = ["hohe-wand-wildenauersteig", "hohe-wand-voellerin-steig", "hohe-wand-steirerspur"];
const HW_ALL_ROUTE_IDS = [
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

// ── Rax Route IDs ─────────────────────────────────────────────────────────────

const RAX_ALL_ROUTE_IDS = [
  "rax-haidsteig",
  "rax-koenigsschusswandsteig",
  "rax-preinerwandsteig",
  "rax-bismarcksteig",
  "rax-wachthuettelkamm",
  "rax-gaislochsteig",
  "rax-rudolfsteig",
];

// ── Schneeberg Route IDs ──────────────────────────────────────────────────────

const SB_ALL_ROUTE_IDS = [
  "schneeberg-av-steig",
  "schneeberg-nandlgrat",
  "schneeberg-weichtalklamm",
];

// ── Alle Route IDs ────────────────────────────────────────────────────────────

const EVERY_ROUTE_ID = [...HW_ALL_ROUTE_IDS, ...RAX_ALL_ROUTE_IDS, ...SB_ALL_ROUTE_IDS];

function getGebirgeFromRouteId(routeId: string): string {
  if (routeId.startsWith("hohe-wand-")) return "hohe-wand";
  if (routeId.startsWith("rax-")) return "rax";
  if (routeId.startsWith("schneeberg-")) return "schneeberg";
  return "unknown";
}

function uniqueGebirge(sessions: KlettersteigSession[]): Set<string> {
  return new Set(completedSessions(sessions).map((s) => getGebirgeFromRouteId(s.routeId)));
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ══════════════════════════════════════════════════════════════════════════════
  // ── HOHE WAND ─────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Routen-Sammler ────────────────────────────────────────────────────────
  {
    id: "route-rookie",
    name: "Hohe Wand Rookie",
    description: "Erste Hohe Wand Route absolviert",
    emoji: "🥾",
    category: "routen",
    gebirge: "hohe-wand",
    check: (sessions) => completedSessions(sessions).some((s) => s.routeId.startsWith("hohe-wand-")),
    progress: (sessions) => {
      const count = completedSessions(sessions).filter((s) => s.routeId.startsWith("hohe-wand-")).length > 0 ? 1 : 0;
      return { current: count, max: 1, hint: "Erste Hohe Wand Route absolvieren" };
    },
  },
  {
    id: "route-explorer",
    name: "Hohe Wand Entdecker",
    description: "5 verschiedene Hohe Wand Routen absolviert",
    emoji: "🗺️",
    category: "routen",
    gebirge: "hohe-wand",
    check: (sessions) => {
      const done = uniqueRoutes(sessions);
      return HW_ALL_ROUTE_IDS.filter((id) => done.has(id)).length >= 5;
    },
    progress: (sessions) => {
      const done = uniqueRoutes(sessions);
      const count = Math.min(HW_ALL_ROUTE_IDS.filter((id) => done.has(id)).length, 5);
      return { current: count, max: 5, hint: `${count} von 5 verschiedenen Hohe Wand Routen absolviert` };
    },
  },
  {
    id: "route-completer",
    name: "Hohe Wand Komplettierer",
    description: "Alle 9 Routen der Hohe Wand absolviert",
    emoji: "🏔️",
    category: "routen",
    gebirge: "hohe-wand",
    check: (sessions) => {
      const done = uniqueRoutes(sessions);
      return HW_ALL_ROUTE_IDS.every((id) => done.has(id));
    },
    progress: (sessions) => {
      const done = uniqueRoutes(sessions);
      const count = HW_ALL_ROUTE_IDS.filter((id) => done.has(id)).length;
      return { current: count, max: 9, hint: `${count} von 9 Routen absolviert` };
    },
  },
  {
    id: "difficulty-b",
    name: "B-Routen Meister",
    description: "Alle B-Schwierigkeitsrouten der Hohe Wand absolviert",
    emoji: "⭐",
    category: "routen",
    gebirge: "hohe-wand",
    check: (sessions) => {
      const done = uniqueRoutes(sessions);
      return HW_B_ROUTE_IDS.every((id) => done.has(id));
    },
    progress: (sessions) => {
      const done = uniqueRoutes(sessions);
      const count = HW_B_ROUTE_IDS.filter((id) => done.has(id)).length;
      return { current: count, max: HW_B_ROUTE_IDS.length, hint: `${count} von ${HW_B_ROUTE_IDS.length} B-Routen absolviert` };
    },
  },
  {
    id: "difficulty-c",
    name: "C-Routen Meister",
    description: "Alle C/C/D-Routen der Hohe Wand absolviert",
    emoji: "⭐⭐",
    category: "routen",
    gebirge: "hohe-wand",
    check: (sessions) => {
      const done = uniqueRoutes(sessions);
      return HW_C_ROUTE_IDS.every((id) => done.has(id));
    },
    progress: (sessions) => {
      const done = uniqueRoutes(sessions);
      const count = HW_C_ROUTE_IDS.filter((id) => done.has(id)).length;
      return { current: count, max: HW_C_ROUTE_IDS.length, hint: `${count} von ${HW_C_ROUTE_IDS.length} C-Routen absolviert` };
    },
  },

  // ── Speed (Hohe Wand) ───────────────────────────────────────────────────────
  {
    id: "speed-hansel-i",
    name: "Hanselsteig Speedrunner I",
    description: "Hanselsteig in unter 45 Minuten",
    emoji: "⚡",
    category: "speed",
    gebirge: "hohe-wand",
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
    gebirge: "hohe-wand",
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
    gebirge: "hohe-wand",
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
    gebirge: "hohe-wand",
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
    gebirge: "hohe-wand",
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
    gebirge: "hohe-wand",
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
    gebirge: "hohe-wand",
    check: (sessions) => completedSessions(sessions).some((s) => s.extraWeightKg >= 20),
    progress: (sessions) => {
      const max = Math.max(0, ...completedSessions(sessions).map((s) => s.extraWeightKg));
      if (max >= 20) return null;
      return { current: max, max: 20, hint: `Bisher max. ${max} kg — noch ${20 - max} kg mehr` };
    },
  },

  // ── Kombi (Hohe Wand) ──────────────────────────────────────────────────────
  {
    id: "kombi-hanselsteig",
    name: "Eisenmann",
    description: "Hanselsteig unter 40 Minuten mit ≥10 kg Zusatzgewicht",
    emoji: "🔥",
    category: "kombi",
    gebirge: "hohe-wand",
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
    gebirge: "hohe-wand",
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

  // ══════════════════════════════════════════════════════════════════════════════
  // ── RAX ───────────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Routen (Rax) ──────────────────────────────────────────────────────────
  {
    id: "rax-rookie",
    name: "Rax Rookie",
    description: "Erste Rax-Route absolviert",
    emoji: "🥾",
    category: "routen",
    gebirge: "rax",
    check: (sessions) => completedSessions(sessions).some((s) => s.routeId.startsWith("rax-")),
    progress: (sessions) => {
      const count = completedSessions(sessions).filter((s) => s.routeId.startsWith("rax-")).length > 0 ? 1 : 0;
      return { current: count, max: 1, hint: "Erste Rax-Route absolvieren" };
    },
  },
  {
    id: "rax-explorer",
    name: "Rax Entdecker",
    description: "4 verschiedene Rax-Routen absolviert",
    emoji: "🗺️",
    category: "routen",
    gebirge: "rax",
    check: (sessions) => {
      const done = uniqueRoutes(sessions);
      return RAX_ALL_ROUTE_IDS.filter((id) => done.has(id)).length >= 4;
    },
    progress: (sessions) => {
      const done = uniqueRoutes(sessions);
      const count = Math.min(RAX_ALL_ROUTE_IDS.filter((id) => done.has(id)).length, 4);
      return { current: count, max: 4, hint: `${count} von 4 verschiedenen Rax-Routen absolviert` };
    },
  },
  {
    id: "rax-completer",
    name: "Rax Komplettierer",
    description: "Alle 7 Routen der Rax absolviert",
    emoji: "🏔️",
    category: "routen",
    gebirge: "rax",
    check: (sessions) => {
      const done = uniqueRoutes(sessions);
      return RAX_ALL_ROUTE_IDS.every((id) => done.has(id));
    },
    progress: (sessions) => {
      const done = uniqueRoutes(sessions);
      const count = RAX_ALL_ROUTE_IDS.filter((id) => done.has(id)).length;
      return { current: count, max: 7, hint: `${count} von 7 Rax-Routen absolviert` };
    },
  },

  // ── Speed (Rax) ───────────────────────────────────────────────────────────
  {
    id: "speed-haidsteig",
    name: "Haidsteig Speedrunner",
    description: "Haidsteig in unter 90 Minuten",
    emoji: "⚡",
    category: "speed",
    gebirge: "rax",
    check: (sessions) => {
      const best = bestTimeForRoute(sessions, "rax-haidsteig");
      return best !== null && best < 90 * 60;
    },
    progress: (sessions) => {
      const best = bestTimeForRoute(sessions, "rax-haidsteig");
      if (best === null) return { current: 0, max: 1, hint: "Haidsteig noch nicht absolviert" };
      if (best < 90 * 60) return null;
      const mins = Math.ceil((best - 90 * 60) / 60);
      return { current: Math.max(0, 90 * 60 - best), max: 90 * 60, hint: `Bestzeit: ${Math.floor(best / 60)} Min — noch ${mins} Min zu verbessern` };
    },
  },
  {
    id: "speed-preinerwand",
    name: "Preinerwandsteig Sprinter",
    description: "Preinerwandsteig in unter 60 Minuten",
    emoji: "⚡",
    category: "speed",
    gebirge: "rax",
    check: (sessions) => {
      const best = bestTimeForRoute(sessions, "rax-preinerwandsteig");
      return best !== null && best < 60 * 60;
    },
    progress: (sessions) => {
      const best = bestTimeForRoute(sessions, "rax-preinerwandsteig");
      if (best === null) return { current: 0, max: 1, hint: "Preinerwandsteig noch nicht absolviert" };
      if (best < 60 * 60) return null;
      const mins = Math.ceil((best - 60 * 60) / 60);
      return { current: Math.max(0, 60 * 60 - best), max: 60 * 60, hint: `Bestzeit: ${Math.floor(best / 60)} Min — noch ${mins} Min zu verbessern` };
    },
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // ── SCHNEEBERG ────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Routen (Schneeberg) ───────────────────────────────────────────────────
  {
    id: "schneeberg-rookie",
    name: "Schneeberg Rookie",
    description: "Erste Schneeberg-Route absolviert",
    emoji: "🥾",
    category: "routen",
    gebirge: "schneeberg",
    check: (sessions) => completedSessions(sessions).some((s) => s.routeId.startsWith("schneeberg-")),
    progress: (sessions) => {
      const count = completedSessions(sessions).filter((s) => s.routeId.startsWith("schneeberg-")).length > 0 ? 1 : 0;
      return { current: count, max: 1, hint: "Erste Schneeberg-Route absolvieren" };
    },
  },
  {
    id: "schneeberg-completer",
    name: "Schneeberg Komplettierer",
    description: "Alle 3 Routen des Schneeberg absolviert",
    emoji: "🏔️",
    category: "routen",
    gebirge: "schneeberg",
    check: (sessions) => {
      const done = uniqueRoutes(sessions);
      return SB_ALL_ROUTE_IDS.every((id) => done.has(id));
    },
    progress: (sessions) => {
      const done = uniqueRoutes(sessions);
      const count = SB_ALL_ROUTE_IDS.filter((id) => done.has(id)).length;
      return { current: count, max: 3, hint: `${count} von 3 Schneeberg-Routen absolviert` };
    },
  },

  // ── Speed (Schneeberg) ────────────────────────────────────────────────────
  {
    id: "speed-nandlgrat",
    name: "Nandlgrat Speedrunner",
    description: "Nandlgrat in unter 80 Minuten",
    emoji: "⚡",
    category: "speed",
    gebirge: "schneeberg",
    check: (sessions) => {
      const best = bestTimeForRoute(sessions, "schneeberg-nandlgrat");
      return best !== null && best < 80 * 60;
    },
    progress: (sessions) => {
      const best = bestTimeForRoute(sessions, "schneeberg-nandlgrat");
      if (best === null) return { current: 0, max: 1, hint: "Nandlgrat noch nicht absolviert" };
      if (best < 80 * 60) return null;
      const mins = Math.ceil((best - 80 * 60) / 60);
      return { current: Math.max(0, 80 * 60 - best), max: 80 * 60, hint: `Bestzeit: ${Math.floor(best / 60)} Min — noch ${mins} Min zu verbessern` };
    },
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // ── ÜBERGREIFEND ──────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: "gebirge-wanderer",
    name: "Gebirgswanderer",
    description: "Mindestens eine Route in 3 verschiedenen Gebirgen absolviert",
    emoji: "🌄",
    category: "routen",
    check: (sessions) => uniqueGebirge(sessions).size >= 3,
    progress: (sessions) => {
      const count = uniqueGebirge(sessions).size;
      return { current: count, max: 3, hint: `${count} von 3 Gebirgen besucht` };
    },
  },
  {
    id: "alpen-meister",
    name: "Alpen-Meister",
    description: "Alle 19 Routen aller Gebirge absolviert",
    emoji: "👑",
    category: "routen",
    check: (sessions) => {
      const done = uniqueRoutes(sessions);
      return EVERY_ROUTE_ID.every((id) => done.has(id));
    },
    progress: (sessions) => {
      const done = uniqueRoutes(sessions);
      const count = EVERY_ROUTE_ID.filter((id) => done.has(id)).length;
      return { current: count, max: 19, hint: `${count} von 19 Routen aller Gebirge absolviert` };
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
