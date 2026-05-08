import { getAllFromStore, putInStore } from "./mobileDb";
import type { MobileDbStores } from "./mobileDb";
import {
  BoostcampJsonImporter,
  detectPersonalRecords,
  inferExerciseTargetProfile,
  type NormalizedWorkoutImport,
  type PersonalRecord,
  type PRType,
  type SetLog,
  type UnitPreference
} from "@ironlung/core";
import type {
  MobileExercise,
  MobileImportSummary,
  MobilePersonalRecord,
  MobileRecords,
  MobileSeedBundle,
  MobileSettings,
  MobileSetLog,
  MobileSyncMetadata,
  MobileWorkoutSession,
  MobileWorkoutSessionExercise
} from "./mobileSyncTypes";

type DesktopStateExport = {
  version: number;
  exportedAt: string;
  data: Partial<MobileRecords> & {
    unitPreference?: UnitPreference;
  };
};

const DESKTOP_DEVICE_ID = "desktop";
const BOOSTCAMP_DEVICE_ID = "boostcamp-import";

export function parseMobileImportFile(raw: string, settings: MobileSettings): MobileSeedBundle {
  const parsed = JSON.parse(raw) as unknown;
  if (isMobileSeedBundle(parsed)) return validateMobileSeedBundle(parsed);
  if (isDesktopStateExport(parsed)) return desktopStateToSeedBundle(parsed, settings);
  if (looksLikeBoostcampTrainingHistory(parsed)) return boostcampHistoryToSeedBundle(raw, settings);
  throw new Error("Unsupported file. Import an IronLung mobile seed, IronLung desktop JSON export, or raw Boostcamp training-history JSON.");
}

export function validateMobileSeedBundle(value: unknown): MobileSeedBundle {
  if (!value || typeof value !== "object") throw new Error("Invalid mobile seed file.");
  const bundle = value as MobileSeedBundle;
  if (bundle.schemaVersion !== 1 || bundle.bundleType !== "ironlung-mobile-seed") throw new Error("This is not an IronLung mobile seed bundle.");
  if (typeof bundle.exportedAt !== "string" || Number.isNaN(new Date(bundle.exportedAt).getTime())) throw new Error("Seed bundle exportedAt is invalid.");
  if (bundle.unitPreference !== "lbs" && bundle.unitPreference !== "kg") throw new Error("Seed bundle unit preference is invalid.");
  if (!bundle.records || !Array.isArray(bundle.records.exercises)) throw new Error("Seed bundle records are missing.");
  const optionalArrays = ["templates", "templateExercises", "trainingBlocks", "sessions", "sessionExercises", "setLogs", "personalRecords"] as const;
  for (const key of optionalArrays) {
    if (bundle.records[key] !== undefined && !Array.isArray(bundle.records[key])) throw new Error(`Seed bundle ${key} records are invalid.`);
  }
  return bundle;
}

export async function importMobileSeedBundle(bundle: MobileSeedBundle, settings: MobileSettings): Promise<MobileImportSummary> {
  validateMobileSeedBundle(bundle);
  const exerciseIdRemap = await buildDuplicateExerciseIdRemap(bundle.records.exercises);
  const summary: MobileImportSummary = {
    created: 0,
    updated: 0,
    exercisesCreated: 0,
    exercisesUpdated: 0,
    workoutsCreated: 0,
    workoutsUpdated: 0,
    setsCreated: 0,
    setsUpdated: 0,
    templatesImported: 0,
    blocksImported: 0,
    skipped: 0
  };

  await mergeRows("exercises", bundle.records.exercises, settings.deviceId, summary, {
    duplicateKey: (row) => normalizeName(row.name),
    onCreate: () => { summary.exercisesCreated += 1; },
    onUpdate: () => { summary.exercisesUpdated += 1; }
  });
  const templateExercises = (bundle.records.templateExercises ?? []).map((row) => ({ ...row, exerciseId: remapExerciseId(row.exerciseId, exerciseIdRemap) }));
  const sessionExercises = (bundle.records.sessionExercises ?? []).map((row) => ({ ...row, exerciseId: remapExerciseId(row.exerciseId, exerciseIdRemap) }));
  const personalRecords = (bundle.records.personalRecords ?? []).map((row) => ({ ...row, exerciseId: remapExerciseId(row.exerciseId, exerciseIdRemap) }));
  await mergeRows("templates", bundle.records.templates ?? [], settings.deviceId, summary, {
    onCreate: () => { summary.templatesImported += 1; },
    onUpdate: () => { summary.templatesImported += 1; }
  });
  await mergeRows("templateExercises", templateExercises, settings.deviceId, summary);
  await mergeRows("trainingBlocks", bundle.records.trainingBlocks ?? [], settings.deviceId, summary, {
    onCreate: () => { summary.blocksImported += 1; },
    onUpdate: () => { summary.blocksImported += 1; }
  });
  await mergeRows("sessions", bundle.records.sessions ?? [], settings.deviceId, summary, {
    onCreate: () => { summary.workoutsCreated += 1; },
    onUpdate: () => { summary.workoutsUpdated += 1; }
  });
  await mergeRows("sessionExercises", sessionExercises, settings.deviceId, summary);
  await mergeRows("setLogs", bundle.records.setLogs ?? [], settings.deviceId, summary, {
    onCreate: () => { summary.setsCreated += 1; },
    onUpdate: () => { summary.setsUpdated += 1; }
  });
  await mergeRows("personalRecords", personalRecords, settings.deviceId, summary);

  await putInStore("settings", {
    ...settings,
    unitPreference: bundle.unitPreference,
    updatedAt: new Date().toISOString(),
    lastImportedAt: bundle.exportedAt
  });
  return summary;
}

