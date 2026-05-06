import type { ImportAdapter, ImportUnitPreference, NormalizedWorkout, NormalizedWorkoutImport } from "./types";
import { aliases, asDate, asNumber, asString, detectUnit, pickValue, unknownFields } from "./common";
import { stableImportHash } from "./hash";
import { normalizedWorkoutImportSchema } from "./types";

export interface BoostcampJsonImporterOptions {
  unit?: ImportUnitPreference;
}

export class BoostcampJsonImporter implements ImportAdapter<BoostcampJsonImporterOptions> {
  source = "boostcamp";

  parse(input: string, options: BoostcampJsonImporterOptions = {}): NormalizedWorkoutImport {
    const parsed = parseJsonLike(input);
    const native = parseNativeBoostcampHistory(parsed, options);
    if (native) return normalizedWorkoutImportSchema.parse(native) as NormalizedWorkoutImport;
    const rows = extractCandidateRows(parsed);
    const workouts = new Map<string, NormalizedWorkout>();
    const unknown = new Set<string>();
    const skippedRows: NormalizedWorkoutImport["skippedRows"] = [];
    const warnings: string[] = [];

    rows.forEach((row, index) => {
      unknownFields(row).forEach((field) => unknown.add(field));
      const context = row.__context && typeof row.__context === "object" ? row.__context as Record<string, unknown> : {};
      const startedAt = asDate(pickValue(row, aliases.date) ?? pickValue(context, aliases.date));
      const exerciseName = asString(pickValue(row, aliases.exerciseName) ?? pickValue(context, aliases.exerciseName));
      const reps = asNumber(pickValue(row, aliases.reps));
      const weight = asNumber(pickValue(row, aliases.weight));
      if (!startedAt || !exerciseName || reps === null || weight === null) {
        skippedRows.push({ rowNumber: index + 1, reason: "Missing required date, exercise, weight, or reps.", raw: row });
        return;
      }

      const workoutName = asString(pickValue(row, aliases.workoutName) ?? pickValue(context, aliases.workoutName)) || "Boostcamp Workout";
      const notes = asString(pickValue(row, aliases.notes) ?? pickValue(context, aliases.notes));
      const key = `${startedAt}|${workoutName}`;
      const workout = workouts.get(key) ?? {
        sourceWorkoutId: asString(row.id ?? context.id) || undefined,
        name: workoutName,
        startedAt,
        finishedAt: null,
        bodyweight: asNumber(pickValue(row, aliases.bodyweight) ?? pickValue(context, aliases.bodyweight)),
        notes: asString(pickValue(context, aliases.notes)),
        importedMetadataJson: context,
        exercises: []
      };
      const exercise = workout.exercises.find((item) => item.exerciseName === exerciseName) ?? {
        exerciseName,
        importedMetadataJson: context,
        sets: []
      };
      const setNumber = asNumber(pickValue(row, aliases.setNumber)) ?? exercise.sets.length + 1;
      const unit = detectUnit(pickValue(row, aliases.unit), options.unit ?? "auto");
      exercise.sets.push({
        setNumber,
        weight,
        reps,
        rpe: asNumber(pickValue(row, aliases.rpe)),
        rir: asNumber(pickValue(row, aliases.rir)),
        notes,
        unit,
        importHash: stableImportHash({ source: this.source, workoutDate: startedAt, exerciseName, setNumber, weight, reps, notes, unit }),
        importedMetadataJson: row
      });
      if (!workout.exercises.includes(exercise)) workout.exercises.push(exercise);
      workouts.set(key, workout);
    });

    if (rows.length === 0) warnings.push("No workout set-like JSON objects were found.");
    const normalized = { source: "boostcamp" as const, format: "json" as const, workouts: [...workouts.values()], unknownFields: [...unknown], skippedRows, warnings };
    return normalizedWorkoutImportSchema.parse(normalized) as NormalizedWorkoutImport;
  }
}

