import { importPayloadSchema } from "@ironlog/core";
import type { IronLogStateData } from "./store";

export function createExport(data: IronLogStateData) {
  return {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    data
  };
}

export function validateImportPayload(raw: string): IronLogStateData {
  const parsed = importPayloadSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid import payload.");
  }
  return parsed.data.data as unknown as IronLogStateData;
}
