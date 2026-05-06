import type { UnitPreference } from "../types";

export interface ImportHashInput {
  source: string;
  workoutDate: string;
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  notes?: string;
  unit?: UnitPreference | null;
}

export function stableImportHash(input: ImportHashInput): string {
  const payload = [
    input.source,
    input.workoutDate.slice(0, 10),
    input.exerciseName.trim().toLowerCase(),
    String(input.setNumber),
    String(round(input.weight)),
    String(input.reps),
    input.unit ?? "",
    (input.notes ?? "").trim().toLowerCase()
  ].join("|");
  return `imp_${fnv1a(payload)}`;
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
