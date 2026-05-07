import type {
  Exercise,
  PersonalRecord,
  SetLog,
  TrainingBlock,
  UnitPreference,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutTemplate,
  WorkoutTemplateExercise
} from "@ironlung/core";

export interface MobileSyncMetadata {
  deletedAt?: string | null;
  originDeviceId: string;
  lastModifiedDeviceId: string;
  syncVersion: number;
  importSource?: string;
  mobileBatchId?: string | null;
}

export type MobileExercise = Exercise & MobileSyncMetadata;
export type MobileWorkoutSession = WorkoutSession & MobileSyncMetadata;
export type MobileWorkoutSessionExercise = WorkoutSessionExercise & MobileSyncMetadata & { createdAt?: string; updatedAt?: string };
export type MobileSetLog = SetLog & MobileSyncMetadata & { updatedAt: string };
export type MobilePersonalRecord = PersonalRecord & MobileSyncMetadata & { updatedAt: string };
export type MobileTrainingBlock = TrainingBlock & MobileSyncMetadata;
export type MobileWorkoutTemplate = WorkoutTemplate & MobileSyncMetadata;
export type MobileWorkoutTemplateExercise = WorkoutTemplateExercise & MobileSyncMetadata & { createdAt: string; updatedAt: string };

export interface MobileSettings {
  id: "settings";
  unitPreference: UnitPreference;
  deviceId: string;
  deviceName: string;
  createdAt: string;
  updatedAt: string;
  lastExportedAt?: string | null;
  lastImportedAt?: string | null;
}

export interface MobileOperationLogEntry {
  id: string;
  operation: "create" | "update" | "delete" | "import";
  entity: keyof MobileRecords;
  recordId: string;
  deviceId: string;
  createdAt: string;
}

export interface MobileRecords {
  exercises: MobileExercise[];
  sessions: MobileWorkoutSession[];
  sessionExercises: MobileWorkoutSessionExercise[];
  setLogs: MobileSetLog[];
  personalRecords: MobilePersonalRecord[];
  trainingBlocks: MobileTrainingBlock[];
  templates: MobileWorkoutTemplate[];
  templateExercises: MobileWorkoutTemplateExercise[];
}

export interface MobileExportBundle {
  schemaVersion: 1;
  bundleType: "ironlung-mobile-export";
  deviceId: string;
  deviceName: string;
  exportedAt: string;
  appVersion: string;
  unitPreference: UnitPreference;
  records: MobileRecords;
  operationLog: MobileOperationLogEntry[];
  summary: {
    workouts: number;
    sets: number;
    exercises: number;
    dateRange: {
      start?: string;
      end?: string;
    };
  };
}

export interface MobileSeedBundle {
  schemaVersion: 1;
  bundleType: "ironlung-mobile-seed";
  exportedAt: string;
  appVersion: string;
  unitPreference: UnitPreference;
  records: Pick<MobileRecords, "exercises" | "templates" | "templateExercises" | "trainingBlocks"> & {
    sessions?: MobileWorkoutSession[];
    sessionExercises?: MobileWorkoutSessionExercise[];
    setLogs?: MobileSetLog[];
    personalRecords?: MobilePersonalRecord[];
  };
  summary: {
    exercises: number;
    templates: number;
    trainingBlocks: number;
    workouts?: number;
    sets?: number;
    recentWorkouts?: number;
  };
}

export interface MobileImportSummary {
  created: number;
  updated: number;
  exercisesCreated: number;
  exercisesUpdated: number;
  workoutsCreated: number;
  workoutsUpdated: number;
  setsCreated: number;
  setsUpdated: number;
  templatesImported: number;
  blocksImported: number;
  skipped: number;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createSyncMetadata(deviceId: string, importSource?: string): MobileSyncMetadata {
  return {
    deletedAt: null,
    originDeviceId: deviceId,
    lastModifiedDeviceId: deviceId,
    syncVersion: 1,
    importSource,
    mobileBatchId: null
  };
}
