import type { Exercise } from "./types";

export interface ExerciseTargetProfile {
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  movementPattern: string;
  isUnilateral: boolean;
  notes: string;
}

type TargetRule = {
  match: RegExp;
  profile: ExerciseTargetProfile;
};

const stabilizers = {
  press: ["Anterior deltoids", "Triceps brachii", "Serratus anterior", "Rotator cuff", "Core/abs"],
  chestPress: [
    "Anterior deltoids - major secondary mover",
    "Triceps brachii - pressing/lockout",
    "Serratus anterior - shoulder blade control/stability",
    "Pectoralis minor - shoulder/scapula assistance",
    "Rotator cuff - shoulder stabilization",
    "Lats - stabilization and bar control",
    "Rhomboids - upper-back stability",
    "Traps - middle/lower scapular stability",
    "Biceps brachii - minor elbow/shoulder stabilization",
    "Forearms - grip and wrist stability",
    "Core/abs - bracing",
    "Glutes - bench stability and leg drive",
    "Quads - leg drive",
    "Hamstrings - lower-body tension/stability"
  ],
  row: ["Rhomboids", "Traps - middle/lower", "Rear delts", "Biceps brachii", "Brachialis", "Forearms", "Core/abs"],
  verticalPull: ["Teres major", "Rhomboids", "Traps - middle/lower", "Rear delts", "Biceps brachii", "Brachialis", "Forearms", "Core/abs"],
  squat: ["Glutes", "Adductors", "Hamstrings", "Calves", "Erector spinae", "Core/abs"],
  hinge: ["Glutes", "Hamstrings", "Adductors", "Erector spinae", "Lats", "Traps", "Forearms", "Core/abs"],
  lunge: ["Glutes", "Hamstrings", "Adductors", "Calves", "Erector spinae", "Core/abs"],
  calf: ["Soleus", "Tibialis posterior", "Intrinsic foot muscles"],
  curl: ["Brachialis", "Brachioradialis", "Forearms", "Anterior deltoids - shoulder stabilization", "Core/abs"],
  triceps: ["Anconeus", "Anterior deltoids - shoulder stabilization", "Forearms", "Core/abs"],
  shoulderRaise: ["Supraspinatus", "Traps", "Serratus anterior", "Rotator cuff", "Core/abs"]
};

export function inferExerciseTargetProfile(name: string): ExerciseTargetProfile {
  const normalized = normalizeExerciseName(name);
  const exact = exactProfiles[normalized];
  if (exact) return exact;
  const matched = targetRules.find((rule) => rule.match.test(normalized));
  if (matched) return matched.profile;
  return buildProfile({
    primaryMuscle: "Full body",
    secondaryMuscles: ["Core/abs", "Forearms", "Stabilizers"],
    equipment: equipmentFromName(normalized),
    movementPattern: "General strength",
    isUnilateral: unilateralFromName(normalized),
    notes: "Muscle target inferred from exercise name; review manually if this is a custom movement."
  });
}

export function enrichExerciseTargets(exercise: Exercise): Exercise {
  const profile = inferExerciseTargetProfile(exercise.name);
  return {
    ...exercise,
    primaryMuscle: profile.primaryMuscle,
    secondaryMuscles: profile.secondaryMuscles,
    equipment: profile.equipment,
    movementPattern: profile.movementPattern,
    isUnilateral: profile.isUnilateral,
    notes: mergeNotes(exercise.notes, profile.notes)
  };
}

function buildProfile(profile: ExerciseTargetProfile): ExerciseTargetProfile {
  return {
    ...profile,
    secondaryMuscles: unique(profile.secondaryMuscles),
    equipment: profile.equipment || "Unspecified",
    movementPattern: profile.movementPattern || "General strength"
  };
}

