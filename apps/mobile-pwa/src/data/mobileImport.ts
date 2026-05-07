import { getAllFromStore, putInStore } from "./mobileDb";
import type { MobileDbStores } from "./mobileDb";
import type { MobileImportSummary, MobileSeedBundle, MobileSettings } from "./mobileSyncTypes";

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
  await mergeRows("templates", bundle.records.templates ?? [], settings.deviceId, summary, {
    onCreate: () => { summary.templatesImported += 1; },
    onUpdate: () => { summary.templatesImported += 1; }
  });
  await mergeRows("templateExercises", bundle.records.templateExercises ?? [], settings.deviceId, summary);
  await mergeRows("trainingBlocks", bundle.records.trainingBlocks ?? [], settings.deviceId, summary, {
    onCreate: () => { summary.blocksImported += 1; },
    onUpdate: () => { summary.blocksImported += 1; }
  });
  await mergeRows("sessions", bundle.records.sessions ?? [], settings.deviceId, summary, {
    onCreate: () => { summary.workoutsCreated += 1; },
    onUpdate: () => { summary.workoutsUpdated += 1; }
  });
  await mergeRows("sessionExercises", bundle.records.sessionExercises ?? [], settings.deviceId, summary);
  await mergeRows("setLogs", bundle.records.setLogs ?? [], settings.deviceId, summary, {
    onCreate: () => { summary.setsCreated += 1; },
    onUpdate: () => { summary.setsUpdated += 1; }
  });
  await mergeRows("personalRecords", bundle.records.personalRecords ?? [], settings.deviceId, summary);

  await putInStore("settings", {
    ...settings,
    unitPreference: bundle.unitPreference,
    updatedAt: new Date().toISOString(),
    lastImportedAt: bundle.exportedAt
  });
  return summary;
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
