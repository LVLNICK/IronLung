import { describe, expect, it } from "vitest";
import { clearAllMobileData, getAllFromStore, putInStore } from "./mobileDb";
import { importMobileSeedBundle } from "./mobileImport";
import type { MobileSeedBundle, MobileSettings } from "./mobileSyncTypes";

describe("desktop seed import", () => {
  it("imports the same seed twice without duplicate exercises or workouts", async () => {
    await clearAllMobileData();
    const first = await importMobileSeedBundle(seedBundle(), settings());
    const second = await importMobileSeedBundle(seedBundle(), settings());

    expect(first.created).toBeGreaterThan(0);
    expect(second.created).toBe(0);
    expect(second.skipped).toBeGreaterThan(0);
    expect(await getAllFromStore("exercises")).toHaveLength(1);
    expect(await getAllFromStore("sessions")).toHaveLength(1);
    expect(await getAllFromStore("setLogs")).toHaveLength(1);
  });

  it("skips duplicate exercises by normalized name", async () => {
    await clearAllMobileData();
    await putInStore("exercises", {
      id: "existing-bench",
      name: "Bench Press",
      primaryMuscle: "Chest",
      secondaryMuscles: [],
      equipment: "Barbell",
      movementPattern: "Press",
      isUnilateral: false,
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z",
      deletedAt: null,
      originDeviceId: "desktop",
      lastModifiedDeviceId: "phone",
      syncVersion: 1,
      mobileBatchId: null
    });

    const result = await importMobileSeedBundle({
      ...seedBundle(),
      records: {
        ...seedBundle().records,
        exercises: [{ ...seedBundle().records.exercises[0], id: "different-id", name: "bench press" }]
      }
    }, settings());

    expect(result.exercisesCreated).toBe(0);
    expect(result.skipped).toBeGreaterThan(0);
    expect(await getAllFromStore("exercises")).toHaveLength(1);
  });

  it("clears the local analyzer fallback cache", async () => {
    await clearAllMobileData();
    await importMobileSeedBundle(seedBundle(), settings());
    expect(await getAllFromStore("setLogs")).toHaveLength(1);
    await clearAllMobileData();
    expect(await getAllFromStore("setLogs")).toHaveLength(0);
  });
});

function settings(): MobileSettings {
  return {
    id: "settings",
    unitPreference: "lbs",
    deviceId: "phone",
    deviceName: "Phone",
    createdAt: "2026-05-06T00:00:00.000Z",
    updatedAt: "2026-05-06T00:00:00.000Z",
    lastExportedAt: null,
    lastImportedAt: null
  };
}

function seedBundle(): MobileSeedBundle {
  const sync = {
    originDeviceId: "desktop",
    lastModifiedDeviceId: "desktop",
    syncVersion: 1,
    importSource: "desktop-seed",
    mobileBatchId: null,
    deletedAt: null
  };
  return {
    schemaVersion: 1,
    bundleType: "ironlung-mobile-seed",
    exportedAt: "2026-05-06T12:00:00.000Z",
    appVersion: "0.1.0",
    unitPreference: "lbs",
    records: {
      exercises: [
        { id: "bench", name: "Bench Press", primaryMuscle: "Chest", secondaryMuscles: ["Triceps"], equipment: "Barbell", movementPattern: "Press", isUnilateral: false, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z", ...sync }
      ],
      templates: [],
      templateExercises: [],
      trainingBlocks: [],
      personalRecords: [],
      sessions: [
        { id: "session", name: "Upper", workoutTemplateId: null, startedAt: "2026-05-06T10:00:00.000Z", finishedAt: "2026-05-06T11:00:00.000Z", createdAt: "2026-05-06T10:00:00.000Z", updatedAt: "2026-05-06T11:00:00.000Z", ...sync }
      ],
      sessionExercises: [
        { id: "row", workoutSessionId: "session", exerciseId: "bench", orderIndex: 0, createdAt: "2026-05-06T10:01:00.000Z", updatedAt: "2026-05-06T10:01:00.000Z", ...sync }
      ],
      setLogs: [
        { id: "set", workoutSessionExerciseId: "row", setNumber: 1, weight: 225, reps: 5, rpe: 8, setType: "working", isCompleted: true, createdAt: "2026-05-06T10:05:00.000Z", updatedAt: "2026-05-06T10:05:00.000Z", ...sync }
      ]
    },
    summary: {
      exercises: 1,
      templates: 0,
      trainingBlocks: 0,
      workouts: 1,
      sets: 1
    }
  };
}
