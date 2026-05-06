import type { UnitPreference } from "../types";

export const aliases = {
  exerciseName: ["exercise", "exerciseName", "movement", "exercise_name", "name"],
  workoutName: ["workout", "workoutName", "sessionName", "workout_name", "title"],
  date: ["date", "performedAt", "startedAt", "performed_at", "startTime"],
  weight: ["weight", "load", "lbs", "kg"],
  reps: ["reps", "repetitions", "rep"],
  rpe: ["rpe"],
  rir: ["rir"],
  notes: ["notes", "note", "comments"],
  setNumber: ["setNumber", "set_index", "set", "setIndex"],
  bodyweight: ["bodyweight", "bodyWeight", "body_weight", "bw"],
  unit: ["unit", "units", "weightUnit", "weight_unit"]
} as const;

export function pickValue(row: Record<string, unknown>, keys: readonly string[]): unknown {
  const normalized = new Map(Object.keys(row).map((key) => [normalizeKey(key), key]));
  for (const key of keys) {
    const actual = normalized.get(normalizeKey(key));
    if (actual) return row[actual];
  }
  return undefined;
}

export function unknownFields(row: Record<string, unknown>): string[] {
  const known = new Set(Object.values(aliases).flat().map(normalizeKey));
  return Object.keys(row).filter((key) => !known.has(normalizeKey(key)));
}

export function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const cleaned = String(value).replace(/[^0-9.+-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function asDate(value: unknown): string | null {
  const raw = asString(value);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function detectUnit(value: unknown, fallback: UnitPreference | "auto" = "auto"): UnitPreference | null {
  const raw = asString(value).toLowerCase();
  if (raw.includes("kg")) return "kg";
  if (raw.includes("lb")) return "lbs";
  if (fallback === "lbs" || fallback === "kg") return fallback;
  return null;
}

export function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}
