import type { MobileExportBundle, MobileRecords, MobileSettings } from "./mobileSyncTypes";

export function createMobileExportBundle(records: MobileRecords, settings: MobileSettings, operationLog: MobileExportBundle["operationLog"], includeDeleted = true): MobileExportBundle {
  const exportedAt = new Date().toISOString();
  const filteredRecords = includeDeleted ? records : {
    exercises: records.exercises.filter((row) => !row.deletedAt),
    sessions: records.sessions.filter((row) => !row.deletedAt),
    sessionExercises: records.sessionExercises.filter((row) => !row.deletedAt),
    setLogs: records.setLogs.filter((row) => !row.deletedAt),
    personalRecords: records.personalRecords.filter((row) => !row.deletedAt),
    trainingBlocks: records.trainingBlocks.filter((row) => !row.deletedAt),
    templates: records.templates.filter((row) => !row.deletedAt),
    templateExercises: records.templateExercises.filter((row) => !row.deletedAt)
  };
  const dates = filteredRecords.sessions.map((session) => session.startedAt).sort();
  const lastDate = dates[dates.length - 1];
  return {
    schemaVersion: 1,
    bundleType: "ironlung-mobile-export",
    deviceId: settings.deviceId,
    deviceName: settings.deviceName,
    exportedAt,
    appVersion: "0.1.0",
    unitPreference: settings.unitPreference,
    records: filteredRecords,
    operationLog,
    summary: {
      workouts: filteredRecords.sessions.length,
      sets: filteredRecords.setLogs.length,
      exercises: filteredRecords.exercises.length,
      dateRange: {
        start: dates[0],
        end: lastDate
      }
    }
  };
}

export function validateMobileExportBundle(value: unknown): MobileExportBundle {
  if (!value || typeof value !== "object") throw new Error("Invalid mobile export file.");
  const bundle = value as MobileExportBundle;
  if (bundle.schemaVersion !== 1 || bundle.bundleType !== "ironlung-mobile-export") throw new Error("This is not an IronLung mobile export.");
  if (!bundle.records || !Array.isArray(bundle.records.sessions) || !Array.isArray(bundle.records.setLogs)) throw new Error("Mobile export records are missing.");
  return bundle;
}
