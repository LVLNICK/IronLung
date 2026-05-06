import type { MobileExportBundle, MobileSeedBundle } from "./mobileSyncTypes";

export function parseMobileExportBundle(raw: string): MobileExportBundle {
  const parsed = JSON.parse(raw) as Partial<MobileExportBundle>;
  if (parsed.schemaVersion !== 1 || parsed.bundleType !== "ironlung-mobile-export") {
    throw new Error("This is not a valid IronLung mobile export bundle.");
  }
  if (!parsed.records || !Array.isArray(parsed.records.sessions) || !Array.isArray(parsed.records.setLogs)) {
    throw new Error("Mobile export is missing workout records.");
  }
  return parsed as MobileExportBundle;
}

export function parseMobileSeedBundle(raw: string): MobileSeedBundle {
  const parsed = JSON.parse(raw) as Partial<MobileSeedBundle>;
  if (parsed.schemaVersion !== 1 || parsed.bundleType !== "ironlung-mobile-seed") {
    throw new Error("This is not a valid IronLung mobile seed bundle.");
  }
  if (!parsed.records || !Array.isArray(parsed.records.exercises) || !Array.isArray(parsed.records.templates)) {
    throw new Error("Mobile seed export is missing library records.");
  }
  return parsed as MobileSeedBundle;
}