async function buildDuplicateExerciseIdRemap(incomingExercises: MobileExercise[]): Promise<Map<string, string>> {
  const existingExercises = await getAllFromStore("exercises");
  const existingById = new Map(existingExercises.filter((row) => !row.deletedAt).map((row) => [row.id, row]));
  const existingIdByName = new Map(existingExercises.filter((row) => !row.deletedAt).map((row) => [normalizeName(row.name), row.id]));
  const remap = new Map<string, string>();
  for (const incoming of incomingExercises) {
    if (!incoming.id || existingById.has(incoming.id)) continue;
    const existingId = existingIdByName.get(normalizeName(incoming.name));
    if (existingId) remap.set(incoming.id, existingId);
  }
  return remap;
}

function remapExerciseId(exerciseId: string, remap: Map<string, string>): string {
  return remap.get(exerciseId) ?? exerciseId;
}

async function mergeRows<K extends keyof MobileDbStores>(
  storeName: K,
  incomingRows: MobileDbStores[K][],
  deviceId: string,
  summary: MobileImportSummary,
  options: {
    duplicateKey?: (row: MobileDbStores[K]) => string;
    onCreate?: () => void;
    onUpdate?: () => void;
  } = {}
) {
  const existingRows = await getAllFromStore(storeName);
  const byId = new Map(existingRows.map((row) => [row.id, row]));
  const duplicateKeys = new Set(options.duplicateKey ? existingRows.map(options.duplicateKey).filter(Boolean) : []);

  for (const incoming of incomingRows) {
    if (!incoming.id || "deletedAt" in incoming && incoming.deletedAt) {
      summary.skipped += 1;
      continue;
    }
    const duplicateKey = options.duplicateKey?.(incoming);
    const existing = byId.get(incoming.id);

    if (!existing && duplicateKey && duplicateKeys.has(duplicateKey)) {
      summary.skipped += 1;
      continue;
    }

    if (!existing) {
      await putInStore(storeName, prepareIncoming(incoming, deviceId));
      summary.created += 1;
      options.onCreate?.();
      if (duplicateKey) duplicateKeys.add(duplicateKey);
      continue;
    }

    if (isIncomingNewer(incoming, existing)) {
      await putInStore(storeName, prepareIncoming({ ...existing, ...incoming }, deviceId));
      summary.updated += 1;
      options.onUpdate?.();
    } else {
      summary.skipped += 1;
    }
  }
}

function prepareIncoming<T>(record: T, deviceId: string): T {
  return {
    ...record,
    importSource: "desktop-seed",
    lastModifiedDeviceId: deviceId
  };
}

