import { z } from "zod";
import type { Exercise, UnitPreference } from "../types";

export type ImportFileType = "csv" | "json";
export type ImportUnitPreference = UnitPreference | "auto";

export interface ImportAdapter<TOptions = unknown> {
  source: string;
  parse(input: string, options?: TOptions): NormalizedWorkoutImport;
}

export interface NormalizedWorkoutImport {
  source: "boostcamp";
  format: ImportFileType;
  workouts: NormalizedWorkout[];
  unknownFields: string[];
  skippedRows: ImportSkippedRow[];
  warnings: string[];
}

export interface NormalizedWorkout {
  sourceWorkoutId?: string;
  name: string;
  startedAt: string;
  finishedAt?: string | null;
  notes?: string;
  bodyweight?: number | null;
  importedMetadataJson: Record<string, unknown>;
  exercises: NormalizedWorkoutExercise[];
}

export interface NormalizedWorkoutExercise {
  exerciseName: string;
  notes?: string;
  importedMetadataJson: Record<string, unknown>;
  sets: NormalizedSetImport[];
}

export interface NormalizedSetImport {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number | null;
  rir?: number | null;
  notes?: string;
  unit?: UnitPreference | null;
  importHash: string;
  importedMetadataJson: Record<string, unknown>;
}

export interface ImportSkippedRow {
  rowNumber?: number;
  reason: string;
  raw: unknown;
}

export interface ImportPreview {
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
  dateRange: { start: string | null; end: string | null };
  unknownFields: string[];
  possibleDuplicateExercises: Array<{ importedName: string; existingName: string; score: number }>;
  duplicateSetHashes: string[];
  skippedRows: ImportSkippedRow[];
  warnings: string[];
}

export interface ExerciseMapping {
  importedName: string;
  action: "map" | "create" | "skip";
  exerciseId?: string;
  exerciseName: string;
}

export interface ImportCommitSummary {
  workoutsImported: number;
  exercisesCreated: number;
  setsImported: number;
  prsDetected: number;
  skippedRows: number;
  warnings: string[];
  errors: string[];
}

export const normalizedSetImportSchema = z.object({
  setNumber: z.number().int().positive(),
  weight: z.number().min(0),
  reps: z.number().int().min(0),
  rpe: z.number().min(1).max(10).nullable().optional(),
  rir: z.number().min(0).max(10).nullable().optional(),
  notes: z.string().optional(),
  unit: z.enum(["lbs", "kg"]).nullable().optional(),
  importHash: z.string().min(1),
  importedMetadataJson: z.record(z.unknown())
});

export const normalizedWorkoutExerciseSchema = z.object({
  exerciseName: z.string().min(1),
  notes: z.string().optional(),
  importedMetadataJson: z.record(z.unknown()),
  sets: z.array(normalizedSetImportSchema)
});

export const normalizedWorkoutSchema = z.object({
  sourceWorkoutId: z.string().optional(),
  name: z.string().min(1),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable().optional(),
  notes: z.string().optional(),
  bodyweight: z.number().nullable().optional(),
  importedMetadataJson: z.record(z.unknown()),
  exercises: z.array(normalizedWorkoutExerciseSchema)
});

export const normalizedWorkoutImportSchema = z.object({
  source: z.literal("boostcamp"),
  format: z.enum(["csv", "json"]),
  workouts: z.array(normalizedWorkoutSchema),
  unknownFields: z.array(z.string()),
  skippedRows: z.array(z.object({ rowNumber: z.number().optional(), reason: z.string(), raw: z.unknown() })),
  warnings: z.array(z.string())
});

export function buildImportPreview(
  normalized: NormalizedWorkoutImport,
  existingExercises: Exercise[] = [],
  existingHashes: string[] = []
): ImportPreview {
  const exerciseNames = new Set<string>();
  const hashes = new Set(existingHashes);
  const duplicateSetHashes: string[] = [];
  let totalSets = 0;
  const dates: string[] = [];

  for (const workout of normalized.workouts) {
    dates.push(workout.startedAt);
    for (const exercise of workout.exercises) {
      exerciseNames.add(exercise.exerciseName);
      for (const set of exercise.sets) {
        totalSets += 1;
        if (hashes.has(set.importHash)) duplicateSetHashes.push(set.importHash);
        hashes.add(set.importHash);
      }
    }
  }

  return {
    totalWorkouts: normalized.workouts.length,
    totalExercises: exerciseNames.size,
    totalSets,
    dateRange: {
      start: dates.length ? dates.sort()[0] : null,
      end: dates.length ? dates.sort()[dates.length - 1] : null
    },
    unknownFields: normalized.unknownFields,
    possibleDuplicateExercises: suggestExerciseMatches([...exerciseNames], existingExercises).filter((item) => item.score >= 0.72),
    duplicateSetHashes: [...new Set(duplicateSetHashes)],
    skippedRows: normalized.skippedRows,
    warnings: normalized.warnings
  };
}

export function suggestExerciseMatches(
  importedNames: string[],
  existingExercises: Exercise[]
): Array<{ importedName: string; existingName: string; existingId: string; score: number }> {
  return importedNames.flatMap((importedName) => {
    const best = existingExercises
      .map((exercise) => ({
        importedName,
        existingName: exercise.name,
        existingId: exercise.id,
        score: similarity(normalizeName(importedName), normalizeName(exercise.name))
      }))
      .sort((a, b) => b.score - a.score)[0];
    return best ? [best] : [];
  });
}

export function createDefaultExerciseMappings(importedNames: string[], existingExercises: Exercise[]): ExerciseMapping[] {
  const suggestions = new Map(suggestExerciseMatches(importedNames, existingExercises).map((item) => [item.importedName, item]));
  return importedNames.sort().map((importedName) => {
    const suggestion = suggestions.get(importedName);
    if (suggestion && suggestion.score >= 0.78) {
      return { importedName, action: "map", exerciseId: suggestion.existingId, exerciseName: suggestion.existingName };
    }
    return { importedName, action: "create", exerciseName: importedName };
  });
}

export function convertWeight(weight: number, from: UnitPreference, to: UnitPreference): number {
  if (from === to) return round(weight);
  return round(from === "kg" ? weight * 2.2046226218 : weight / 2.2046226218);
}

export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const aTokens = new Set(a.split(" "));
  const bTokens = new Set(b.split(" "));
  const overlap = [...aTokens].filter((token) => bTokens.has(token)).length;
  const tokenScore = (overlap * 2) / Math.max(aTokens.size + bTokens.size, 1);
  const distance = levenshtein(a, b);
  const editScore = 1 - distance / Math.max(a.length, b.length, 1);
  return round(Math.max(tokenScore, editScore));
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, (_, y) => [y]);
  for (let x = 0; x <= a.length; x += 1) matrix[0][x] = x;
  for (let y = 1; y <= b.length; y += 1) {
    for (let x = 1; x <= a.length; x += 1) {
      matrix[y][x] = b[y - 1] === a[x - 1]
        ? matrix[y - 1][x - 1]
        : Math.min(matrix[y - 1][x - 1] + 1, matrix[y][x - 1] + 1, matrix[y - 1][x] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
