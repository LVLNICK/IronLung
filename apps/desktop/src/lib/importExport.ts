import { importPayloadSchema } from "@ironlung/core";
import type { IronLungStateData } from "./store";

export function createExport(data: IronLungStateData) {
  return {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    data
  };
}

export function validateImportPayload(raw: string): IronLungStateData {
  const parsed = importPayloadSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid import payload.");
  }
  return parsed.data.data as unknown as IronLungStateData;
}
