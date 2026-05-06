import type { ImportAdapter, ImportUnitPreference, NormalizedWorkout, NormalizedWorkoutImport } from "./types";
import { aliases, asDate, asNumber, asString, detectUnit, pickValue, unknownFields } from "./common";
import { stableImportHash } from "./hash";
import { normalizedWorkoutImportSchema } from "./types";

export interface BoostcampCsvImporterOptions {
  unit?: ImportUnitPreference;
}

export class BoostcampCsvImporter implements ImportAdapter<BoostcampCsvImporterOptions> {
  source = "boostcamp";

  parse(input: string, options: BoostcampCsvImporterOptions = {}): NormalizedWorkoutImport {
    const rows = parseCsv(input);
    const workouts = new Map<string, NormalizedWorkout>();
    const unknown = new Set<string>();
    const skippedRows: NormalizedWorkoutImport["skippedRows"] = [];
    const warnings: string[] = [];

    rows.forEach((row, index) => {
      unknownFields(row).forEach((field) => unknown.add(field));
      const startedAt = asDate(pickValue(row, aliases.date));
      const exerciseName = asString(pickValue(row, aliases.exerciseName));
      const reps = asNumber(pickValue(row, aliases.reps));
      const weight = asNumber(pickValue(row, aliases.weight));
      if (!startedAt || !exerciseName || reps === null || weight === null) {
        skippedRows.push({ rowNumber: index + 2, reason: "Missing required date, exercise, weight, or reps.", raw: row });
        return;
      }

      const workoutName = asString(pickValue(row, aliases.workoutName)) || "Boostcamp Workout";
      const notes = asString(pickValue(row, aliases.notes));
      const setNumber = asNumber(pickValue(row, aliases.setNumber)) ?? inferSetNumber(workouts, startedAt, workoutName, exerciseName);
      const unit = detectUnit(pickValue(row, aliases.unit), options.unit ?? "auto");
      const key = `${startedAt}|${workoutName}`;
      const workout = workouts.get(key) ?? {
        name: workoutName,
        startedAt,
        finishedAt: null,
        bodyweight: asNumber(pickValue(row, aliases.bodyweight)),
        notes: "",
        importedMetadataJson: {},
        exercises: []
      };
      const exercise = workout.exercises.find((item) => item.exerciseName === exerciseName) ?? {
        exerciseName,
        importedMetadataJson: {},
        sets: []
      };

      exercise.sets.push({
        setNumber,
        weight,
        reps,
        rpe: asNumber(pickValue(row, aliases.rpe)),
        rir: asNumber(pickValue(row, aliases.rir)),
        notes,
        unit,
        importHash: stableImportHash({ source: this.source, workoutDate: startedAt, exerciseName, setNumber, weight, reps, notes, unit }),
        importedMetadataJson: preserveMetadata(row)
      });
      if (!workout.exercises.includes(exercise)) workout.exercises.push(exercise);
      workouts.set(key, workout);
    });

    if (rows.length === 0) warnings.push("No CSV rows were found.");
    const normalized = { source: "boostcamp" as const, format: "csv" as const, workouts: [...workouts.values()], unknownFields: [...unknown], skippedRows, warnings };
    return normalizedWorkoutImportSchema.parse(normalized) as NormalizedWorkoutImport;
  }
}

export function parseCsv(input: string): Array<Record<string, string>> {
  const lines = csvRows(input.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].map((header) => header.trim());
  return lines.slice(1).filter((row) => row.some(Boolean)).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
  );
}

function csvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    if (char === "\"" && quoted && next === "\"") {
      cell += "\"";
      i += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

function inferSetNumber(workouts: Map<string, NormalizedWorkout>, startedAt: string, workoutName: string, exerciseName: string): number {
  const workout = workouts.get(`${startedAt}|${workoutName}`);
  const exercise = workout?.exercises.find((item) => item.exerciseName === exerciseName);
  return (exercise?.sets.length ?? 0) + 1;
}

function preserveMetadata(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined && value !== ""));
}
