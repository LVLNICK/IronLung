import { detectPersonalRecords, type SetType } from "@ironlung/core";
import { clearStore, getAllFromStore, putInStore } from "./mobileDb";
import { nowIso, type MobileOperationLogEntry, type MobilePersonalRecord, type MobileRecords, type MobileSetLog, type MobileSettings, type MobileWorkoutSession, type MobileWorkoutSessionExercise } from "./mobileSyncTypes";
import { createId } from "../lib/uuid";

export interface MobileSnapshot extends MobileRecords {
  settings: MobileSettings;
  operationLog: MobileOperationLogEntry[];
}

export async function loadMobileSnapshot(): Promise<MobileSnapshot> {
  const [settingsRows, exercises, sessions, sessionExercises, setLogs, personalRecords, trainingBlocks, templates, templateExercises, operationLog] = await Promise.all([
    getAllFromStore("settings"),
    getAllFromStore("exercises"),
    getAllFromStore("sessions"),
    getAllFromStore("sessionExercises"),
    getAllFromStore("setLogs"),
    getAllFromStore("personalRecords"),
    getAllFromStore("trainingBlocks"),
    getAllFromStore("templates"),
    getAllFromStore("templateExercises"),
    getAllFromStore("operationLog")
  ]);
  const settings = settingsRows[0] ?? await createDefaultSettings();
  return { settings, exercises, sessions, sessionExercises, setLogs, personalRecords, trainingBlocks, templates, templateExercises, operationLog };
}

export async function createDefaultSettings(): Promise<MobileSettings> {
  const now = nowIso();
  const settings: MobileSettings = {
    id: "settings",
    unitPreference: "lbs",
    deviceId: createId(),
    deviceName: navigator.userAgent.includes("iPhone") ? "iPhone" : "IronLung Phone",
    createdAt: now,
    updatedAt: now,
    lastExportedAt: null,
    lastImportedAt: null
  };
  await putInStore("settings", settings);
  return settings;
}

export async function saveSettings(settings: MobileSettings): Promise<void> {
  await putInStore("settings", { ...settings, updatedAt: nowIso() });
}

export async function clearAnalyzerCache(settings: MobileSettings): Promise<MobileSettings> {
  await Promise.all([
    clearStore("exercises"),
    clearStore("sessions"),
    clearStore("sessionExercises"),
    clearStore("setLogs"),
    clearStore("personalRecords"),
    clearStore("trainingBlocks"),
    clearStore("templates"),
    clearStore("templateExercises"),
    clearStore("operationLog")
  ]);
  const nextSettings = {
    ...settings,
    lastImportedAt: null,
    lastExportedAt: null,
    updatedAt: nowIso()
  };
  await putInStore("settings", nextSettings);
  return nextSettings;
}

export interface MobileSetWriteInput {
  exerciseId: string;
  weight: number;
  reps: number;
  rpe?: number | null;
  setType?: SetType;
}

export interface MobileWorkoutWriteResult {
  snapshot: MobileSnapshot;
  setLog: MobileSetLog;
  personalRecords: MobilePersonalRecord[];
}

const MOBILE_WORKOUT_SOURCE = "mobile-pwa";

export async function ensureActiveMobileWorkout(settings: MobileSettings): Promise<MobileWorkoutSession> {
  const sessions = await getAllFromStore("sessions");
  const active = sessions
    .filter((session) => !session.deletedAt && !session.finishedAt && session.importSource === MOBILE_WORKOUT_SOURCE)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  if (active) return active;

  const now = nowIso();
  const session: MobileWorkoutSession = {
    id: createId(),
    workoutTemplateId: null,
    name: "Mobile Workout",
    startedAt: now,
    finishedAt: null,
    notes: "Logged from IronLung mobile.",
    bodyweight: null,
    createdAt: now,
    updatedAt: now,
    ...mobileSync(settings, "mobile-workout"),
    importSource: MOBILE_WORKOUT_SOURCE
  };
  await putInStore("sessions", session);
  await appendOperation(settings, "create", "sessions", session.id, now);
  return session;
}

export async function addSetToActiveMobileWorkout(settings: MobileSettings, input: MobileSetWriteInput): Promise<MobileWorkoutWriteResult> {
  const session = await ensureActiveMobileWorkout(settings);
  const row = await ensureSessionExercise(settings, session, input.exerciseId);
  const now = nowIso();
  const rowSets = (await getAllFromStore("setLogs"))
    .filter((set) => !set.deletedAt && set.workoutSessionExerciseId === row.id)
    .sort((a, b) => a.setNumber - b.setNumber);
  const setLog: MobileSetLog = {
    id: createId(),
    workoutSessionExerciseId: row.id,
    setNumber: rowSets.length + 1,
    weight: sanitizeWeight(input.weight),
    reps: sanitizeReps(input.reps),
    rpe: input.rpe === undefined || input.rpe === null ? null : sanitizeRpe(input.rpe),
    setType: input.setType ?? "working",
    isCompleted: true,
    notes: "",
    createdAt: now,
    updatedAt: now,
    ...mobileSync(settings, "mobile-workout")
  };
  await putInStore("setLogs", setLog);
  await appendOperation(settings, "create", "setLogs", setLog.id, now);

  const records = await detectAndPersistMobilePrs(settings, session, row, setLog);
  const snapshot = await loadMobileSnapshot();
  return { snapshot, setLog, personalRecords: records };
}

