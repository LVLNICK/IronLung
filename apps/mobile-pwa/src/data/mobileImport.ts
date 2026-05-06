import { putInStore } from "./mobileDb";
import type { MobileImportSummary, MobileSeedBundle, MobileSettings } from "./mobileSyncTypes";

export function validateMobileSeedBundle(value: unknown): MobileSeedBundle {
  if (!value || typeof value !== "object") throw new Error("Invalid mobile seed file.");
  const bundle = value as MobileSeedBundle;
  if (bundle.schemaVersion !== 1 || bundle.bundleType !== "ironlung-mobile-seed") throw new Error("This is not an IronLung mobile seed bundle.");
  if (!bundle.records || !Array.isArray(bundle.records.exercises)) throw new Error("Seed bundle records are missing.");
  return bundle;
}

export async function importMobileSeedBundle(bundle: MobileSeedBundle, settings: MobileSettings): Promise<MobileImportSummary> {
  let exercisesCreated = 0;
  let exercisesUpdated = 0;
  let templatesImported = 0;
  let blocksImported = 0;
  let skipped = 0;

  for (const exercise of bundle.records.exercises) {
    if (!exercise.id || exercise.deletedAt) {
      skipped += 1;
      continue;
    }
    await putInStore("exercises", { ...exercise, importSource: "desktop-seed", lastModifiedDeviceId: settings.deviceId });
    exercisesCreated += 1;
  }
  for (const template of bundle.records.templates ?? []) {
    await putInStore("templates", { ...template, importSource: "desktop-seed", lastModifiedDeviceId: settings.deviceId });
    templatesImported += 1;
  }
  for (const row of bundle.records.templateExercises ?? []) {
    await putInStore("templateExercises", { ...row, importSource: "desktop-seed", lastModifiedDeviceId: settings.deviceId });
  }
  for (const block of bundle.records.trainingBlocks ?? []) {
    await putInStore("trainingBlocks", { ...block, importSource: "desktop-seed", lastModifiedDeviceId: settings.deviceId });
    blocksImported += 1;
  }
  for (const session of bundle.records.sessions ?? []) {
    if (!session.id || session.deletedAt) {
      skipped += 1;
      continue;
    }
    await putInStore("sessions", { ...session, importSource: "desktop-seed", lastModifiedDeviceId: settings.deviceId });
  }
  for (const row of bundle.records.sessionExercises ?? []) {
    if (!row.id || row.deletedAt) {
      skipped += 1;
      continue;
    }
    await putInStore("sessionExercises", { ...row, importSource: "desktop-seed", lastModifiedDeviceId: settings.deviceId });
  }
  for (const setLog of bundle.records.setLogs ?? []) {
    if (!setLog.id || setLog.deletedAt) {
      skipped += 1;
      continue;
    }
    await putInStore("setLogs", { ...setLog, importSource: "desktop-seed", lastModifiedDeviceId: settings.deviceId });
  }
  for (const record of bundle.records.personalRecords ?? []) {
    if (!record.id || record.deletedAt) {
      skipped += 1;
      continue;
    }
    await putInStore("personalRecords", { ...record, importSource: "desktop-seed", lastModifiedDeviceId: settings.deviceId });
  }
  await putInStore("settings", { ...settings, unitPreference: bundle.unitPreference, updatedAt: new Date().toISOString() });
  return { exercisesCreated, exercisesUpdated, templatesImported, blocksImported, skipped };
}