function chestPressProfile(equipment: string, movementPattern = "Horizontal press", primaryMuscle = "Pectoralis major"): ExerciseTargetProfile {
  return buildProfile({
    primaryMuscle,
    secondaryMuscles: stabilizers.chestPress,
    equipment,
    movementPattern,
    isUnilateral: false,
    notes:
      "Muscle targets: Pectoralis major - main mover; anterior deltoids - major secondary mover; triceps brachii - pressing/lockout; serratus anterior and pectoralis minor - shoulder blade assistance; rotator cuff, lats, rhomboids, middle/lower traps, biceps, forearms, core, glutes, quads, and hamstrings - stabilization, grip, bracing, leg drive, and whole-body tension."
  });
}

function profile(
  primaryMuscle: string,
  secondaryMuscles: string[],
  equipment: string,
  movementPattern: string,
  options: Partial<Pick<ExerciseTargetProfile, "isUnilateral" | "notes">> = {}
): ExerciseTargetProfile {
  const all = [primaryMuscle, ...secondaryMuscles].filter(Boolean);
  return buildProfile({
    primaryMuscle,
    secondaryMuscles,
    equipment,
    movementPattern,
    isUnilateral: options.isUnilateral ?? false,
    notes: options.notes ?? `Muscle targets: ${all.join(", ")}.`
  });
}

