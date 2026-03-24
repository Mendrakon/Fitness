export type MuscleGroup =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "forearms" | "core" | "quads" | "hamstrings" | "glutes"
  | "calves" | "full_body" | "cardio" | "other";

export type ExerciseCategory =
  | "barbell" | "dumbbell" | "machine" | "cable"
  | "bodyweight" | "band" | "kettlebell" | "other";

export type SetTag = "warmup" | "dropset" | "failure" | null;

export type RPE = 6 | 6.5 | 7 | 7.5 | 8 | 8.5 | 9 | 9.5 | 10 | null;

export type WeightUnit = "kg" | "lbs";

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup;
  isCustom: boolean;
  equipment: string;
  pinnedNote?: string;
  defaultRestTimerWork?: number;
  defaultRestTimerWarmup?: number;
}

export interface CardioData {
  durationMin: number | null;
  distanceKm: number | null;
  speedKmh: number | null;
  incline: number | null;
  calories: number | null;
}

export interface WorkoutSet {
  id: string;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  tag: SetTag;
  rpe: RPE;
  cardio?: CardioData;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  notes: string;
  supersetGroupId?: string;
}

export interface Workout {
  id: string;
  name: string;
  templateId: string | null;
  startTime: string;
  endTime: string | null;
  exercises: WorkoutExercise[];
  notes: string;
}

export interface TemplateSet {
  id: string;
  weight: number | null;
  reps: number | null;
  tag: SetTag;
  rpe: RPE;
}

export interface TemplateExercise {
  id: string;
  exerciseId: string;
  sets: TemplateSet[];
  notes: string;
  supersetGroupId?: string;
}

export interface Template {
  id: string;
  name: string;
  folderId: string | null;
  exercises: TemplateExercise[];
  notes: string;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
  sourceEventId?: string; // set when saved from a community feed post
}

export interface Folder {
  id: string;
  name: string;
  order: number;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weight: number | null;
  bodyFatPercent: number | null;
  calories: number | null;
}

export type ThemeMode = "light" | "dark" | "system" | "gym-dark";

export type AccentColor = "blue" | "purple" | "green" | "orange" | "red" | "pink";

export interface AppSettings {
  weightUnit: WeightUnit;
  defaultRestTimerWork: number;
  defaultRestTimerWarmup: number;
  restTimerAutoStart: boolean;
  restTimerNotification: boolean;
  showPreviousValues: boolean;
  theme: ThemeMode;
  accentColor: AccentColor;
  accentStrength: number;
  prThresholdWeight: number;
  prThresholdReps: number;
  prThresholdVolumePercent: number;
  prThreshold1RMPercent: number;
}

export interface PersonalRecord {
  exerciseId: string;
  bestWeight: { weight: number; reps: number; date: string } | null;
  bestVolume: { volume: number; date: string } | null;
  estimated1RM: { value: number; date: string } | null;
  bestByReps: Record<number, { weight: number; date: string }>;
}

export type PRMetric = "weight" | "reps" | "volume" | "estimated1rm";

export const PR_METRIC_LABELS: Record<PRMetric, string> = {
  weight: "Gewicht",
  reps: "Wiederholungen",
  volume: "Volumen",
  estimated1rm: "Gesch. 1RM",
};

export interface PREvent {
  id: string;
  exerciseId: string;
  date: string;
  workoutId: string;
  metric: PRMetric;
  newValue: number;
  oldValue: number;
  diff: number;
  diffPercent: number;
  weight: number;
  reps: number;
  volume: number;
  estimated1rm: number;
}

export function formatPRDiff(pr: PREvent): string {
  // First-ever PR (no previous data)
  if (pr.oldValue === 0) {
    if (pr.metric === "weight") return `${pr.newValue} kg`;
    if (pr.metric === "reps") return `${pr.newValue} Wdh`;
    if (pr.metric === "volume") return `${pr.newValue} kg`;
    return `${pr.newValue}`;
  }
  // Improvement over previous PR
  if (pr.metric === "reps") return `+${pr.diff} Wdh`;
  if (pr.metric === "weight") return `+${pr.diff} kg`;
  if (pr.metric === "volume") return `+${pr.diffPercent}% Vol`;
  return `+${pr.diffPercent}% 1RM`;
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Brust",
  back: "Rücken",
  shoulders: "Schultern",
  biceps: "Bizeps",
  triceps: "Trizeps",
  forearms: "Unterarme",
  core: "Core",
  quads: "Quadrizeps",
  hamstrings: "Beinbeuger",
  glutes: "Gesäß",
  calves: "Waden",
  full_body: "Ganzkörper",
  cardio: "Cardio",
  other: "Sonstige",
};

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  barbell: "Langhantel",
  dumbbell: "Kurzhantel",
  machine: "Maschine",
  cable: "Kabelzug",
  bodyweight: "Körpergewicht",
  band: "Band",
  kettlebell: "Kettlebell",
  other: "Sonstige",
};

