import type { Exercise, SetLog, TrainingBlock, WorkoutSession, WorkoutSessionExercise, WorkoutTemplate, WorkoutTemplateExercise } from "@ironlung/core";
import type { IronLungStateData } from "../../lib/store";
import type { MobileExportBundle, MobileImportPreview, MobileRecords, MobileSeedBundle, MobileSyncMetadata } from "./mobileSyncTypes";

const DESKTOP_DEVICE_ID = "desktop";

export function createMobileSeedBundle(data: IronLungStateData): MobileSeedBundle {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    bundleType: "ironlung-mobile-seed",
    deviceId: DESKTOP_DEVICE_ID,
    deviceName: "IronLung Desktop",
    exportedAt: now,
    appVersion: "0.1.0",
    unitPreference: data.unitPreference,
    settings: {
      unitPreference: data.unitPreference,
      theme: data.theme
    },
    records: {
      exercises: data.exercises.map((record) => withSync(record, now)),
      sessions: data.sessions.map((record) => withSync(record, now)),
      sessionExercises: data.sessionExercises.map((record) => withSync(record, now)),
      setLogs: data.setLogs.map((record) => withSync(record, now)),
      personalRecords: data.personalRecords.map((record) => withSync(record, now)),
      templates: data.templates.map((record) => withSync(record, now)),
      templateExercises: data.templateExercises.map((record) => withSync(record, now)),
      trainingBlocks: data.trainingBlocks.map((record) => withSync(record, now))
    },
    summary: {
      exercises: data.exercises.length,
      templates: data.templates.length,
      trainingBlocks: data.trainingBlocks.length,
      workouts: data.sessions.length,
      sets: data.setLogs.length
    }
  };
}

export function previewMobileImport(bundle: MobileExportBundle, desktop: IronLungStateData): MobileImportPreview {
  const result = mergeMobileBundle(bundle, desktop, { dryRun: true });
  return result.preview;
}

export function mergeMobileBundle(bundle: MobileExportBundle, desktop: IronLungStateData, options: { dryRun?: boolean } = {}) {
  const warnings: string[] = [];
  const mutable: IronLungStateData = cloneState(desktop);
  const counters = {
    duplicateRecords: 0,
    conflicts: 0,
    recordsToCreate: 0,
    recordsToUpdate: 0,
    recordsToSkip: 0
  };

  mergeById(mutable.exercises, bundle.records.exercises, counters);
  mergeById(mutable.trainingBlocks, bundle.records.trainingBlocks, counters);
  mergeById(mutable.templates, bundle.records.templates, counters);
  mergeById(mutable.templateExercises, bundle.records.templateExercises, counters);
  mergeById(mutable.sessions, bundle.records.sessions, counters);
  mergeById(mutable.sessionExercises, bundle.records.sessionExercises, counters);
  mergeSetLogs(mutable, bundle.records, counters);

  if (!bundle.records.sessions.length && bundle.records.setLogs.length) {
    warnings.push("Mobile bundle contains sets but no sessions; sets without workout context are skipped by duplicate safety.");
  }

  const preview: MobileImportPreview = {
    deviceName: bundle.deviceName,
    exportedAt: bundle.exportedAt,
    workoutsFound: bundle.records.sessions.filter((record) => !record.deletedAt).length,
    setsFound: bundle.records.setLogs.filter((record) => !record.deletedAt).length,
    exercisesFound: bundle.records.exercises.filter((record) => !record.deletedAt).length,
    dateRange: bundle.summary.dateRange,
    warnings,
    ...counters
  };

  return {
    preview,
    data: options.dryRun ? cloneState(desktop) : mutable
  };
}

function mergeById<T extends { id: string; updatedAt?: string; deletedAt?: string | null }>(desktopRows: T[], mobileRows: T[], counters: MutableCounters) {
  for (const row of mobileRows) {
    const existingIndex = desktopRows.findIndex((item) => item.id === row.id);
    if (row.deletedAt) {
      counters.recordsToSkip += 1;
      continue;
    }
    if (existingIndex === -1) {
      desktopRows.push(stripSync(row));
      counters.recordsToCreate += 1;
      continue;
    }
    const existing = desktopRows[existingIndex];
    if (isMobileNewer(row.updatedAt, existing.updatedAt)) {
      desktopRows[existingIndex] = { ...existing, ...stripSync(row) };
      counters.recordsToUpdate += 1;
    } else {
      counters.conflicts += row.updatedAt && existing.updatedAt && row.updatedAt !== existing.updatedAt ? 1 : 0;
      counters.recordsToSkip += 1;
    }
  }
}

