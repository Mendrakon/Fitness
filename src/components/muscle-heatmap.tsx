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

const ms: React.CSSProperties = {
  stroke: "var(--background)",
  strokeWidth: 0.8,
  strokeLinejoin: "round",
};

const detail: React.CSSProperties = {
  stroke: "var(--background)",
  strokeWidth: 0.5,
  strokeLinejoin: "round",
  strokeOpacity: 0.5,
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
            {counts[sel] || 0} Sätze
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

/* =========================================================================
   ANATOMICAL SVG PATHS — Athletic muscular body
   ViewBox: 0 0 200 460
   ========================================================================= */

/* -- Head & Neck (non-muscle) --------------------------------------------- */
const HEAD = "M100,8 C114,8 126,18 128,32 C130,44 122,54 114,58 L86,58 C78,54 70,44 72,32 C74,18 86,8 100,8 Z";
const NECK = "M89,58 L111,58 L114,72 L86,72 Z";

/* -- Hands & Feet (non-muscle) -------------------------------------------- */
const L_HAND = "M10,244 C6,252 5,264 8,272 C11,278 19,280 24,276 C28,272 28,258 26,244 Z";
const R_HAND = "M190,244 C194,252 195,264 192,272 C189,278 181,280 176,276 C172,272 172,258 174,244 Z";
const L_FOOT = "M58,418 C54,428 52,440 56,448 L80,448 C82,440 80,428 78,418 Z";
const R_FOOT = "M142,418 C146,428 148,440 144,448 L120,448 C118,440 120,428 122,418 Z";

/* -- FRONT BODY PATHS ----------------------------------------------------- */

// Deltoids (front) — rounded cap shape
const F_L_DELT = "M86,72 C68,72 42,74 28,84 C18,92 16,104 20,116 L44,108 L86,80 Z";
const F_R_DELT = "M114,72 C132,72 158,74 172,84 C182,92 184,104 180,116 L156,108 L114,80 Z";

// Pecs — anatomical fan shape with curved lower border
const F_L_PEC = "M86,80 L44,108 C42,118 42,128 44,136 C56,142 78,144 100,140 L100,80 Z";
const F_R_PEC = "M114,80 L156,108 C158,118 158,128 156,136 C144,142 122,144 100,140 L100,80 Z";

// Abs — 6-pack segments (3 rows × 2 columns)
// Rectus abdominis with anatomical tapering
const ABS_L1 = "M68,144 C78,146 90,146 98,145 L98,168 L69,168 Z";
const ABS_R1 = "M132,144 C122,146 110,146 102,145 L102,168 L131,168 Z";
const ABS_L2 = "M69,172 L98,172 L98,196 L70,196 Z";
const ABS_R2 = "M131,172 L102,172 L102,196 L130,196 Z";
const ABS_L3 = "M70,200 L98,200 L98,222 C90,226 80,226 72,222 Z";
const ABS_R3 = "M130,200 L102,200 L102,222 C110,226 120,226 128,222 Z";

// Serratus anterior (rib fingers on the sides)
const L_SERRATUS = "M44,136 L68,144 L69,168 L66,180 C56,176 48,168 44,156 Z";
const R_SERRATUS = "M156,136 L132,144 L131,168 L134,180 C144,176 152,168 156,156 Z";

// Obliques
const L_OBLIQUE = "M44,156 C48,168 56,176 66,180 L70,196 L72,222 C62,232 52,234 46,228 L44,200 Z";
const R_OBLIQUE = "M156,156 C152,168 144,176 134,180 L130,196 L128,222 C138,232 148,234 154,228 L156,200 Z";

// Biceps — bulging muscle belly
const F_L_BICEP = "M20,116 L44,108 C42,126 40,144 38,162 L12,162 C14,142 16,128 20,116 Z";
const F_R_BICEP = "M180,116 L156,108 C158,126 160,144 162,162 L188,162 C186,142 184,128 180,116 Z";

// Forearms
const F_L_FOREARM = "M12,166 L38,166 C36,190 32,218 26,244 L10,244 C12,218 12,190 12,166 Z";
const F_R_FOREARM = "M188,166 L162,166 C164,190 168,218 174,244 L190,244 C188,218 188,190 188,166 Z";

// Quads — with vastus lateralis / rectus femoris / vastus medialis separation
const F_L_QUAD_OUTER = "M46,228 C52,234 62,240 72,240 L68,290 L56,338 L50,338 C48,300 46,262 46,228 Z";
const F_L_QUAD_MID = "M72,240 C82,242 92,240 98,236 L96,290 L82,338 L68,338 L68,290 Z";
const F_L_QUAD_INNER = "M98,236 L98,222 C92,226 82,228 72,240 L72,240 C82,242 92,240 98,236 Z";
const F_R_QUAD_OUTER = "M154,228 C148,234 138,240 128,240 L132,290 L144,338 L150,338 C152,300 154,262 154,228 Z";
const F_R_QUAD_MID = "M128,240 C118,242 108,240 102,236 L104,290 L118,338 L132,338 L132,290 Z";

// Simplified quad paths (merge inner into mid for cleaner look)
const F_L_QUAD = "M46,228 L72,222 C80,226 90,226 98,222 L98,236 L96,290 L82,338 L50,338 C48,300 46,262 46,228 Z";
const F_R_QUAD = "M154,228 L128,222 C120,226 110,226 102,222 L102,236 L104,290 L118,338 L150,338 C152,300 154,262 154,228 Z";

// Calves — gastrocnemius shape with diamond bulge
const F_L_CALF = "M50,342 L82,342 C84,354 86,368 82,382 C78,394 72,406 68,418 L58,418 C56,406 52,390 50,376 C48,362 48,352 50,342 Z";
const F_R_CALF = "M150,342 L118,342 C116,354 114,368 118,382 C122,394 128,406 132,418 L142,418 C144,406 148,390 150,376 C152,362 152,352 150,342 Z";

/* -- BACK BODY PATHS ------------------------------------------------------ */

// Traps — diamond shape upper back
const B_TRAPS = "M86,72 L100,80 L114,72 L114,80 L136,96 L100,120 L64,96 L86,80 Z";

// Lats — wide V-shape
const B_L_LAT = "M64,96 L44,108 C40,124 38,140 40,156 L68,156 L100,120 Z";
const B_R_LAT = "M136,96 L156,108 C160,124 162,140 160,156 L132,156 L100,120 Z";

// Back detail lines (teres major, infraspinatus hints)
const B_L_TERES = "M44,108 L86,80 L64,96 Z";
const B_R_TERES = "M156,108 L114,80 L136,96 Z";

// Rear delts
const B_L_DELT = "M86,72 C68,72 42,74 28,84 C18,92 16,104 20,116 L44,108 L86,80 Z";
const B_R_DELT = "M114,72 C132,72 158,74 172,84 C182,92 184,104 180,116 L156,108 L114,80 Z";

// Lower back / erector spinae
const B_CORE = "M40,156 L68,156 L72,200 L46,200 Z";
const B_CORE_R = "M160,156 L132,156 L128,200 L154,200 Z";
const B_CORE_MID = "M68,156 L132,156 L128,200 L72,200 Z";

// Triceps — horseshoe shape
const B_L_TRICEP = "M20,116 L44,108 C42,126 40,144 38,162 L12,162 C14,142 16,128 20,116 Z";
const B_R_TRICEP = "M180,116 L156,108 C158,126 160,144 162,162 L188,162 C186,142 184,128 180,116 Z";

// Forearms (back)
const B_L_FOREARM = "M12,166 L38,166 C36,190 32,218 26,244 L10,244 C12,218 12,190 12,166 Z";
const B_R_FOREARM = "M188,166 L162,166 C164,190 168,218 174,244 L190,244 C188,218 188,190 188,166 Z";

// Glutes — rounded shape
const B_L_GLUTE = "M46,200 L100,200 L100,248 C84,260 62,256 46,240 Z";
const B_R_GLUTE = "M154,200 L100,200 L100,248 C116,260 138,256 154,240 Z";

// Hamstrings — biceps femoris + semitendinosus
const B_L_HAM = "M46,240 C62,256 84,260 100,248 L82,338 L50,338 C48,300 46,262 46,240 Z";
const B_R_HAM = "M154,240 C138,256 116,260 100,248 L118,338 L150,338 C152,300 154,262 154,240 Z";

// Calves (back)
const B_L_CALF = "M50,342 L82,342 C84,354 86,368 82,382 C78,394 72,406 68,418 L58,418 C56,406 52,390 50,376 C48,362 48,352 50,342 Z";
const B_R_CALF = "M150,342 L118,342 C116,354 114,368 118,382 C122,394 128,406 132,418 L142,418 C144,406 148,390 150,376 C152,362 152,352 150,342 Z";

/* -- Front Body ----------------------------------------------------------- */

function FrontBody({ color, tap, sel }: BV) {
  const abStyle: React.CSSProperties = {
    fill: color("core"),
    stroke: "var(--background)",
    strokeWidth: 1.2,
    strokeLinejoin: "round",
  };

  return (
    <svg viewBox="0 0 200 460" className="h-56 w-auto">
      {/* Non-muscle */}
      <path d={HEAD} style={neutral} />
      <path d={NECK} style={neutral} />

      {/* Chest */}
      <G m="chest" tap={tap} sel={sel}>
        <path d={F_L_PEC} style={{ fill: color("chest"), ...ms }} />
        <path d={F_R_PEC} style={{ fill: color("chest"), ...ms }} />
        {/* Pec fiber lines */}
        <line x1="54" y1="112" x2="96" y2="130" style={detail} />
        <line x1="60" y1="118" x2="96" y2="136" style={detail} />
        <line x1="146" y1="112" x2="104" y2="130" style={detail} />
        <line x1="140" y1="118" x2="104" y2="136" style={detail} />
      </G>

      {/* Shoulders */}
      <G m="shoulders" tap={tap} sel={sel}>
        <path d={F_L_DELT} style={{ fill: color("shoulders"), ...ms }} />
        <path d={F_R_DELT} style={{ fill: color("shoulders"), ...ms }} />
        {/* Delt head separation */}
        <line x1="56" y1="78" x2="34" y2="106" style={detail} />
        <line x1="144" y1="78" x2="166" y2="106" style={detail} />
      </G>

      {/* Serratus */}
      <G m="chest" tap={tap} sel={sel}>
        <path d={L_SERRATUS} style={{ fill: color("chest"), ...ms }} />
        <path d={R_SERRATUS} style={{ fill: color("chest"), ...ms }} />
        {/* Serratus fingers */}
        <line x1="50" y1="148" x2="66" y2="152" style={detail} />
        <line x1="52" y1="156" x2="66" y2="160" style={detail} />
        <line x1="54" y1="164" x2="66" y2="168" style={detail} />
        <line x1="150" y1="148" x2="134" y2="152" style={detail} />
        <line x1="148" y1="156" x2="134" y2="160" style={detail} />
        <line x1="146" y1="164" x2="134" y2="168" style={detail} />
      </G>

      {/* Core — Sixpack */}
      <G m="core" tap={tap} sel={sel}>
        {/* Obliques */}
        <path d={L_OBLIQUE} style={{ fill: color("core"), ...ms }} />
        <path d={R_OBLIQUE} style={{ fill: color("core"), ...ms }} />
        {/* 6-pack segments */}
        <path d={ABS_L1} style={abStyle} />
        <path d={ABS_R1} style={abStyle} />
        <path d={ABS_L2} style={abStyle} />
        <path d={ABS_R2} style={abStyle} />
        <path d={ABS_L3} style={abStyle} />
        <path d={ABS_R3} style={abStyle} />
        {/* Linea alba */}
        <line x1="100" y1="140" x2="100" y2="228" stroke="var(--background)" strokeWidth="1.4" />
        {/* Oblique diagonal lines */}
        <line x1="46" y1="200" x2="66" y2="182" style={detail} />
        <line x1="48" y1="216" x2="68" y2="196" style={detail} />
        <line x1="154" y1="200" x2="134" y2="182" style={detail} />
        <line x1="152" y1="216" x2="132" y2="196" style={detail} />
      </G>

      {/* Biceps */}
      <G m="biceps" tap={tap} sel={sel}>
        <path d={F_L_BICEP} style={{ fill: color("biceps"), ...ms }} />
        <path d={F_R_BICEP} style={{ fill: color("biceps"), ...ms }} />
        {/* Bicep peak line */}
        <path d="M24,124 C30,136 34,148 36,158" style={{ ...detail, fill: "none" }} />
        <path d="M176,124 C170,136 166,148 164,158" style={{ ...detail, fill: "none" }} />
      </G>

      {/* Forearms */}
      <G m="forearms" tap={tap} sel={sel}>
        <path d={F_L_FOREARM} style={{ fill: color("forearms"), ...ms }} />
        <path d={F_R_FOREARM} style={{ fill: color("forearms"), ...ms }} />
        {/* Brachioradialis line */}
        <path d="M30,170 C28,188 26,210 22,232" style={{ ...detail, fill: "none" }} />
        <path d="M170,170 C172,188 174,210 178,232" style={{ ...detail, fill: "none" }} />
      </G>

      {/* Hands */}
      <path d={L_HAND} style={neutral} />
      <path d={R_HAND} style={neutral} />

      {/* Quads */}
      <G m="quads" tap={tap} sel={sel}>
        <path d={F_L_QUAD} style={{ fill: color("quads"), ...ms }} />
        <path d={F_R_QUAD} style={{ fill: color("quads"), ...ms }} />
        {/* Rectus femoris / vastus separation */}
        <path d="M72,232 C76,260 80,300 80,338" style={{ ...detail, fill: "none" }} />
        <path d="M92,232 C92,260 90,300 88,338" style={{ ...detail, fill: "none" }} />
        <path d="M128,232 C124,260 120,300 120,338" style={{ ...detail, fill: "none" }} />
        <path d="M108,232 C108,260 110,300 112,338" style={{ ...detail, fill: "none" }} />
        {/* Teardrop (VMO) */}
        <path d="M92,310 C96,320 96,332 92,338" style={{ ...detail, fill: "none" }} />
        <path d="M108,310 C104,320 104,332 108,338" style={{ ...detail, fill: "none" }} />
      </G>

      {/* Calves */}
      <G m="calves" tap={tap} sel={sel}>
        <path d={F_L_CALF} style={{ fill: color("calves"), ...ms }} />
        <path d={F_R_CALF} style={{ fill: color("calves"), ...ms }} />
        {/* Tibialis anterior */}
        <path d="M66,348 C68,364 68,382 66,400" style={{ ...detail, fill: "none" }} />
        <path d="M134,348 C132,364 132,382 134,400" style={{ ...detail, fill: "none" }} />
      </G>

      {/* Feet */}
      <path d={L_FOOT} style={neutral} />
      <path d={R_FOOT} style={neutral} />

      {/* Knee caps (non-muscle) */}
      <ellipse cx="68" cy="340" rx="8" ry="4" style={neutral} />
      <ellipse cx="132" cy="340" rx="8" ry="4" style={neutral} />
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

      {/* Back — Traps + Lats + Teres */}
      <G m="back" tap={tap} sel={sel}>
        <path d={B_TRAPS} style={{ fill: color("back"), ...ms }} />
        <path d={B_L_LAT} style={{ fill: color("back"), ...ms }} />
        <path d={B_R_LAT} style={{ fill: color("back"), ...ms }} />
        <path d={B_L_TERES} style={{ fill: color("back"), ...ms }} />
        <path d={B_R_TERES} style={{ fill: color("back"), ...ms }} />
        {/* Spine line */}
        <line x1="100" y1="80" x2="100" y2="200" stroke="var(--background)" strokeWidth="1.0" />
        {/* Trap fibers */}
        <line x1="92" y1="76" x2="80" y2="90" style={detail} />
        <line x1="108" y1="76" x2="120" y2="90" style={detail} />
        {/* Lat striation */}
        <path d="M58,120 C62,136 64,148 66,156" style={{ ...detail, fill: "none" }} />
        <path d="M142,120 C138,136 136,148 134,156" style={{ ...detail, fill: "none" }} />
        <path d="M52,128 C56,140 60,150 64,156" style={{ ...detail, fill: "none" }} />
        <path d="M148,128 C144,140 140,150 136,156" style={{ ...detail, fill: "none" }} />
        {/* Scapula hint */}
        <path d="M72,92 C78,100 84,108 88,116" style={{ ...detail, fill: "none" }} />
        <path d="M128,92 C122,100 116,108 112,116" style={{ ...detail, fill: "none" }} />
      </G>

      {/* Shoulders */}
      <G m="shoulders" tap={tap} sel={sel}>
        <path d={B_L_DELT} style={{ fill: color("shoulders"), ...ms }} />
        <path d={B_R_DELT} style={{ fill: color("shoulders"), ...ms }} />
        <line x1="56" y1="78" x2="34" y2="106" style={detail} />
        <line x1="144" y1="78" x2="166" y2="106" style={detail} />
      </G>

      {/* Lower back (core) — erector spinae */}
      <G m="core" tap={tap} sel={sel}>
        <path d={B_CORE} style={{ fill: color("core"), ...ms }} />
        <path d={B_CORE_R} style={{ fill: color("core"), ...ms }} />
        <path d={B_CORE_MID} style={{ fill: color("core"), ...ms }} />
        {/* Erector spinae lines */}
        <path d="M90,158 C88,172 86,186 84,200" style={{ ...detail, fill: "none" }} />
        <path d="M110,158 C112,172 114,186 116,200" style={{ ...detail, fill: "none" }} />
      </G>

      {/* Triceps */}
      <G m="triceps" tap={tap} sel={sel}>
        <path d={B_L_TRICEP} style={{ fill: color("triceps"), ...ms }} />
        <path d={B_R_TRICEP} style={{ fill: color("triceps"), ...ms }} />
        {/* Tricep head separation */}
        <path d="M30,120 C32,134 34,148 36,158" style={{ ...detail, fill: "none" }} />
        <path d="M170,120 C168,134 166,148 164,158" style={{ ...detail, fill: "none" }} />
      </G>

      {/* Forearms */}
      <G m="forearms" tap={tap} sel={sel}>
        <path d={B_L_FOREARM} style={{ fill: color("forearms"), ...ms }} />
        <path d={B_R_FOREARM} style={{ fill: color("forearms"), ...ms }} />
      </G>

      {/* Hands */}
      <path d={L_HAND} style={neutral} />
      <path d={R_HAND} style={neutral} />

      {/* Glutes */}
      <G m="glutes" tap={tap} sel={sel}>
        <path d={B_L_GLUTE} style={{ fill: color("glutes"), ...ms }} />
        <path d={B_R_GLUTE} style={{ fill: color("glutes"), ...ms }} />
        {/* Glute med / max separation */}
        <path d="M56,208 C68,224 84,236 100,240" style={{ ...detail, fill: "none" }} />
        <path d="M144,208 C132,224 116,236 100,240" style={{ ...detail, fill: "none" }} />
      </G>

      {/* Hamstrings */}
      <G m="hamstrings" tap={tap} sel={sel}>
        <path d={B_L_HAM} style={{ fill: color("hamstrings"), ...ms }} />
        <path d={B_R_HAM} style={{ fill: color("hamstrings"), ...ms }} />
        {/* Biceps femoris / semitendinosus split */}
        <path d="M76,254 C78,280 80,310 82,338" style={{ ...detail, fill: "none" }} />
        <path d="M124,254 C122,280 120,310 118,338" style={{ ...detail, fill: "none" }} />
      </G>

      {/* Calves */}
      <G m="calves" tap={tap} sel={sel}>
        <path d={B_L_CALF} style={{ fill: color("calves"), ...ms }} />
        <path d={B_R_CALF} style={{ fill: color("calves"), ...ms }} />
        {/* Gastrocnemius medial/lateral head */}
        <path d="M66,346 C68,358 68,372 66,386" style={{ ...detail, fill: "none" }} />
        <path d="M134,346 C132,358 132,372 134,386" style={{ ...detail, fill: "none" }} />
      </G>

      {/* Feet */}
      <path d={L_FOOT} style={neutral} />
      <path d={R_FOOT} style={neutral} />
    </svg>
  );
}