// ── Klettersteig Types ───────────────────────────────────────────────────────

export type KlettersteigDifficulty =
  | "A" | "A/B" | "B" | "B/C" | "C" | "C/D" | "D" | "D/E" | "E";

export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "windy" | "cold";

export type WindStrength = "calm" | "light" | "moderate" | "strong";

export interface KlettersteigRoute {
  id: string;
  locationId: string;
  name: string;
  difficulty: KlettersteigDifficulty;
  latitude: number;
  longitude: number;
  elevationGain?: number;
  description?: string;
  parkingIds?: string[];
}

export interface KlettersteigParking {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
}

export interface KlettersteigWeather {
  condition: WeatherCondition;
  temperature: number | null;
  wind: WindStrength | null;
}

export interface KlettersteigSession {
  id: string;
  userId: string;
  routeId: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number;
  extraWeightKg: number;
  weather: KlettersteigWeather;
  notes: string;
}

export type KlettersteigPRMetric = "best_time" | "max_weight" | "best_weighted_time";

export interface KlettersteigPREvent {
  id: string;
  userId: string;
  routeId: string;
  sessionId: string;
  date: string;
  metric: KlettersteigPRMetric;
  newValue: number;
  oldValue: number;
  diff: number;
  diffPercent: number;
  durationSeconds: number;
  extraWeightKg: number;
}

export type BadgeCategory = "routen" | "speed" | "gewicht" | "kombi";

export interface KlettersteigBadge {
  id: string;        // "{badgeId}_{userId}"
  userId: string;
  badgeId: string;
  earnedAt: string;  // ISO timestamp
  sessionId: string;
}

export const KLETTERSTEIG_PR_METRIC_LABELS: Record<KlettersteigPRMetric, string> = {
  best_time: "Bestzeit",
  max_weight: "Max. Gewicht",
  best_weighted_time: "Gewichtete Bestzeit",
};

export const KLETTERSTEIG_DIFFICULTY_COLORS: Record<KlettersteigDifficulty, string> = {
  "A": "bg-green-500",
  "A/B": "bg-green-400",
  "B": "bg-yellow-500",
  "B/C": "bg-orange-400",
  "C": "bg-orange-500",
  "C/D": "bg-red-400",
  "D": "bg-red-500",
  "D/E": "bg-red-600",
  "E": "bg-red-700",
};

export const WEATHER_LABELS: Record<WeatherCondition, string> = {
  sunny: "Sonnig",
  cloudy: "Bewölkt",
  rainy: "Regen",
  windy: "Windig",
  cold: "Kalt",
};

export const WEATHER_ICONS: Record<WeatherCondition, string> = {
  sunny: "☀️",
  cloudy: "⛅",
  rainy: "🌧️",
  windy: "💨",
  cold: "🥶",
};

export const WIND_LABELS: Record<WindStrength, string> = {
  calm: "Windstill",
  light: "Leicht",
  moderate: "Mäßig",
  strong: "Stark",
};

export function formatKlettersteigPRDiff(pr: KlettersteigPREvent): string {
  if (pr.oldValue === 0) {
    if (pr.metric === "best_time") return formatKlettersteigTime(pr.newValue);
    if (pr.metric === "max_weight") return `${pr.newValue} kg`;
    return formatKlettersteigTime(pr.newValue);
  }
  if (pr.metric === "best_time") return `-${formatKlettersteigTime(Math.abs(pr.diff))}`;
  if (pr.metric === "max_weight") return `+${pr.diff} kg`;
  return `-${formatKlettersteigTime(Math.abs(pr.diff))}`;
}

export function formatKlettersteigTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
