import { detectPersonalRecords, exerciseSessionVolume, inferExerciseTargetProfile, resolveMuscleContributions, type SetType, type UnitPreference } from "@ironlung/core";
import { getAllFromStore, putInStore } from "./mobileDb";
import { createSyncMetadata, nowIso, type MobileExercise, type MobileOperationLogEntry, type MobileRecords, type MobileSetLog, type MobileSettings, type MobileWorkoutSession, type MobileWorkoutSessionExercise } from "./mobileSyncTypes";
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
    lastExportedAt: null
  };
  await putInStore("settings", settings);
  return settings;
}

export async function saveSettings(settings: MobileSettings): Promise<void> {
  await putInStore("settings", { ...settings, updatedAt: nowIso() });
}

export async function createExercise(input: { name: string; primaryMuscle: string; equipment: string; movementPattern: string; unitPreference?: UnitPreference }, settings: MobileSettings): Promise<MobileExercise> {
  const now = nowIso();
  const profile = inferExerciseTargetProfile(input.name);
  const exercise: MobileExercise = {
    id: createId(),
    name: input.name.trim(),
    primaryMuscle: input.primaryMuscle.trim() || profile.primaryMuscle,
    secondaryMuscles: profile.secondaryMuscles,
    equipment: input.equipment.trim() || profile.equipment,
    movementPattern: input.movementPattern.trim() || profile.movementPattern,
    isUnilateral: profile.isUnilateral,
    notes: profile.notes,
    createdAt: now,
    updatedAt: now,
    ...createSyncMetadata(settings.deviceId)
  };
  exercise.muscleContributions = resolveMuscleContributions(exercise);
  await putInStore("exercises", exercise);
  await logOperation("exercises", exercise.id, "create", settings.deviceId);
  return exercise;
}

export async function startWorkout(name: string, settings: MobileSettings, templateId?: string | null): Promise<MobileWorkoutSession> {
  const now = nowIso();
  const session: MobileWorkoutSession = {
    id: createId(),
    workoutTemplateId: templateId ?? null,
    name: name.trim() || "Gym Workout",
    startedAt: now,
    finishedAt: null,
    createdAt: now,
    updatedAt: now,
    ...createSyncMetadata(settings.deviceId)
  };
  await putInStore("sessions", session);
  await logOperation("sessions", session.id, "create", settings.deviceId);
  return session;
}

export async function addExerciseToSession(sessionId: string, exerciseId: string, orderIndex: number, settings: MobileSettings): Promise<MobileWorkoutSessionExercise> {
  const now = nowIso();
  const row: MobileWorkoutSessionExercise = {
    id: createId(),
    workoutSessionId: sessionId,
    exerciseId,
    orderIndex,
    notes: "",
    importSource: "mobile-pwa",
    importedMetadataJson: {},
    createdAt: now,
    updatedAt: now,
    ...createSyncMetadata(settings.deviceId)
  } as MobileWorkoutSessionExercise;
  await putInStore("sessionExercises", row);
  await logOperation("sessionExercises", row.id, "create", settings.deviceId);
  return row;
}

export async function logSet(input: { workoutSessionExerciseId: string; setNumber: number; weight: number; reps: number; rpe?: number | null; setType: SetType; notes?: string }, snapshot: MobileSnapshot): Promise<{ setLog: MobileSetLog; prs: MobileSnapshot["personalRecords"] }> {
  const now = nowIso();
  const setLog: MobileSetLog = {
    id: createId(),
    workoutSessionExerciseId: input.workoutSessionExerciseId,
    setNumber: input.setNumber,
    weight: input.weight,
    reps: input.reps,
    rpe: input.rpe ?? null,
    setType: input.setType,
    isCompleted: true,
    notes: input.notes,
    importSource: "mobile-pwa",
    createdAt: now,
    updatedAt: now,
    ...createSyncMetadata(snapshot.settings.deviceId)
  };
  const row = snapshot.sessionExercises.find((item) => item.id === input.workoutSessionExerciseId);
  const session = snapshot.sessions.find((item) => item.id === row?.workoutSessionId);
  const exerciseId = row?.exerciseId ?? "";
  const sessionSets = [...snapshot.setLogs, setLog].filter((item) => item.workoutSessionExerciseId === input.workoutSessionExerciseId);
  const historicalRows = snapshot.sessionExercises.filter((item) => item.exerciseId === exerciseId && item.id !== input.workoutSessionExerciseId);
  const historicalSets = snapshot.setLogs.filter((item) => historicalRows.some((row) => row.id === item.workoutSessionExerciseId));
  const historicalVolumes = historicalRows.map((item) => exerciseSessionVolume(snapshot.setLogs.filter((set) => set.workoutSessionExerciseId === item.id)));
  const prs = row && session ? detectPersonalRecords({
    exerciseId,
    workoutSessionId: session.id,
    achievedAt: now,
    unit: snapshot.settings.unitPreference,
    newSet: setLog,
    sessionSetsForExercise: sessionSets,
    historicalSetsForExercise: historicalSets,
    historicalSessionVolumesForExercise: historicalVolumes
  }).map((record) => ({
    ...record,
    updatedAt: now,
    ...createSyncMetadata(snapshot.settings.deviceId)
  })) : [];
  await putInStore("setLogs", setLog);
  await Promise.all(prs.map((record) => putInStore("personalRecords", record)));
  await logOperation("setLogs", setLog.id, "create", snapshot.settings.deviceId);
  return { setLog, prs };
}

export async function finishWorkout(session: MobileWorkoutSession, settings: MobileSettings, notes?: string): Promise<MobileWorkoutSession> {
  const now = nowIso();
  const next = { ...session, notes, finishedAt: now, updatedAt: now, lastModifiedDeviceId: settings.deviceId, syncVersion: session.syncVersion + 1 };
  await putInStore("sessions", next);
  await logOperation("sessions", next.id, "update", settings.deviceId);
  return next;
}

export async function softDeleteSession(session: MobileWorkoutSession, settings: MobileSettings): Promise<void> {
  await putInStore("sessions", { ...session, deletedAt: nowIso(), lastModifiedDeviceId: settings.deviceId, syncVersion: session.syncVersion + 1 });
  await logOperation("sessions", session.id, "delete", settings.deviceId);
}

export async function logOperation(entity: keyof MobileRecords, recordId: string, operation: MobileOperationLogEntry["operation"], deviceId: string): Promise<void> {
  const entry: MobileOperationLogEntry = { id: createId(), entity, recordId, operation, deviceId, createdAt: nowIso() };
  await putInStore("operationLog", entry);
}