export async function finishActiveMobileWorkout(settings: MobileSettings): Promise<MobileSnapshot> {
  const session = await ensureActiveMobileWorkout(settings);
  const now = nowIso();
  const finished: MobileWorkoutSession = {
    ...session,
    finishedAt: now,
    updatedAt: now,
    lastModifiedDeviceId: settings.deviceId,
    importSource: MOBILE_WORKOUT_SOURCE
  };
  await putInStore("sessions", finished);
  await appendOperation(settings, "update", "sessions", finished.id, now);
  return loadMobileSnapshot();
}

export async function setMobileSetCompleted(settings: MobileSettings, setId: string, isCompleted: boolean): Promise<MobileSnapshot> {
  const sets = await getAllFromStore("setLogs");
  const existing = sets.find((set) => set.id === setId);
  if (!existing) return loadMobileSnapshot();
  const now = nowIso();
  await putInStore("setLogs", {
    ...existing,
    isCompleted,
    updatedAt: now,
    lastModifiedDeviceId: settings.deviceId
  });
  await appendOperation(settings, "update", "setLogs", setId, now);
  return loadMobileSnapshot();
}

async function ensureSessionExercise(settings: MobileSettings, session: MobileWorkoutSession, exerciseId: string): Promise<MobileWorkoutSessionExercise> {
  const rows = await getAllFromStore("sessionExercises");
  const existing = rows.find((row) => !row.deletedAt && row.workoutSessionId === session.id && row.exerciseId === exerciseId);
  if (existing) return existing;
  const now = nowIso();
  const row: MobileWorkoutSessionExercise = {
    id: createId(),
    workoutSessionId: session.id,
    exerciseId,
    orderIndex: rows.filter((item) => !item.deletedAt && item.workoutSessionId === session.id).length,
    notes: "",
    createdAt: now,
    updatedAt: now,
    ...mobileSync(settings, "mobile-workout")
  };
  await putInStore("sessionExercises", row);
  await appendOperation(settings, "create", "sessionExercises", row.id, now);
  return row;
}

async function detectAndPersistMobilePrs(settings: MobileSettings, session: MobileWorkoutSession, row: MobileWorkoutSessionExercise, setLog: MobileSetLog): Promise<MobilePersonalRecord[]> {
  const [sessionExercises, setLogs, sessions] = await Promise.all([
    getAllFromStore("sessionExercises"),
    getAllFromStore("setLogs"),
    getAllFromStore("sessions")
  ]);
  const rowById = new Map(sessionExercises.filter((item) => !item.deletedAt).map((item) => [item.id, item]));
  const sessionById = new Map(sessions.filter((item) => !item.deletedAt).map((item) => [item.id, item]));
  const allExerciseRows = sessionExercises.filter((item) => !item.deletedAt && item.exerciseId === row.exerciseId);
  const exerciseRowIds = new Set(allExerciseRows.map((item) => item.id));
  const exerciseSets = setLogs.filter((set) => !set.deletedAt && exerciseRowIds.has(set.workoutSessionExerciseId));
  const sessionSetsForExercise = exerciseSets.filter((set) => {
    const setRow = rowById.get(set.workoutSessionExerciseId);
    return setRow?.workoutSessionId === session.id;
  }).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.setNumber - b.setNumber);
  const historicalSetsForExercise = exerciseSets.filter((set) => {
    if (set.id === setLog.id) return false;
    const setRow = rowById.get(set.workoutSessionExerciseId);
    return setRow?.workoutSessionId !== session.id || set.createdAt < setLog.createdAt;
  });
  const historicalSessionVolumesForExercise = new Map<string, number>();
  for (const set of historicalSetsForExercise) {
    const setRow = rowById.get(set.workoutSessionExerciseId);
    const setSession = setRow ? sessionById.get(setRow.workoutSessionId) : undefined;
    if (!setRow || !setSession || setSession.id === session.id || !set.isCompleted) continue;
    historicalSessionVolumesForExercise.set(setSession.id, (historicalSessionVolumesForExercise.get(setSession.id) ?? 0) + set.weight * set.reps);
  }
  const detected = detectPersonalRecords({
    exerciseId: row.exerciseId,
    workoutSessionId: session.id,
    achievedAt: setLog.createdAt,
    unit: settings.unitPreference,
    newSet: setLog,
    sessionSetsForExercise,
    historicalSetsForExercise,
    historicalSessionVolumesForExercise: [...historicalSessionVolumesForExercise.values()]
  });
  const synced = detected.map((record): MobilePersonalRecord => ({
    ...record,
    id: createId(),
    updatedAt: record.achievedAt,
    ...mobileSync(settings, "mobile-workout")
  }));
  for (const record of synced) {
    await putInStore("personalRecords", record);
    await appendOperation(settings, "create", "personalRecords", record.id, record.achievedAt);
  }
  return synced;
}

function mobileSync(settings: MobileSettings, source: string) {
  return {
    deletedAt: null,
    originDeviceId: settings.deviceId,
    lastModifiedDeviceId: settings.deviceId,
    syncVersion: 1,
    importSource: source,
    mobileBatchId: null
  };
}

async function appendOperation(settings: MobileSettings, operation: MobileOperationLogEntry["operation"], entity: keyof MobileRecords, recordId: string, createdAt = nowIso()) {
  await putInStore("operationLog", {
    id: createId(),
    operation,
    entity,
    recordId,
    deviceId: settings.deviceId,
    createdAt
  });
}

function sanitizeWeight(value: number) {
  return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
}

function sanitizeReps(value: number) {
  return Math.max(1, Math.round(Number.isFinite(value) ? value : 1));
}

function sanitizeRpe(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, Math.round(value * 2) / 2));
}
