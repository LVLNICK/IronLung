import type {
  Exercise,
  PersonalRecord,
  SetLog,
  TrainingBlock,
  UnitPreference,
  UserSettings,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutTemplate,
  WorkoutTemplateExercise
} from "@ironlog/core";

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
export type MobileSetLog = SetLog & MobileSyncMetadata & { updatedAt?: string };
export type MobilePersonalRecord = PersonalRecord & MobileSyncMetadata & { updatedAt?: string };
export type MobileTrainingBlock = TrainingBlock & MobileSyncMetadata;
export type MobileWorkoutTemplate = WorkoutTemplate & MobileSyncMetadata;
export type MobileWorkoutTemplateExercise = WorkoutTemplateExercise & MobileSyncMetadata & { createdAt?: string; updatedAt?: string };

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
  bundleType: "ironlog-mobile-export";
  deviceId: string;
  deviceName: string;
  exportedAt: string;
  appVersion: string;
  unitPreference: UnitPreference;
  records: MobileRecords;
  operationLog: Array<Record<string, unknown>>;
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
  bundleType: "ironlog-mobile-seed";
  deviceId: "desktop";
  deviceName: "IronLog Desktop";
  exportedAt: string;
  appVersion: string;
  unitPreference: UnitPreference;
  settings: Pick<UserSettings, "unitPreference" | "theme">;
  records: MobileRecords;
  summary: {
    exercises: number;
    templates: number;
    trainingBlocks: number;
    workouts: number;
    sets: number;
  };
}

export interface MobileImportPreview {
  deviceName: string;
  exportedAt: string;
  workoutsFound: number;
  setsFound: number;
  exercisesFound: number;
  dateRange: {
    start?: string;
    end?: string;
  };
  duplicateRecords: number;
  conflicts: number;
  recordsToCreate: number;
  recordsToUpdate: number;
  recordsToSkip: number;
  warnings: string[];
}

export interface MobileImportResult extends MobileImportPreview {
  mergedData: unknown;
}
