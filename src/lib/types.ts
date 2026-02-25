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

export interface WorkoutSet {
  id: string;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  tag: SetTag;
  rpe: RPE;
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

export type ThemeMode = "light" | "dark" | "system";

export interface AppSettings {
  weightUnit: WeightUnit;
  defaultRestTimerWork: number;
  defaultRestTimerWarmup: number;
  restTimerSound: boolean;
  restTimerAutoStart: boolean;
  showPreviousValues: boolean;
  theme: ThemeMode;
}

export interface PersonalRecord {
  exerciseId: string;
  bestWeight: { weight: number; reps: number; date: string } | null;
  bestVolume: { volume: number; date: string } | null;
  estimated1RM: { value: number; date: string } | null;
  bestByReps: Record<number, { weight: number; date: string }>;
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
