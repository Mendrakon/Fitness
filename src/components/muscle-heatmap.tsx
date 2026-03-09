"use client";

import { useMemo, useState, useCallback } from "react";
import type { Workout, MuscleGroup } from "@/lib/types";
import { MUSCLE_GROUP_LABELS } from "@/lib/types";
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

type VisualMuscle = Exclude<MuscleGroup, "full_body" | "cardio" | "other">;

const FULL_BODY_TARGETS: VisualMuscle[] = [
  "chest", "back", "shoulders", "quads", "core",
];

function intensityColor(sets: number, max: number): string {
  if (sets === 0) return "oklch(0.65 0.02 250 / 0.22)";
  const r = Math.min(sets / Math.max(max, 1), 1);
  const L = 0.78 - 0.23 * r;
  const C = 0.15 + 0.07 * r;
  const H = 145 - 120 * r;
  return `oklch(${L.toFixed(2)} ${C.toFixed(2)} ${H.toFixed(0)})`;
}

// Muscle path stroke for separation lines between muscle groups
const ms: React.CSSProperties = {
  stroke: "var(--background)",
  strokeWidth: 1.2,
  strokeLinejoin: "round",
};

const neutral: React.CSSProperties = {
  fill: "oklch(0.65 0.02 250 / 0.22)",
  ...ms,
};

/* -- Main Component ------------------------------------------------------- */

interface Props {
  workouts: Workout[];
  getMuscleGroup: (exerciseId: string) => MuscleGroup | undefined;
}

