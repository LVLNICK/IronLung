import type { MobileExportBundle } from "./mobileSyncTypes";

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
