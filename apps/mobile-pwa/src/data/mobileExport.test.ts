import { describe, expect, it } from "vitest";
import { createMobileExportBundle, validateMobileExportBundle } from "./mobileExport";
import type { MobileOperationLogEntry, MobileRecords, MobileSettings } from "./mobileSyncTypes";

describe("mobile export bundle", () => {
  it("creates a validated local-only analyzer cache bundle", () => {
    const bundle = createMobileExportBundle(records(), settings(), operationLog());

    expect(bundle.bundleType).toBe("ironlung-mobile-export");
    expect(bundle.summary.workouts).toBe(1);
    expect(bundle.summary.sets).toBe(1);
    expect(bundle.summary.dateRange.start).toBe("2026-05-06T20:00:00.000Z");
    expect(validateMobileExportBundle(bundle).deviceId).toBe("phone-1");
  });
});

function settings(): MobileSettings {
  return {
    id: "settings",
    unitPreference: "lbs",
    deviceId: "phone-1",
    deviceName: "Gym phone",
    createdAt: "2026-05-06T19:00:00.000Z",
    updatedAt: "2026-05-06T19:00:00.000Z",
    lastExportedAt: null
  };
}

function records(): MobileRecords {
  const sync = {
    originDeviceId: "phone-1",
    lastModifiedDeviceId: "phone-1",
    syncVersion: 1,
    importSource: "mobile-pwa",
    mobileBatchId: null,
    deletedAt: null
  };
  return {
    exercises: [
      { id: "bench", name: "Bench Press", primaryMuscle: "Chest", secondaryMuscles: [], equipment: "Barbell", movementPattern: "Press", isUnilateral: false, createdAt: "2026-05-06T19:00:00.000Z", updatedAt: "2026-05-06T19:00:00.000Z", ...sync }
    ],
    trainingBlocks: [],
    templates: [],
    templateExercises: [],
    personalRecords: [],
    sessions: [
      { id: "session", name: "Gym Workout", workoutTemplateId: null, startedAt: "2026-05-06T20:00:00.000Z", finishedAt: "2026-05-06T21:00:00.000Z", createdAt: "2026-05-06T20:00:00.000Z", updatedAt: "2026-05-06T21:00:00.000Z", ...sync }
    ],
    sessionExercises: [
      { id: "row", workoutSessionId: "session", exerciseId: "bench", orderIndex: 0, createdAt: "2026-05-06T20:01:00.000Z", updatedAt: "2026-05-06T20:01:00.000Z", ...sync }
    ],
    setLogs: [
      { id: "set", workoutSessionExerciseId: "row", setNumber: 1, weight: 225, reps: 5, rpe: 8, setType: "working", isCompleted: true, createdAt: "2026-05-06T20:05:00.000Z", updatedAt: "2026-05-06T20:05:00.000Z", ...sync }
    ]
  };
}

function operationLog(): MobileOperationLogEntry[] {
  return [
    { id: "op", entity: "sessions", recordId: "session", operation: "create", deviceId: "phone-1", createdAt: "2026-05-06T20:00:00.000Z" }
  ];
}