export function MuscleHeatmap({ workouts, getMuscleGroup }: Props) {
  const [sel, setSel] = useState<VisualMuscle | null>(null);

  const counts = useMemo(() => {
    const now = new Date();
    const ws = startOfWeek(now, { weekStartsOn: 1 });
    const we = endOfWeek(now, { weekStartsOn: 1 });

    const week = workouts.filter((w) => {
      if (!w.endTime) return false;
      return isWithinInterval(new Date(w.startTime), { start: ws, end: we });
    });

    const c: Partial<Record<VisualMuscle, number>> = {};

    week.forEach((w) =>
      w.exercises.forEach((ex) => {
        const mg = getMuscleGroup(ex.exerciseId);
        if (!mg) return;
        const sets = ex.sets.filter(
          (s) => s.completed && s.tag !== "warmup"
        ).length;
        if (sets === 0) return;

        if (mg === "full_body") {
          FULL_BODY_TARGETS.forEach(
            (t) =>
              (c[t] = (c[t] || 0) + Math.ceil(sets / FULL_BODY_TARGETS.length))
          );
        } else if (mg !== "cardio" && mg !== "other") {
          c[mg as VisualMuscle] = (c[mg as VisualMuscle] || 0) + sets;
        }
      })
    );

    return c;
  }, [workouts, getMuscleGroup]);

  const max = useMemo(() => Math.max(...Object.values(counts), 1), [counts]);
  const total = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );

  const color = useCallback(
    (mg: VisualMuscle) => intensityColor(counts[mg] || 0, max),
    [counts, max]
  );

  const tap = useCallback(
    (mg: VisualMuscle) => setSel((p) => (p === mg ? null : mg)),
    []
  );

  return (
    <div className="rounded-xl border bg-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Muskelbelastung</h3>
        <span className="text-xs text-muted-foreground">Diese Woche</span>
      </div>

      <div className="flex justify-center items-start gap-6">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Vorne</p>
          <FrontBody color={color} tap={tap} sel={sel} />
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Hinten</p>
          <BackBody color={color} tap={tap} sel={sel} />
        </div>
      </div>

      {sel && (
        <div className="mt-3 text-center">
          <span className="text-sm font-medium">
            {MUSCLE_GROUP_LABELS[sel]}
          </span>
          <span className="text-sm text-muted-foreground ml-2">
            {counts[sel] || 0} Satze
          </span>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="text-[10px] text-muted-foreground">Wenig</span>
        <div
          className="h-2 w-24 rounded-full"
          style={{
            background:
              "linear-gradient(to right, oklch(0.78 0.15 145), oklch(0.68 0.18 85), oklch(0.55 0.22 25))",
          }}
        />
        <span className="text-[10px] text-muted-foreground">Viel</span>
      </div>
    </div>
  );
}

/* -- SVG Helpers ---------------------------------------------------------- */

type BV = {
  color: (mg: VisualMuscle) => string;
  tap: (mg: VisualMuscle) => void;
  sel: VisualMuscle | null;
};

function G({
  m,
  tap,
  sel,
  children,
}: {
  m: VisualMuscle;
  tap: (mg: VisualMuscle) => void;
  sel: VisualMuscle | null;
  children: React.ReactNode;
}) {
  return (
    <g
      onClick={() => tap(m)}
      style={{
        cursor: "pointer",
        opacity: sel && sel !== m ? 0.25 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {children}
    </g>
  );
}

/* -- Shared non-muscle paths ---------------------------------------------- */

const HEAD = "M100,5 C117,5 130,18 130,34 C130,48 120,56 112,58 L88,58 C80,56 70,48 70,34 C70,18 83,5 100,5 Z";
const NECK = "M88,58 L112,58 L116,72 L84,72 Z";
const L_HAND = "M4,240 C2,250 2,262 6,268 C10,274 20,274 24,268 C28,262 26,250 26,240 Z";
const R_HAND = "M196,240 C198,250 198,262 194,268 C190,274 180,274 176,268 C172,262 174,250 174,240 Z";
const L_FOOT = "M56,420 C52,430 50,442 54,448 L78,448 C82,442 80,430 78,420 Z";
const R_FOOT = "M144,420 C148,430 150,442 146,448 L122,448 C118,442 120,430 122,420 Z";

/* -- Shared muscle paths (same in front & back) --------------------------- */

const L_DELT = "M84,72 C66,72 38,72 24,80 C14,88 12,100 16,114 L42,106 L84,78 Z";
const R_DELT = "M116,72 C134,72 162,72 176,80 C186,88 188,100 184,114 L158,106 L116,78 Z";

const L_FOREARM = "M8,168 L36,168 C34,192 30,218 26,240 L4,240 C6,218 8,192 8,168 Z";
const R_FOREARM = "M192,168 L164,168 C166,192 170,218 174,240 L196,240 C194,218 192,192 192,168 Z";

const L_CALF = "M52,334 L86,334 C84,362 82,394 78,420 L56,420 C54,394 52,362 52,334 Z";
const R_CALF = "M148,334 L114,334 C116,362 118,394 122,420 L144,420 C146,394 148,362 148,334 Z";

/* -- Front-only paths ----------------------------------------------------- */

const L_PEC = "M84,78 L42,106 L42,132 L100,132 L100,78 Z";
const R_PEC = "M116,78 L158,106 L158,132 L100,132 L100,78 Z";
const CORE_FRONT = "M42,132 L158,132 L156,170 L152,208 C136,224 116,234 100,238 C84,234 64,224 48,208 L44,170 Z";
const L_BICEP = "M16,114 L42,106 C40,128 38,150 36,168 L8,168 C10,150 12,128 16,114 Z";
const R_BICEP = "M184,114 L158,106 C160,128 162,150 164,168 L192,168 C190,150 188,128 184,114 Z";
const L_QUAD = "M48,208 C64,224 84,234 100,238 L94,270 L86,334 L52,334 C50,290 48,250 48,208 Z";
const R_QUAD = "M152,208 C136,224 116,234 100,238 L106,270 L114,334 L148,334 C150,290 152,250 152,208 Z";

/* -- Back-only paths ------------------------------------------------------ */

const BACK_UPPER = "M84,78 L42,106 L42,156 L158,156 L158,106 L116,78 Z";
const CORE_BACK = "M42,156 L158,156 L156,200 L44,200 Z";
const L_TRICEP = "M16,114 L42,106 C40,128 38,150 36,168 L8,168 C10,150 12,128 16,114 Z";
const R_TRICEP = "M184,114 L158,106 C160,128 162,150 164,168 L192,168 C190,150 188,128 184,114 Z";
const L_GLUTE = "M44,200 L100,200 L100,244 C84,254 62,250 44,234 Z";
const R_GLUTE = "M156,200 L100,200 L100,244 C116,254 138,250 156,234 Z";
const L_HAM = "M44,234 C62,250 84,254 100,244 L86,334 L52,334 C50,290 46,260 44,234 Z";
const R_HAM = "M156,234 C138,250 116,254 100,244 L114,334 L148,334 C150,290 154,260 156,234 Z";

/* -- Front Body ----------------------------------------------------------- */

function FrontBody({ color, tap, sel }: BV) {
  return (
    <svg viewBox="0 0 200 460" className="h-56 w-auto">
      {/* Non-muscle */}
      <path d={HEAD} style={neutral} />
      <path d={NECK} style={neutral} />

      {/* Chest (below shoulders in z-order) */}
      <G m="chest" tap={tap} sel={sel}>
        <path d={L_PEC} style={{ fill: color("chest"), ...ms }} />
        <path d={R_PEC} style={{ fill: color("chest"), ...ms }} />
      </G>

      {/* Shoulders (on top of chest at shoulder junction) */}
      <G m="shoulders" tap={tap} sel={sel}>
        <path d={L_DELT} style={{ fill: color("shoulders"), ...ms }} />
        <path d={R_DELT} style={{ fill: color("shoulders"), ...ms }} />
      </G>

      {/* Core / Abs */}
      <G m="core" tap={tap} sel={sel}>
        <path d={CORE_FRONT} style={{ fill: color("core"), ...ms }} />
      </G>

      {/* Biceps */}
      <G m="biceps" tap={tap} sel={sel}>
        <path d={L_BICEP} style={{ fill: color("biceps"), ...ms }} />
        <path d={R_BICEP} style={{ fill: color("biceps"), ...ms }} />
      </G>

      {/* Forearms */}
      <G m="forearms" tap={tap} sel={sel}>
        <path d={L_FOREARM} style={{ fill: color("forearms"), ...ms }} />
        <path d={R_FOREARM} style={{ fill: color("forearms"), ...ms }} />
      </G>

      {/* Hands */}
      <path d={L_HAND} style={neutral} />
      <path d={R_HAND} style={neutral} />

      {/* Quads */}
      <G m="quads" tap={tap} sel={sel}>
        <path d={L_QUAD} style={{ fill: color("quads"), ...ms }} />
        <path d={R_QUAD} style={{ fill: color("quads"), ...ms }} />
      </G>

      {/* Calves */}
      <G m="calves" tap={tap} sel={sel}>
        <path d={L_CALF} style={{ fill: color("calves"), ...ms }} />
        <path d={R_CALF} style={{ fill: color("calves"), ...ms }} />
      </G>

      {/* Feet */}
      <path d={L_FOOT} style={neutral} />
      <path d={R_FOOT} style={neutral} />
    </svg>
  );
}

/* -- Back Body ------------------------------------------------------------ */

function BackBody({ color, tap, sel }: BV) {
  return (
    <svg viewBox="0 0 200 460" className="h-56 w-auto">
      {/* Non-muscle */}
      <path d={HEAD} style={neutral} />
      <path d={NECK} style={neutral} />

      {/* Back (traps + lats) - drawn first so shoulders render on top */}
      <G m="back" tap={tap} sel={sel}>
        <path d={BACK_UPPER} style={{ fill: color("back"), ...ms }} />
      </G>

      {/* Shoulders */}
      <G m="shoulders" tap={tap} sel={sel}>
        <path d={L_DELT} style={{ fill: color("shoulders"), ...ms }} />
        <path d={R_DELT} style={{ fill: color("shoulders"), ...ms }} />
      </G>

      {/* Lower back (core) */}
      <G m="core" tap={tap} sel={sel}>
        <path d={CORE_BACK} style={{ fill: color("core"), ...ms }} />
      </G>

      {/* Triceps */}
      <G m="triceps" tap={tap} sel={sel}>
        <path d={L_TRICEP} style={{ fill: color("triceps"), ...ms }} />
        <path d={R_TRICEP} style={{ fill: color("triceps"), ...ms }} />
      </G>

      {/* Forearms */}
      <G m="forearms" tap={tap} sel={sel}>
        <path d={L_FOREARM} style={{ fill: color("forearms"), ...ms }} />
        <path d={R_FOREARM} style={{ fill: color("forearms"), ...ms }} />
      </G>

      {/* Hands */}
      <path d={L_HAND} style={neutral} />
      <path d={R_HAND} style={neutral} />

      {/* Glutes */}
      <G m="glutes" tap={tap} sel={sel}>
        <path d={L_GLUTE} style={{ fill: color("glutes"), ...ms }} />
        <path d={R_GLUTE} style={{ fill: color("glutes"), ...ms }} />
      </G>

      {/* Hamstrings */}
      <G m="hamstrings" tap={tap} sel={sel}>
        <path d={L_HAM} style={{ fill: color("hamstrings"), ...ms }} />
        <path d={R_HAM} style={{ fill: color("hamstrings"), ...ms }} />
      </G>

      {/* Calves */}
      <G m="calves" tap={tap} sel={sel}>
        <path d={L_CALF} style={{ fill: color("calves"), ...ms }} />
        <path d={R_CALF} style={{ fill: color("calves"), ...ms }} />
      </G>

      {/* Feet */}
      <path d={L_FOOT} style={neutral} />
      <path d={R_FOOT} style={neutral} />
    </svg>
  );
}