function mergeSetLogs(desktop: IronLungStateData, mobileRecords: MobileRecords, counters: MutableCounters) {
  const desktopSignatures = new Set(desktop.setLogs.map((set) => setSignature(set, desktop)));
  const mobileSessionExercises = new Map(mobileRecords.sessionExercises.map((row) => [row.id, row]));

  for (const mobileSet of mobileRecords.setLogs) {
    if (mobileSet.deletedAt) {
      counters.recordsToSkip += 1;
      continue;
    }
    const existingIndex = desktop.setLogs.findIndex((row) => row.id === mobileSet.id);
    const signature = setSignature(mobileSet, desktop, mobileSessionExercises);

    if (existingIndex === -1 && desktopSignatures.has(signature)) {
      counters.duplicateRecords += 1;
      counters.recordsToSkip += 1;
      continue;
    }
    if (existingIndex === -1) {
      desktop.setLogs.push(stripSync(mobileSet));
      desktopSignatures.add(signature);
      counters.recordsToCreate += 1;
      continue;
    }

    const existing = desktop.setLogs[existingIndex] as SetLog & { updatedAt?: string };
    if (isMobileNewer(mobileSet.updatedAt ?? mobileSet.createdAt, existing.updatedAt ?? existing.createdAt)) {
      desktop.setLogs[existingIndex] = { ...existing, ...stripSync(mobileSet) };
      counters.recordsToUpdate += 1;
    } else {
      counters.recordsToSkip += 1;
    }
  }
}

function setSignature(set: SetLog, desktop: IronLungStateData, mobileSessionExercises?: Map<string, WorkoutSessionExercise>) {
  const sessionExercise = mobileSessionExercises?.get(set.workoutSessionExerciseId)
    ?? desktop.sessionExercises.find((row) => row.id === set.workoutSessionExerciseId);
  const session = desktop.sessions.find((row) => row.id === sessionExercise?.workoutSessionId);
  const exercise = desktop.exercises.find((row) => row.id === sessionExercise?.exerciseId);
  return [
    session?.startedAt ?? "",
    session?.name ?? "",
    exercise?.name ?? sessionExercise?.exerciseId ?? "",
    set.setNumber,
    Number(set.weight),
    Number(set.reps),
    set.notes ?? "",
    set.createdAt
  ].join("|").toLowerCase();
}

function isMobileNewer(mobileUpdatedAt?: string, desktopUpdatedAt?: string) {
  if (!mobileUpdatedAt) return false;
  if (!desktopUpdatedAt) return true;
  return new Date(mobileUpdatedAt).getTime() > new Date(desktopUpdatedAt).getTime();
}

function withSync<T extends { id: string }>(record: T, now: string): T & MobileSyncMetadata {
  return {
    ...record,
    originDeviceId: DESKTOP_DEVICE_ID,
    lastModifiedDeviceId: DESKTOP_DEVICE_ID,
    syncVersion: 1,
    importSource: "desktop-seed",
    mobileBatchId: null,
    deletedAt: null,
    updatedAt: "updatedAt" in record && typeof record.updatedAt === "string" ? record.updatedAt : now
  };
}

function stripSync<T>(record: T): T {
  const copy = { ...record } as T & Partial<MobileSyncMetadata>;
  delete copy.originDeviceId;
  delete copy.lastModifiedDeviceId;
  delete copy.syncVersion;
  delete copy.deletedAt;
  delete copy.mobileBatchId;
  return copy as T;
}

function cloneState(data: IronLungStateData): IronLungStateData {
  return {
    ...data,
    trainingBlocks: [...data.trainingBlocks],
    exercises: [...data.exercises],
    templates: [...data.templates],
    templateExercises: [...data.templateExercises],
    sessions: [...data.sessions],
    sessionExercises: [...data.sessionExercises],
    setLogs: [...data.setLogs],
    personalRecords: [...data.personalRecords],
    photos: [...data.photos],
    analyses: [...data.analyses]
  };
}

type MutableCounters = Pick<MobileImportPreview, "duplicateRecords" | "conflicts" | "recordsToCreate" | "recordsToUpdate" | "recordsToSkip">;

type _TypeChecks =
  | Exercise
  | WorkoutSession
  | WorkoutSessionExercise
  | SetLog
  | WorkoutTemplate
  | WorkoutTemplateExercise
  | TrainingBlock;
