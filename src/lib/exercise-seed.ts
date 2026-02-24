import type { Exercise } from "./types";

export const BUILT_IN_EXERCISES: Exercise[] = [
  // CHEST
  { id: "ex-bench-press", name: "Bankdrücken", category: "barbell", muscleGroup: "chest", isCustom: false, equipment: "Langhantel" },
  { id: "ex-incline-bench", name: "Schrägbankdrücken", category: "barbell", muscleGroup: "chest", isCustom: false, equipment: "Langhantel" },
  { id: "ex-decline-bench", name: "Negativ-Bankdrücken", category: "barbell", muscleGroup: "chest", isCustom: false, equipment: "Langhantel" },
  { id: "ex-db-bench", name: "KH Bankdrücken", category: "dumbbell", muscleGroup: "chest", isCustom: false, equipment: "Kurzhanteln" },
  { id: "ex-db-incline-bench", name: "KH Schrägbankdrücken", category: "dumbbell", muscleGroup: "chest", isCustom: false, equipment: "Kurzhanteln" },
  { id: "ex-db-fly", name: "KH Fliegende", category: "dumbbell", muscleGroup: "chest", isCustom: false, equipment: "Kurzhanteln" },
  { id: "ex-cable-crossover", name: "Cable Crossover", category: "cable", muscleGroup: "chest", isCustom: false, equipment: "Kabelzug" },
  { id: "ex-push-up", name: "Liegestütze", category: "bodyweight", muscleGroup: "chest", isCustom: false, equipment: "Körpergewicht" },
  { id: "ex-chest-press-machine", name: "Brustpresse Maschine", category: "machine", muscleGroup: "chest", isCustom: false, equipment: "Maschine" },
  { id: "ex-pec-deck", name: "Butterfly Maschine", category: "machine", muscleGroup: "chest", isCustom: false, equipment: "Maschine" },

  // BACK
  { id: "ex-pull-up", name: "Klimmzüge", category: "bodyweight", muscleGroup: "back", isCustom: false, equipment: "Klimmzugstange" },
  { id: "ex-lat-pulldown", name: "Latzug", category: "cable", muscleGroup: "back", isCustom: false, equipment: "Kabelzug" },
  { id: "ex-barbell-row", name: "Langhantelrudern", category: "barbell", muscleGroup: "back", isCustom: false, equipment: "Langhantel" },
  { id: "ex-db-row", name: "KH Rudern einarmig", category: "dumbbell", muscleGroup: "back", isCustom: false, equipment: "Kurzhantel" },
  { id: "ex-seated-cable-row", name: "Kabelrudern sitzend", category: "cable", muscleGroup: "back", isCustom: false, equipment: "Kabelzug" },
  { id: "ex-t-bar-row", name: "T-Bar Rudern", category: "barbell", muscleGroup: "back", isCustom: false, equipment: "Langhantel" },
  { id: "ex-deadlift", name: "Kreuzheben", category: "barbell", muscleGroup: "back", isCustom: false, equipment: "Langhantel" },
  { id: "ex-face-pull", name: "Face Pulls", category: "cable", muscleGroup: "back", isCustom: false, equipment: "Kabelzug" },

  // SHOULDERS
  { id: "ex-ohp", name: "Schulterdrücken LH", category: "barbell", muscleGroup: "shoulders", isCustom: false, equipment: "Langhantel" },
  { id: "ex-db-ohp", name: "Schulterdrücken KH", category: "dumbbell", muscleGroup: "shoulders", isCustom: false, equipment: "Kurzhanteln" },
  { id: "ex-lateral-raise", name: "Seitheben", category: "dumbbell", muscleGroup: "shoulders", isCustom: false, equipment: "Kurzhanteln" },
  { id: "ex-front-raise", name: "Frontheben", category: "dumbbell", muscleGroup: "shoulders", isCustom: false, equipment: "Kurzhanteln" },
  { id: "ex-rear-delt-fly", name: "Reverse Flys", category: "dumbbell", muscleGroup: "shoulders", isCustom: false, equipment: "Kurzhanteln" },
  { id: "ex-arnold-press", name: "Arnold Press", category: "dumbbell", muscleGroup: "shoulders", isCustom: false, equipment: "Kurzhanteln" },
  { id: "ex-upright-row", name: "Aufrechtes Rudern", category: "barbell", muscleGroup: "shoulders", isCustom: false, equipment: "Langhantel" },

  // BICEPS
  { id: "ex-barbell-curl", name: "Langhantelcurls", category: "barbell", muscleGroup: "biceps", isCustom: false, equipment: "Langhantel" },
  { id: "ex-db-curl", name: "KH Curls", category: "dumbbell", muscleGroup: "biceps", isCustom: false, equipment: "Kurzhanteln" },
  { id: "ex-hammer-curl", name: "Hammercurls", category: "dumbbell", muscleGroup: "biceps", isCustom: false, equipment: "Kurzhanteln" },
  { id: "ex-preacher-curl", name: "Preacher Curls", category: "dumbbell", muscleGroup: "biceps", isCustom: false, equipment: "Kurzhantel" },
  { id: "ex-cable-curl", name: "Kabelcurls", category: "cable", muscleGroup: "biceps", isCustom: false, equipment: "Kabelzug" },
  { id: "ex-incline-curl", name: "Schrägbank Curls", category: "dumbbell", muscleGroup: "biceps", isCustom: false, equipment: "Kurzhanteln" },

  // TRICEPS
  { id: "ex-tricep-pushdown", name: "Trizepsdrücken Kabel", category: "cable", muscleGroup: "triceps", isCustom: false, equipment: "Kabelzug" },
  { id: "ex-skull-crusher", name: "Skull Crushers", category: "barbell", muscleGroup: "triceps", isCustom: false, equipment: "SZ-Stange" },
  { id: "ex-overhead-extension", name: "Überkopf Trizeps", category: "dumbbell", muscleGroup: "triceps", isCustom: false, equipment: "Kurzhantel" },
  { id: "ex-dips", name: "Dips", category: "bodyweight", muscleGroup: "triceps", isCustom: false, equipment: "Dipständer" },
  { id: "ex-close-grip-bench", name: "Enges Bankdrücken", category: "barbell", muscleGroup: "triceps", isCustom: false, equipment: "Langhantel" },
  { id: "ex-tricep-kickback", name: "Trizeps Kickbacks", category: "dumbbell", muscleGroup: "triceps", isCustom: false, equipment: "Kurzhantel" },

  // QUADS
  { id: "ex-squat", name: "Kniebeugen", category: "barbell", muscleGroup: "quads", isCustom: false, equipment: "Langhantel" },
  { id: "ex-front-squat", name: "Frontkniebeugen", category: "barbell", muscleGroup: "quads", isCustom: false, equipment: "Langhantel" },
  { id: "ex-leg-press", name: "Beinpresse", category: "machine", muscleGroup: "quads", isCustom: false, equipment: "Maschine" },
  { id: "ex-leg-extension", name: "Beinstrecker", category: "machine", muscleGroup: "quads", isCustom: false, equipment: "Maschine" },
  { id: "ex-bulgarian-split", name: "Bulgarische Kniebeugen", category: "dumbbell", muscleGroup: "quads", isCustom: false, equipment: "Kurzhanteln" },
  { id: "ex-hack-squat", name: "Hack Squat", category: "machine", muscleGroup: "quads", isCustom: false, equipment: "Maschine" },
  { id: "ex-lunges", name: "Ausfallschritte", category: "dumbbell", muscleGroup: "quads", isCustom: false, equipment: "Kurzhanteln" },

  // HAMSTRINGS
  { id: "ex-rdl", name: "Rumänisches Kreuzheben", category: "barbell", muscleGroup: "hamstrings", isCustom: false, equipment: "Langhantel" },
  { id: "ex-leg-curl", name: "Beinbeuger", category: "machine", muscleGroup: "hamstrings", isCustom: false, equipment: "Maschine" },
  { id: "ex-good-morning", name: "Good Mornings", category: "barbell", muscleGroup: "hamstrings", isCustom: false, equipment: "Langhantel" },
  { id: "ex-nordic-curl", name: "Nordic Curls", category: "bodyweight", muscleGroup: "hamstrings", isCustom: false, equipment: "Körpergewicht" },
  { id: "ex-db-rdl", name: "KH Rumänisches Kreuzheben", category: "dumbbell", muscleGroup: "hamstrings", isCustom: false, equipment: "Kurzhanteln" },

  // GLUTES
  { id: "ex-hip-thrust", name: "Hip Thrusts", category: "barbell", muscleGroup: "glutes", isCustom: false, equipment: "Langhantel" },
  { id: "ex-glute-bridge", name: "Glute Bridge", category: "bodyweight", muscleGroup: "glutes", isCustom: false, equipment: "Körpergewicht" },
  { id: "ex-cable-kickback", name: "Cable Kickbacks", category: "cable", muscleGroup: "glutes", isCustom: false, equipment: "Kabelzug" },

  // CALVES
  { id: "ex-standing-calf-raise", name: "Wadenheben stehend", category: "machine", muscleGroup: "calves", isCustom: false, equipment: "Maschine" },
  { id: "ex-seated-calf-raise", name: "Wadenheben sitzend", category: "machine", muscleGroup: "calves", isCustom: false, equipment: "Maschine" },

  // CORE
  { id: "ex-plank", name: "Plank", category: "bodyweight", muscleGroup: "core", isCustom: false, equipment: "Körpergewicht" },
  { id: "ex-hanging-leg-raise", name: "Hängendes Beinheben", category: "bodyweight", muscleGroup: "core", isCustom: false, equipment: "Klimmzugstange" },
  { id: "ex-cable-crunch", name: "Kabel Crunches", category: "cable", muscleGroup: "core", isCustom: false, equipment: "Kabelzug" },
  { id: "ex-ab-wheel", name: "Ab Wheel Rollout", category: "other", muscleGroup: "core", isCustom: false, equipment: "Ab Wheel" },
  { id: "ex-russian-twist", name: "Russian Twists", category: "bodyweight", muscleGroup: "core", isCustom: false, equipment: "Körpergewicht" },

  // FOREARMS
  { id: "ex-wrist-curl", name: "Handgelenkbeugen", category: "dumbbell", muscleGroup: "forearms", isCustom: false, equipment: "Kurzhantel" },
  { id: "ex-reverse-wrist-curl", name: "Reverse Handgelenkbeugen", category: "dumbbell", muscleGroup: "forearms", isCustom: false, equipment: "Kurzhantel" },

  // FULL BODY
  { id: "ex-clean-press", name: "Clean & Press", category: "barbell", muscleGroup: "full_body", isCustom: false, equipment: "Langhantel" },
  { id: "ex-thruster", name: "Thrusters", category: "barbell", muscleGroup: "full_body", isCustom: false, equipment: "Langhantel" },
  { id: "ex-burpees", name: "Burpees", category: "bodyweight", muscleGroup: "full_body", isCustom: false, equipment: "Körpergewicht" },
  { id: "ex-kettlebell-swing", name: "Kettlebell Swings", category: "kettlebell", muscleGroup: "full_body", isCustom: false, equipment: "Kettlebell" },
];