const exactProfiles: Record<string, ExerciseTargetProfile> = {
  "bench press barbell": chestPressProfile("Barbell"),
  "bench press close grip": profile("Triceps brachii", ["Pectoralis major", "Anterior deltoids", "Serratus anterior", "Rotator cuff", "Forearms", "Core/abs", "Lats"], "Barbell", "Close-grip horizontal press"),
  "incline bench press barbell": chestPressProfile("Barbell", "Incline press", "Upper pectoralis major"),
  "incline bench press dumbbell": chestPressProfile("Dumbbell", "Incline press", "Upper pectoralis major"),
  "chest press machine": chestPressProfile("Machine"),
  "incline chest press machine": chestPressProfile("Machine", "Incline press", "Upper pectoralis major"),
  "dip weighted": profile("Pectoralis major", ["Triceps brachii", "Anterior deltoids", "Serratus anterior", "Lats", "Lower traps", "Rotator cuff", "Core/abs"], "Weighted bodyweight", "Dip"),
  "dips": profile("Pectoralis major", ["Triceps brachii", "Anterior deltoids", "Serratus anterior", "Lats", "Lower traps", "Rotator cuff", "Core/abs"], "Bodyweight", "Dip"),
  "seated dip machine": profile("Triceps brachii", ["Pectoralis major", "Anterior deltoids", "Forearms", "Core/abs"], "Machine", "Dip"),
  "cable crossover": profile("Pectoralis major", ["Anterior deltoids", "Serratus anterior", "Pectoralis minor", "Rotator cuff", "Core/abs"], "Cable", "Chest fly"),
  "chest fly cable": profile("Pectoralis major", ["Anterior deltoids", "Serratus anterior", "Pectoralis minor", "Rotator cuff", "Core/abs"], "Cable", "Chest fly"),
  "chest fly dumbbell": profile("Pectoralis major", ["Anterior deltoids", "Serratus anterior", "Pectoralis minor", "Rotator cuff", "Forearms", "Core/abs"], "Dumbbell", "Chest fly"),
  "chest fly machine": profile("Pectoralis major", ["Anterior deltoids", "Serratus anterior", "Pectoralis minor", "Rotator cuff"], "Machine", "Chest fly"),
  "pullover dumbbell": profile("Latissimus dorsi", ["Pectoralis major", "Teres major", "Long head triceps", "Serratus anterior", "Core/abs"], "Dumbbell", "Shoulder extension/pullover"),

  "bent over row barbell": profile("Latissimus dorsi", stabilizers.row, "Barbell", "Horizontal pull/row"),
  "chest supported row machine": profile("Latissimus dorsi", stabilizers.row, "Machine", "Chest-supported row"),
  "high row": profile("Latissimus dorsi", ["Teres major", "Rhomboids", "Traps - middle/lower", "Rear delts", "Biceps brachii", "Forearms"], "Machine", "High row"),
  "seated row cable": profile("Latissimus dorsi", stabilizers.row, "Cable", "Horizontal pull/row"),
  "seated wide grip row cable": profile("Rhomboids", ["Latissimus dorsi", "Traps - middle/lower", "Rear delts", "Biceps brachii", "Forearms"], "Cable", "Wide-grip row"),
  "single arm iso row": profile("Latissimus dorsi", stabilizers.row, "Machine", "Single-arm row", { isUnilateral: true }),
  "single arm row dumbbell": profile("Latissimus dorsi", stabilizers.row, "Dumbbell", "Single-arm row", { isUnilateral: true }),
  "lat pulldown": profile("Latissimus dorsi", stabilizers.verticalPull, "Cable", "Vertical pull"),
  "lat pulldown neutral grip": profile("Latissimus dorsi", stabilizers.verticalPull, "Cable", "Neutral-grip vertical pull"),
  "lat pulldown single arm": profile("Latissimus dorsi", stabilizers.verticalPull, "Cable", "Single-arm vertical pull", { isUnilateral: true }),
  "pull up weighted": profile("Latissimus dorsi", stabilizers.verticalPull, "Weighted bodyweight", "Vertical pull"),
  "face pull": profile("Rear delts", ["Rotator cuff", "Traps - middle/lower", "Rhomboids", "External rotators", "Biceps brachii", "Forearms"], "Cable", "Scapular retraction/external rotation"),
  "rear delt fly cable": profile("Rear delts", ["Rhomboids", "Traps - middle/lower", "Rotator cuff", "Core/abs"], "Cable", "Rear delt fly"),
  "rear delt fly machine": profile("Rear delts", ["Rhomboids", "Traps - middle/lower", "Rotator cuff"], "Machine", "Rear delt fly"),

  "squat barbell": profile("Quads", stabilizers.squat, "Barbell", "Squat"),
  "hack squat": profile("Quads", ["Glutes", "Adductors", "Hamstrings", "Calves", "Core/abs"], "Machine", "Squat"),
  "leg press": profile("Quads", ["Glutes", "Adductors", "Hamstrings", "Calves", "Core/abs"], "Machine", "Leg press"),
  "leg press 45 degrees": profile("Quads", ["Glutes", "Adductors", "Hamstrings", "Calves", "Core/abs"], "Machine", "45-degree leg press"),
  "single leg press": profile("Quads", ["Glutes", "Adductors", "Hamstrings", "Calves", "Core/abs"], "Machine", "Single-leg press", { isUnilateral: true }),
  "leg extension": profile("Quads", ["Hip flexors - stabilization", "Core/abs"], "Machine", "Knee extension"),
  "bulgarian split squat barbell": profile("Quads", stabilizers.lunge, "Barbell", "Split squat", { isUnilateral: true }),
  "bulgarian split squat dumbbell": profile("Quads", stabilizers.lunge, "Dumbbell", "Split squat", { isUnilateral: true }),
  "walking lunge dumbbell": profile("Quads", stabilizers.lunge, "Dumbbell", "Lunge", { isUnilateral: true }),
  "romanian deadlift barbell": profile("Hamstrings", stabilizers.hinge, "Barbell", "Hip hinge"),
  "romanian deadlift dumbbell": profile("Hamstrings", stabilizers.hinge, "Dumbbell", "Hip hinge"),
  "stiff leg deadlift": profile("Hamstrings", stabilizers.hinge, "Barbell", "Hip hinge"),
  "hamstring curl": profile("Hamstrings", ["Gastrocnemius", "Glutes - pelvic stability"], "Machine", "Knee flexion"),
  "lying leg curl": profile("Hamstrings", ["Gastrocnemius", "Glutes - pelvic stability"], "Machine", "Knee flexion"),
  "seated hamstring curl": profile("Hamstrings", ["Gastrocnemius", "Glutes - pelvic stability"], "Machine", "Knee flexion"),
  "hip thrust barbell": profile("Glutes", ["Hamstrings", "Adductors", "Quads", "Erector spinae", "Core/abs"], "Barbell", "Hip extension"),
  "back extension weighted": profile("Erector spinae", ["Glutes", "Hamstrings", "Adductors", "Core/abs"], "Weighted bodyweight", "Hip/back extension"),
  "seated calf raise": profile("Soleus", ["Gastrocnemius", ...stabilizers.calf], "Machine", "Calf raise"),
  "standing calf raise": profile("Gastrocnemius", ["Soleus", ...stabilizers.calf], "Machine", "Calf raise"),

  "seated military press barbell": profile("Anterior deltoids", ["Lateral deltoids", "Triceps brachii", "Upper traps", "Serratus anterior", "Rotator cuff", "Core/abs"], "Barbell", "Vertical press"),
  "behind the neck push press": profile("Deltoids", ["Triceps brachii", "Upper traps", "Serratus anterior", "Rotator cuff", "Quads", "Glutes", "Core/abs"], "Barbell", "Explosive vertical press"),
  "seated shoulder press dumbbell": profile("Anterior deltoids", ["Lateral deltoids", "Triceps brachii", "Upper traps", "Serratus anterior", "Rotator cuff", "Core/abs"], "Dumbbell", "Vertical press"),
  "shoulder press dumbbell": profile("Anterior deltoids", ["Lateral deltoids", "Triceps brachii", "Upper traps", "Serratus anterior", "Rotator cuff", "Core/abs"], "Dumbbell", "Vertical press"),
  "shoulder press machine": profile("Anterior deltoids", ["Lateral deltoids", "Triceps brachii", "Upper traps", "Serratus anterior", "Rotator cuff"], "Machine", "Vertical press"),
  "front raise": profile("Anterior deltoids", ["Upper pectoralis major", "Serratus anterior", "Upper traps", "Rotator cuff", "Core/abs"], "Dumbbell", "Shoulder flexion"),
  "lateral raise dumbbell": profile("Lateral deltoids", stabilizers.shoulderRaise, "Dumbbell", "Shoulder abduction"),
  "one arm lateral raise cable": profile("Lateral deltoids", stabilizers.shoulderRaise, "Cable", "Single-arm shoulder abduction", { isUnilateral: true }),
  "upright row barbell": profile("Lateral deltoids", ["Upper traps", "Anterior deltoids", "Biceps brachii", "Forearms", "Rotator cuff", "Core/abs"], "Barbell", "Upright row"),

  "bicep curl barbell": profile("Biceps brachii", stabilizers.curl, "Barbell", "Elbow flexion"),
  "bicep curl cable": profile("Biceps brachii", stabilizers.curl, "Cable", "Elbow flexion"),
  "alternating dumbbell curl": profile("Biceps brachii", stabilizers.curl, "Dumbbell", "Alternating elbow flexion", { isUnilateral: true }),
  "hammer curl": profile("Brachialis", ["Brachioradialis", "Biceps brachii", "Forearms", "Core/abs"], "Dumbbell", "Neutral-grip elbow flexion"),
  "hammer curl dumbbell": profile("Brachialis", ["Brachioradialis", "Biceps brachii", "Forearms", "Core/abs"], "Dumbbell", "Neutral-grip elbow flexion"),
  "concentration curl": profile("Biceps brachii", ["Brachialis", "Brachioradialis", "Forearms"], "Dumbbell", "Elbow flexion", { isUnilateral: true }),
  "incline curl dumbbell": profile("Biceps brachii", ["Brachialis", "Brachioradialis", "Forearms", "Anterior deltoids - shoulder stability"], "Dumbbell", "Incline elbow flexion"),
  "preacher curl barbell": profile("Biceps brachii", ["Brachialis", "Brachioradialis", "Forearms"], "Barbell", "Preacher elbow flexion"),
  "21s ez bar": profile("Biceps brachii", ["Brachialis", "Brachioradialis", "Forearms", "Anterior deltoids - shoulder stability"], "EZ Bar", "Elbow flexion"),

  "skull crusher": profile("Triceps brachii", stabilizers.triceps, "Barbell/EZ Bar", "Elbow extension"),
  "french press": profile("Triceps brachii", ["Long head triceps", "Anconeus", "Forearms", "Core/abs"], "EZ Bar/Dumbbell", "Overhead elbow extension"),
  "jm press": profile("Triceps brachii", ["Pectoralis major", "Anterior deltoids", "Forearms", "Core/abs"], "Barbell", "Hybrid close-grip press/elbow extension"),
  "overhead extension dumbbell": profile("Triceps brachii", ["Long head triceps", "Anconeus", "Forearms", "Core/abs"], "Dumbbell", "Overhead elbow extension"),
  "overhead tricep extension cable": profile("Triceps brachii", ["Long head triceps", "Anconeus", "Forearms", "Core/abs"], "Cable", "Overhead elbow extension"),
  "tricep rope push down cable": profile("Triceps brachii", ["Lateral head triceps", "Medial head triceps", "Anconeus", "Forearms", "Core/abs"], "Cable", "Cable pushdown"),
  "v handle tricep pushdown cable": profile("Triceps brachii", ["Lateral head triceps", "Medial head triceps", "Anconeus", "Forearms", "Core/abs"], "Cable", "Cable pushdown")
};