function isIncomingNewer(incoming: { updatedAt?: string; createdAt?: string }, existing: { updatedAt?: string; createdAt?: string }) {
  const incomingStamp = incoming.updatedAt ?? incoming.createdAt;
  const existingStamp = existing.updatedAt ?? existing.createdAt;
  if (!incomingStamp) return false;
  if (!existingStamp) return true;
  return new Date(incomingStamp).getTime() > new Date(existingStamp).getTime();
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isMobileSeedBundle(value: unknown): value is MobileSeedBundle {
  return Boolean(value && typeof value === "object" && (value as { bundleType?: unknown }).bundleType === "ironlung-mobile-seed");
}

function isDesktopStateExport(value: unknown): value is DesktopStateExport {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { version?: unknown; exportedAt?: unknown; data?: unknown };
  return candidate.version === 1
    && typeof candidate.exportedAt === "string"
    && Boolean(candidate.data && typeof candidate.data === "object")
    && Array.isArray((candidate.data as { exercises?: unknown }).exercises)
    && Array.isArray((candidate.data as { sessions?: unknown }).sessions)
    && Array.isArray((candidate.data as { setLogs?: unknown }).setLogs);
}

function looksLikeBoostcampTrainingHistory(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const root = value as Record<string, unknown>;
  const data = root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : root;
  return Object.entries(data).some(([key, row]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && Array.isArray(row));
}

function desktopStateToSeedBundle(exportFile: DesktopStateExport, settings: MobileSettings): MobileSeedBundle {
  const exportedAt = normalizeExportedAt(exportFile.exportedAt);
  const data = exportFile.data;
  return validateMobileSeedBundle({
    schemaVersion: 1,
    bundleType: "ironlung-mobile-seed",
    exportedAt,
    appVersion: "0.1.0",
    unitPreference: data.unitPreference === "kg" ? "kg" : settings.unitPreference,
    records: {
      exercises: withSyncRows(data.exercises ?? [], DESKTOP_DEVICE_ID, "desktop-export", exportedAt),
      templates: withSyncRows(data.templates ?? [], DESKTOP_DEVICE_ID, "desktop-export", exportedAt),
      templateExercises: withSyncRows(data.templateExercises ?? [], DESKTOP_DEVICE_ID, "desktop-export", exportedAt),
      trainingBlocks: withSyncRows(data.trainingBlocks ?? [], DESKTOP_DEVICE_ID, "desktop-export", exportedAt),
      sessions: withSyncRows(data.sessions ?? [], DESKTOP_DEVICE_ID, "desktop-export", exportedAt),
      sessionExercises: withSyncRows(data.sessionExercises ?? [], DESKTOP_DEVICE_ID, "desktop-export", exportedAt),
      setLogs: withSyncRows(data.setLogs ?? [], DESKTOP_DEVICE_ID, "desktop-export", exportedAt),
      personalRecords: withSyncRows(data.personalRecords ?? [], DESKTOP_DEVICE_ID, "desktop-export", exportedAt)
    },
    summary: {
      exercises: data.exercises?.length ?? 0,
      templates: data.templates?.length ?? 0,
      trainingBlocks: data.trainingBlocks?.length ?? 0,
      workouts: data.sessions?.length ?? 0,
      sets: data.setLogs?.length ?? 0
    }
  });
}

function boostcampHistoryToSeedBundle(raw: string, settings: MobileSettings): MobileSeedBundle {
  const normalized = new BoostcampJsonImporter().parse(raw, { unit: settings.unitPreference });
  const exportedAt = new Date().toISOString();
  const records = normalizedToMobileRecords(normalized, settings.unitPreference, exportedAt);
  return validateMobileSeedBundle({
    schemaVersion: 1,
    bundleType: "ironlung-mobile-seed",
    exportedAt,
    appVersion: "0.1.0",
    unitPreference: settings.unitPreference,
    records,
    summary: {
      exercises: records.exercises.length,
      templates: 0,
      trainingBlocks: 0,
      workouts: records.sessions?.length ?? 0,
      sets: records.setLogs?.length ?? 0
    }
  });
}

function normalizedToMobileRecords(normalized: NormalizedWorkoutImport, unit: UnitPreference, exportedAt: string): MobileSeedBundle["records"] {
  const sync = syncMetadata(BOOSTCAMP_DEVICE_ID, "boostcamp-training-history");
  const exerciseMap = new Map<string, MobileExercise>();
  const sessions: MobileWorkoutSession[] = [];
  const sessionExercises: MobileWorkoutSessionExercise[] = [];
  const setLogs: MobileSetLog[] = [];

  for (const workout of normalized.workouts) {
    const sessionId = stableId("boostcamp-session", workout.sourceWorkoutId ?? `${workout.startedAt}|${workout.name}`);
    sessions.push({
      id: sessionId,
      workoutTemplateId: null,
      name: workout.name,
      startedAt: workout.startedAt,
      finishedAt: workout.finishedAt ?? workout.startedAt,
      notes: workout.notes,
      bodyweight: workout.bodyweight,
      createdAt: workout.startedAt,
      updatedAt: workout.finishedAt ?? workout.startedAt,
      ...sync
    });

    workout.exercises.forEach((workoutExercise, exerciseIndex) => {
      const exerciseKey = normalizeName(workoutExercise.exerciseName);
      let exercise = exerciseMap.get(exerciseKey);
      if (!exercise) {
        const profile = inferExerciseTargetProfile(workoutExercise.exerciseName);
        exercise = {
          id: stableId("boostcamp-exercise", exerciseKey),
          name: workoutExercise.exerciseName,
          primaryMuscle: profile.primaryMuscle,
          secondaryMuscles: profile.secondaryMuscles,
          equipment: profile.equipment,
          movementPattern: profile.movementPattern,
          isUnilateral: profile.isUnilateral,
          notes: profile.notes,
          createdAt: exportedAt,
          updatedAt: exportedAt,
          ...sync
        };
        exerciseMap.set(exerciseKey, exercise);
      }

      const rowId = stableId("boostcamp-session-exercise", `${sessionId}|${exercise.id}|${exerciseIndex}`);
      sessionExercises.push({
        id: rowId,
        workoutSessionId: sessionId,
        exerciseId: exercise.id,
        orderIndex: exerciseIndex,
        notes: workoutExercise.notes,
        createdAt: workout.startedAt,
        updatedAt: workout.finishedAt ?? workout.startedAt,
        ...sync
      });

      workoutExercise.sets.forEach((set) => {
        setLogs.push({
          id: stableId("boostcamp-set", set.importHash),
          workoutSessionExerciseId: rowId,
          setNumber: set.setNumber,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe,
          setType: "working",
          isCompleted: true,
          notes: set.notes,
          importSource: "boostcamp",
          importHash: set.importHash,
          importedMetadataJson: set.importedMetadataJson,
          createdAt: workout.startedAt,
          updatedAt: workout.finishedAt ?? workout.startedAt,
          ...sync
        });
      });
    });
  }

  const records = {
    exercises: [...exerciseMap.values()],
    templates: [],
    templateExercises: [],
    trainingBlocks: [],
    sessions,
    sessionExercises,
    setLogs,
    personalRecords: [] as MobilePersonalRecord[]
  };
  records.personalRecords = detectRecords(records, unit, sync);
  return records;
}

function detectRecords(records: Pick<MobileRecords, "sessions" | "sessionExercises" | "setLogs"> & { personalRecords: MobilePersonalRecord[] }, unit: UnitPreference, sync: MobileSyncMetadata): MobilePersonalRecord[] {
  const sessionById = new Map(records.sessions.map((session) => [session.id, session]));
  const rowById = new Map(records.sessionExercises.map((row) => [row.id, row]));
  const previousSetsByExercise = new Map<string, MobileSetLog[]>();
  const sessionVolumesByExercise = new Map<string, number[]>();
  const currentSessionSets = new Map<string, MobileSetLog[]>();
  const personalRecords: MobilePersonalRecord[] = [];
  const orderedSets = [...records.setLogs].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.setNumber - b.setNumber);

  for (const set of orderedSets) {
    const row = rowById.get(set.workoutSessionExerciseId);
    const session = row ? sessionById.get(row.workoutSessionId) : undefined;
    if (!row || !session) continue;
    const exerciseId = row.exerciseId;
    const sessionKey = `${session.id}|${exerciseId}`;
    const nextSessionSets = [...(currentSessionSets.get(sessionKey) ?? []), set];
    currentSessionSets.set(sessionKey, nextSessionSets);
    const detected = detectPersonalRecords({
      exerciseId,
      workoutSessionId: session.id,
      achievedAt: set.createdAt,
      unit,
      newSet: set as SetLog,
      sessionSetsForExercise: nextSessionSets as SetLog[],
      historicalSetsForExercise: previousSetsByExercise.get(exerciseId) ?? [],
      historicalSessionVolumesForExercise: sessionVolumesByExercise.get(exerciseId) ?? []
    });
    for (const record of detected) personalRecords.push(withPrSync(record, set, sync));
    previousSetsByExercise.set(exerciseId, [...(previousSetsByExercise.get(exerciseId) ?? []), set]);
  }

  for (const [sessionKey, sets] of currentSessionSets) {
    const exerciseId = sessionKey.split("|")[1] ?? "";
    const volume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
    sessionVolumesByExercise.set(exerciseId, [...(sessionVolumesByExercise.get(exerciseId) ?? []), volume]);
  }
  return personalRecords;
}

function withPrSync(record: PersonalRecord, set: MobileSetLog, sync: MobileSyncMetadata): MobilePersonalRecord {
  return {
    ...record,
    id: stableId("boostcamp-pr", `${set.id}|${record.type}`),
    updatedAt: record.achievedAt,
    ...sync
  };
}

function withSyncRows<T extends { id: string; createdAt?: string; updatedAt?: string }>(rows: T[], deviceId: string, importSource: string, fallbackUpdatedAt: string): Array<T & MobileSyncMetadata & { updatedAt: string }> {
  const sync = syncMetadata(deviceId, importSource);
  return rows.map((row) => ({
    ...row,
    deletedAt: null,
    updatedAt: row.updatedAt ?? row.createdAt ?? fallbackUpdatedAt,
    ...sync
  }));
}

function syncMetadata(deviceId: string, importSource: string): MobileSyncMetadata {
  return {
    deletedAt: null,
    originDeviceId: deviceId,
    lastModifiedDeviceId: deviceId,
    syncVersion: 1,
    importSource,
    mobileBatchId: null
  };
}

function normalizeExportedAt(value: string): string {
  return Number.isNaN(new Date(value).getTime()) ? new Date().toISOString() : value;
}

function stableId(prefix: string, value: string): string {
  let hash = 0x811c9dc5;
  const input = value.toLowerCase();
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${prefix}-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

type _TypeChecks = PRType;
