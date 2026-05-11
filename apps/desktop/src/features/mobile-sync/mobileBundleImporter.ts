import type { MobileExportBundle } from "./mobileSyncTypes";

export function parseMobileExportBundle(raw: string): MobileExportBundle {
  const parsed = JSON.parse(raw) as Partial<MobileExportBundle> & { bundleType?: string };
  if (parsed.schemaVersion !== 1 || !isSupportedExportBundleType(parsed.bundleType)) {
    throw new Error("This is not a valid IronLog mobile export bundle.");
  }
  if (!parsed.records || !Array.isArray(parsed.records.sessions) || !Array.isArray(parsed.records.setLogs)) {
    throw new Error("Mobile export is missing workout records.");
  }
  return { ...parsed, bundleType: "ironlog-mobile-export" } as MobileExportBundle;
}

function isSupportedExportBundleType(value: unknown): value is "ironlog-mobile-export" | "ironlung-mobile-export" {
  return value === "ironlog-mobile-export" || value === "ironlung-mobile-export";
}
