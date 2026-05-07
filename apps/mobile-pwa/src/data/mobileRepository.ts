import { clearStore, getAllFromStore, putInStore } from "./mobileDb";
import { nowIso, type MobileOperationLogEntry, type MobileRecords, type MobileSettings } from "./mobileSyncTypes";
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