const targetRules: TargetRule[] = [
  { match: /bench|chest press/, profile: chestPressProfile("Unspecified press") },
  { match: /fly|crossover/, profile: profile("Pectoralis major", ["Anterior deltoids", "Serratus anterior", "Pectoralis minor", "Rotator cuff"], "Unspecified", "Chest fly") },
  { match: /row/, profile: profile("Latissimus dorsi", stabilizers.row, "Unspecified", "Horizontal pull/row") },
  { match: /pulldown|pull up/, profile: profile("Latissimus dorsi", stabilizers.verticalPull, "Unspecified", "Vertical pull") },
  { match: /squat|leg press|lunge/, profile: profile("Quads", stabilizers.lunge, "Unspecified", "Squat/lunge") },
  { match: /deadlift|extension/, profile: profile("Hamstrings", stabilizers.hinge, "Unspecified", "Hip hinge") },
  { match: /curl/, profile: profile("Biceps brachii", stabilizers.curl, "Unspecified", "Elbow flexion") },
  { match: /tricep|crusher|pressdown|pushdown/, profile: profile("Triceps brachii", stabilizers.triceps, "Unspecified", "Elbow extension") },
  { match: /raise|shoulder press|military press/, profile: profile("Deltoids", stabilizers.press, "Unspecified", "Shoulder movement") }
];

function equipmentFromName(normalized: string): string {
  if (normalized.includes("barbell")) return "Barbell";
  if (normalized.includes("dumbbell")) return "Dumbbell";
  if (normalized.includes("cable")) return "Cable";
  if (normalized.includes("machine")) return "Machine";
  if (normalized.includes("ez bar")) return "EZ Bar";
  if (normalized.includes("weighted")) return "Weighted bodyweight";
  return "Unspecified";
}

function unilateralFromName(normalized: string): boolean {
  return /\b(single|one arm|one leg|alternating|bulgarian|walking)\b/.test(normalized);
}

function normalizeExerciseName(value: string): string {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}

function mergeNotes(existing: string | undefined, targetNotes: string): string {
  if (!existing) return targetNotes;
  if (existing.includes("Muscle targets:")) return existing;
  return `${existing}\n\n${targetNotes}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