function parseNativeBoostcampHistory(input: unknown, options: BoostcampJsonImporterOptions): NormalizedWorkoutImport | null {
  if (!input || typeof input !== "object") return null;
  const root = input as Record<string, unknown>;
  const data = root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : root;
  const dateEntries = Object.entries(data).filter(([key, value]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && Array.isArray(value));
  if (dateEntries.length === 0) return null;

  const workouts: NormalizedWorkout[] = [];
  const skippedRows: NormalizedWorkoutImport["skippedRows"] = [];
  const warnings: string[] = [];
  const unknown = new Set<string>();

  for (const [date, items] of dateEntries) {
    (items as unknown[]).forEach((item, workoutIndex) => {
      if (!item || typeof item !== "object") return;
      const workoutRaw = item as Record<string, unknown>;
      const startedAt = asDate(workoutRaw.finished_at) ?? new Date(`${date}T12:00:00.000Z`).toISOString();
      const workoutName = asString(workoutRaw.title) || asString(workoutRaw.name) || asString(workoutRaw.workout) || "Boostcamp Workout";
      const workout: NormalizedWorkout = {
        sourceWorkoutId: asString(workoutRaw.id) || undefined,
        name: workoutName,
        startedAt,
        finishedAt: startedAt,
        notes: asString(workoutRaw.notes),
        bodyweight: asNumber(workoutRaw.bodyweight ?? workoutRaw.bodyWeight),
        importedMetadataJson: workoutRaw,
        exercises: []
      };

      const records = Array.isArray(workoutRaw.records) ? workoutRaw.records : [];
      records.forEach((recordRaw, recordIndex) => {
        if (!recordRaw || typeof recordRaw !== "object") return;
        const record = recordRaw as Record<string, unknown>;
        Object.keys(record).forEach((key) => {
          if (!["id", "name", "sets", "type", "uniq", "video", "custom", "source", "muscles", "target_type", "alternatives", "muscles_list", "notes"].includes(key)) {
            unknown.add(key);
          }
        });
        const exerciseName = asString(record.name);
        if (!exerciseName) {
          skippedRows.push({ rowNumber: recordIndex + 1, reason: "Missing exercise name in Boostcamp record.", raw: record });
          return;
        }
        const exercise = {
          exerciseName,
          notes: asString(record.notes),
          importedMetadataJson: record,
          sets: [] as NormalizedWorkout["exercises"][number]["sets"]
        };
        let lastWeight: number | null = null;
        const sets = Array.isArray(record.sets) ? record.sets : [];
        sets.forEach((setRaw, setIndex) => {
          if (!setRaw || typeof setRaw !== "object") return;
          const set = setRaw as Record<string, unknown>;
          if (set.skipped === true) {
            skippedRows.push({ rowNumber: setIndex + 1, reason: "Boostcamp set marked skipped.", raw: set });
            return;
          }
          const reps = asNumber(set.amount ?? set.reps ?? set.repetitions ?? set.target);
          const rawWeight = asNumber(set.value ?? set.weight ?? set.load);
          const weight = rawWeight ?? lastWeight ?? 0;
          if (rawWeight !== null) lastWeight = rawWeight;
          if (reps === null) {
            skippedRows.push({ rowNumber: setIndex + 1, reason: "Missing reps in Boostcamp set.", raw: set });
            return;
          }
          const setNumber = asNumber(set.setNumber ?? set.set_index ?? setIndex + 1) ?? setIndex + 1;
          const unit = detectUnit(set.weight_unit ?? set.unit, options.unit ?? "auto");
          const notes = asString(set.notes);
          exercise.sets.push({
            setNumber,
            weight,
            reps,
            rpe: normalizeRpe(asNumber(set.rpe ?? set.intensity)),
            rir: asNumber(set.rir),
            notes,
            unit,
            importHash: stableImportHash({ source: "boostcamp", workoutDate: startedAt, exerciseName, setNumber, weight, reps, notes, unit }),
            importedMetadataJson: set
          });
        });
        if (exercise.sets.length) workout.exercises.push(exercise);
      });

      if (workout.exercises.length) workouts.push(workout);
      else skippedRows.push({ rowNumber: workoutIndex + 1, reason: "Workout contained no importable sets.", raw: workoutRaw });
    });
  }

  warnings.push("Parsed native Boostcamp training-history export. Blank set weights were filled from the previous non-blank weight for the same exercise; remaining blanks were imported as bodyweight/0 load.");
  return { source: "boostcamp", format: "json", workouts, unknownFields: [...unknown], skippedRows, warnings };
}

function normalizeRpe(value: number | null): number | null {
  if (value === null) return null;
  return value >= 1 && value <= 10 ? value : null;
}

export function parseJsonLike(input: string): unknown {
  try {
    return JSON.parse(input) as unknown;
  } catch {
    const normalized = input
      .trim()
      .replace(/\bNone\b/g, "null")
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_match, value: string) => JSON.stringify(value.replace(/\\'/g, "'")));
    return JSON.parse(normalized) as unknown;
  }
}

function extractCandidateRows(input: unknown): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = [];

  function visit(value: unknown, context: Record<string, unknown> = {}) {
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, context));
      return;
    }
    if (!value || typeof value !== "object") return;
    const object = value as Record<string, unknown>;
    const nextContext = { ...context, ...pickContext(object) };
    if (hasSetShape(object)) {
      rows.push({ ...object, __context: nextContext });
    }
    for (const [key, child] of Object.entries(object)) {
      if (key === "__context") continue;
      if (Array.isArray(child) || (child && typeof child === "object")) visit(child, nextContext);
    }
  }

  visit(input);
  return rows;
}

function hasSetShape(object: Record<string, unknown>): boolean {
  return pickValue(object, aliases.reps) !== undefined && pickValue(object, aliases.weight) !== undefined;
}

function pickContext(object: Record<string, unknown>): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  for (const key of [...aliases.date, ...aliases.workoutName, ...aliases.exerciseName, ...aliases.bodyweight, ...aliases.notes, "id"]) {
    const value = object[key];
    if (value !== undefined && typeof value !== "object") context[key] = value;
  }
  return context;
}
