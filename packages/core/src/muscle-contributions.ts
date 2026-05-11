import type { Exercise, MuscleContribution } from "./types";

const presets: Array<{ match: RegExp; contributions: MuscleContribution[] }> = [
  {
    match: /incline.*bench|incline.*press/,
    contributions: [
      { muscle: "Upper pectoralis major", percent: 0.5, role: "primary" },
      { muscle: "Anterior deltoids", percent: 0.25, role: "secondary" },
      { muscle: "Triceps brachii", percent: 0.2, role: "secondary" },
      { muscle: "Serratus anterior", percent: 0.05, role: "stabilizer" }
    ]
  },
  {
    match: /bench|chest press/,
    contributions: [
      { muscle: "Pectoralis major", percent: 0.55, role: "primary" },
      { muscle: "Anterior deltoids", percent: 0.2, role: "secondary" },
      { muscle: "Triceps brachii", percent: 0.2, role: "secondary" },
      { muscle: "Serratus anterior", percent: 0.05, role: "stabilizer" }
    ]
  },
  {
    match: /row/,
    contributions: [
      { muscle: "Latissimus dorsi", percent: 0.35, role: "primary" },
      { muscle: "Rhomboids", percent: 0.25, role: "secondary" },
      { muscle: "Traps", percent: 0.15, role: "secondary" },
      { muscle: "Rear delts", percent: 0.15, role: "secondary" },
      { muscle: "Biceps brachii", percent: 0.1, role: "stabilizer" }
    ]
  },
  {
    match: /pulldown|pull up|chin up/,
    contributions: [
      { muscle: "Latissimus dorsi", percent: 0.5, role: "primary" },
      { muscle: "Teres major", percent: 0.15, role: "secondary" },
      { muscle: "Biceps brachii", percent: 0.15, role: "secondary" },
      { muscle: "Rhomboids", percent: 0.1, role: "stabilizer" },
      { muscle: "Forearms", percent: 0.1, role: "stabilizer" }
    ]
  },
  {
    match: /squat|leg press|hack squat/,
    contributions: [
      { muscle: "Quads", percent: 0.55, role: "primary" },
      { muscle: "Glutes", percent: 0.25, role: "secondary" },
      { muscle: "Adductors", percent: 0.1, role: "secondary" },
      { muscle: "Hamstrings", percent: 0.1, role: "stabilizer" }
    ]
  },
  {
    match: /deadlift|romanian|rdl|hip hinge/,
    contributions: [
      { muscle: "Hamstrings", percent: 0.35, role: "primary" },
      { muscle: "Glutes", percent: 0.3, role: "secondary" },
      { muscle: "Erector spinae", percent: 0.2, role: "secondary" },
      { muscle: "Lats", percent: 0.1, role: "stabilizer" },
      { muscle: "Forearms", percent: 0.05, role: "stabilizer" }
    ]
  },
  {
    match: /shoulder press|military press|overhead press/,
    contributions: [
      { muscle: "Anterior deltoids", percent: 0.45, role: "primary" },
      { muscle: "Lateral deltoids", percent: 0.2, role: "secondary" },
      { muscle: "Triceps brachii", percent: 0.25, role: "secondary" },
      { muscle: "Upper traps", percent: 0.1, role: "stabilizer" }
    ]
  },
  {
    match: /lateral raise/,
    contributions: [
      { muscle: "Lateral deltoids", percent: 0.75, role: "primary" },
      { muscle: "Supraspinatus", percent: 0.15, role: "secondary" },
      { muscle: "Upper traps", percent: 0.1, role: "stabilizer" }
    ]
  },
  {
    match: /curl/,
    contributions: [
      { muscle: "Biceps brachii", percent: 0.65, role: "primary" },
      { muscle: "Brachialis", percent: 0.2, role: "secondary" },
      { muscle: "Forearms", percent: 0.15, role: "stabilizer" }
    ]
  },
  {
    match: /tricep|pushdown|pressdown|skull crusher|french press/,
    contributions: [
      { muscle: "Triceps brachii", percent: 0.8, role: "primary" },
      { muscle: "Forearms", percent: 0.1, role: "stabilizer" },
      { muscle: "Anterior deltoids", percent: 0.1, role: "stabilizer" }
    ]
  }
];

export function resolveMuscleContributions(exercise: Exercise): MuscleContribution[] {
  const customContributions = safeMuscleContributions(exercise.muscleContributions);
  if (customContributions.length) return normalizeContributions(customContributions);
  const name = normalizeExerciseName(exercise.name);
  const preset = presets.find((item) => item.match.test(name));
  if (preset) return normalizeContributions(preset.contributions);
  return fallbackContributions(exercise);
}

export function distributedMuscleVolume(exercise: Exercise, volume: number) {
  return resolveMuscleContributions(exercise).map((contribution) => ({
    ...contribution,
    volume: round(volume * contribution.percent)
  }));
}

export function muscleContributionWarnings(exercise: Exercise): string[] {
  const warnings: string[] = [];
  const raw = safeMuscleContributions(exercise.muscleContributions);
  const rawTotal = raw.reduce((sum, item) => sum + item.percent, 0);
  if (raw.length && Math.abs(rawTotal - 1) > 0.02) {
    warnings.push(`Custom muscle contributions total ${round(rawTotal * 100)}%, so IronLog normalizes them to 100%.`);
  }
  if (raw.some((item) => item.percent <= 0)) {
    warnings.push("One or more custom muscle contributions are zero or negative and are ignored.");
  }
  if (!raw.length && !presets.some((item) => item.match.test(normalizeExerciseName(exercise.name)))) {
    warnings.push("Using fallback muscle distribution because this exercise has no custom contribution model.");
  }
  return warnings;
}

function fallbackContributions(exercise: Exercise): MuscleContribution[] {
  const secondary = safeStringArray(exercise.secondaryMuscles).map(cleanMuscleLabel).filter(Boolean);
  const primary = safeText(exercise.primaryMuscle, "Full body");
  if (!secondary.length) {
    return [{ muscle: primary, percent: 1, role: "primary" }];
  }
  const secondaryShare = 0.35 / secondary.length;
  return normalizeContributions([
    { muscle: primary, percent: 0.65, role: "primary" },
    ...secondary.map((muscle) => ({ muscle, percent: secondaryShare, role: "secondary" as const }))
  ]);
}

function normalizeContributions(contributions: MuscleContribution[]): MuscleContribution[] {
  const combined = new Map<string, MuscleContribution>();
  for (const contribution of contributions) {
    const muscle = cleanMuscleLabel(contribution.muscle);
    if (!muscle || contribution.percent <= 0) continue;
    const current = combined.get(muscle);
    combined.set(muscle, {
      muscle,
      percent: (current?.percent ?? 0) + contribution.percent,
      role: current?.role ?? contribution.role
    });
  }
  const total = [...combined.values()].reduce((sum, item) => sum + item.percent, 0);
  if (total <= 0) return [{ muscle: "Full body", percent: 1, role: "primary" }];
  return [...combined.values()].map((item) => ({ ...item, percent: round(item.percent / total) }));
}

function cleanMuscleLabel(value: string) {
  return value.split(" - ")[0].trim();
}

function normalizeExerciseName(value: unknown) {
  return typeof value === "string" ? value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim() : "";
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function safeMuscleContributions(value: unknown): MuscleContribution[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is MuscleContribution =>
    Boolean(item) &&
    typeof item === "object" &&
    typeof (item as MuscleContribution).muscle === "string" &&
    typeof (item as MuscleContribution).percent === "number"
  );
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}
