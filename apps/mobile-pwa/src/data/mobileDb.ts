import type {
  MobileExercise,
  MobileOperationLogEntry,
  MobilePersonalRecord,
  MobileSetLog,
  MobileSettings,
  MobileTrainingBlock,
  MobileWorkoutSession,
  MobileWorkoutSessionExercise,
  MobileWorkoutTemplate,
  MobileWorkoutTemplateExercise
} from "./mobileSyncTypes";

export interface MobileDbStores {
  settings: MobileSettings;
  exercises: MobileExercise;
  sessions: MobileWorkoutSession;
  sessionExercises: MobileWorkoutSessionExercise;
  setLogs: MobileSetLog;
  personalRecords: MobilePersonalRecord;
  trainingBlocks: MobileTrainingBlock;
  templates: MobileWorkoutTemplate;
  templateExercises: MobileWorkoutTemplateExercise;
  operationLog: MobileOperationLogEntry;
}

// Preserve the original internal database key so existing installed PWAs keep
// their imported analyzer cache after the user-facing rename to IronLog.
const DB_NAME = "ironlung-mobile-pwa";
const DB_VERSION = 1;
const FALLBACK_PREFIX = "ironlung-mobile-pwa-fallback-v1";
const DB_OPEN_TIMEOUT_MS = 1500;
const STORE_NAMES: Array<keyof MobileDbStores> = [
  "settings",
  "exercises",
  "sessions",
  "sessionExercises",
  "setLogs",
  "personalRecords",
  "trainingBlocks",
  "templates",
  "templateExercises",
  "operationLog"
];

let dbPromise: Promise<IDBDatabase> | null = null;
let forceFallbackStorage = false;
const memoryFallback = new Map<string, string>();

export function openMobileDb(): Promise<IDBDatabase> {
  const lanHttpOrigin = typeof location !== "undefined"
    && location.protocol === "http:"
    && !["localhost", "127.0.0.1"].includes(location.hostname);
  if (lanHttpOrigin) forceFallbackStorage = true;
  if (!("indexedDB" in globalThis) || forceFallbackStorage) {
    return Promise.reject(new Error("IndexedDB is not available in this browser context."));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      forceFallbackStorage = true;
      reject(new Error("Mobile database open timed out; using fallback storage."));
    }, DB_OPEN_TIMEOUT_MS);
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      if (!settled) {
        settled = true;
        forceFallbackStorage = true;
        window.clearTimeout(timeout);
        reject(new Error("Mobile database open failed; using fallback storage."));
      }
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of STORE_NAMES) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(request.result);
    };
    request.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      reject(request.error ?? new Error("Could not open mobile database."));
    };
    request.onblocked = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      reject(new Error("Mobile database open was blocked by the browser."));
    };
  });
  return dbPromise;
}

export async function getAllFromStore<K extends keyof MobileDbStores>(storeName: K): Promise<MobileDbStores[K][]> {
  try {
    const db = await openMobileDb();
    return await new Promise((resolve, reject) => {
      const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result as MobileDbStores[K][]);
      request.onerror = () => reject(request.error ?? new Error(`Could not read ${storeName}.`));
    });
  } catch {
    return getFallbackRows(storeName);
  }
}

export async function putInStore<K extends keyof MobileDbStores>(storeName: K, record: MobileDbStores[K]): Promise<void> {
  try {
    const db = await openMobileDb();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(storeName, "readwrite").objectStore(storeName).put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error(`Could not write ${storeName}.`));
    });
  } catch {
    putFallbackRow(storeName, record);
  }
}

export async function deleteFromStore<K extends keyof MobileDbStores>(storeName: K, id: string): Promise<void> {
  try {
    const db = await openMobileDb();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(storeName, "readwrite").objectStore(storeName).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error(`Could not delete ${storeName}.`));
    });
  } catch {
    deleteFallbackRow(storeName, id);
  }
}

export async function clearStore<K extends keyof MobileDbStores>(storeName: K): Promise<void> {
  try {
    const db = await openMobileDb();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(storeName, "readwrite").objectStore(storeName).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error(`Could not clear ${storeName}.`));
    });
  } catch {
    saveFallbackRows(storeName, []);
  }
}

export async function clearAllMobileData(): Promise<void> {
  await Promise.all(STORE_NAMES.map((storeName) => clearStore(storeName)));
}

export function getMobileStorageMode(): "indexeddb" | "local-fallback" | "memory-fallback" {
  if (memoryFallback.size > 0) return "memory-fallback";
  if (forceFallbackStorage) return "local-fallback";
  return "indexeddb";
}

function fallbackKey(storeName: keyof MobileDbStores) {
  return `${FALLBACK_PREFIX}:${storeName}`;
}

function getFallbackRows<K extends keyof MobileDbStores>(storeName: K): MobileDbStores[K][] {
  forceFallbackStorage = true;
  try {
    const raw = localStorage.getItem(fallbackKey(storeName));
    return raw ? JSON.parse(raw) as MobileDbStores[K][] : [];
  } catch {
    const raw = memoryFallback.get(fallbackKey(storeName));
    return raw ? JSON.parse(raw) as MobileDbStores[K][] : [];
  }
}

function saveFallbackRows<K extends keyof MobileDbStores>(storeName: K, rows: MobileDbStores[K][]) {
  forceFallbackStorage = true;
  const serialized = JSON.stringify(rows);
  try {
    localStorage.setItem(fallbackKey(storeName), serialized);
  } catch {
    memoryFallback.set(fallbackKey(storeName), serialized);
  }
}

function putFallbackRow<K extends keyof MobileDbStores>(storeName: K, record: MobileDbStores[K]) {
  const rows = getFallbackRows(storeName);
  const index = rows.findIndex((row) => row.id === record.id);
  if (index === -1) rows.push(record);
  else rows[index] = record;
  saveFallbackRows(storeName, rows);
}

function deleteFallbackRow<K extends keyof MobileDbStores>(storeName: K, id: string) {
  saveFallbackRows(storeName, getFallbackRows(storeName).filter((row) => row.id !== id));
}
