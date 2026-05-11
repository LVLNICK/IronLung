import { describe, expect, it } from "vitest";
import type { IronLogStateData } from "../../lib/store";
import { parseMobileExportBundle } from "./mobileBundleImporter";
import { createMobileSeedBundle, mergeMobileBundle, previewMobileImport } from "./mobileMerge";
import type { MobileExportBundle } from "./mobileSyncTypes";

describe("mobile PWA sync merge", () => {
  it("exports a desktop seed bundle without workout history", () => {
    const seed = createMobileSeedBundle(baseState());

    expect(seed.bundleType).toBe("ironlog-mobile-seed");
    expect(seed.records.exercises).toHaveLength(1);
    expect(seed.records.templates).toHaveLength(1);
    expect(seed.summary.exercises).toBe(1);
    expect(seed.records.sessions).toEqual([]);
    expect(seed.records.setLogs).toEqual([]);
  });

  it("previews and imports new phone workouts", () => {
    const desktop = baseState();
    const bundle = mobileBundle();

    const preview = previewMobileImport(bundle, desktop);
    const result = mergeMobileBundle(bundle, desktop);

    expect(preview.workoutsFound).toBe(1);
    expect(preview.setsFound).toBe(1);
    expect(result.data.sessions.some((session) => session.id === "mobile-session")).toBe(true);
    expect(result.data.setLogs.some((set) => set.id === "mobile-set")).toBe(true);
  });

  it("does not duplicate identical phone sets imported twice", () => {
    const once = mergeMobileBundle(mobileBundle(), baseState()).data;
    const twice = mergeMobileBundle(mobileBundle(), once).data;

    expect(twice.setLogs.filter((set) => set.id === "mobile-set")).toHaveLength(1);
    expect(mergeMobileBundle(mobileBundle(), once).preview.recordsToSkip).toBeGreaterThan(0);
  });

  it("accepts legacy IronLung mobile export bundles and normalizes the brand name", () => {
    const parsed = parseMobileExportBundle(JSON.stringify({ ...mobileBundle(), bundleType: "ironlung-mobile-export" }));

    expect(parsed.bundleType).toBe("ironlog-mobile-export");
    expect(parsed.records.setLogs).toHaveLength(1);
  });
});

function baseState(): IronLogStateData {
  return {
    unitPreference: "lbs",
    theme: "dark",
    trainingGoal: "strength",
    currentTrainingBlockId: null,
    trainingBlocks: [],
    exercises: [
      { id: "bench", name: "Bench Press", primaryMuscle: "Chest", secondaryMuscles: ["Triceps"], equipment: "Barbell", movementPattern: "Press", isUnilateral: false, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z" }
    ],
    templates: [
      { id: "template", name: "Upper", createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z" }
    ],
    templateExercises: [
      { id: "template-row", workoutTemplateId: "template", exerciseId: "bench", orderIndex: 0, targetSets: 3, targetReps: "8-10", targetRestSeconds: 120 }
    ],
    sessions: [],
    sessionExercises: [],
    setLogs: [],
    personalRecords: [],
    photos: [],
    analyses: []
  };
}

function mobileBundle(): MobileExportBundle {
  const sync = {
    originDeviceId: "phone-1",
    lastModifiedDeviceId: "phone-1",
    syncVersion: 1,
    importSource: "mobile-pwa",
    mobileBatchId: null,
    deletedAt: null
  };
  return {
    schemaVersion: 1,
    bundleType: "ironlog-mobile-export",
    deviceId: "phone-1",
    deviceName: "Nick iPhone",
    exportedAt: "2026-05-06T22:00:00.000Z",
    appVersion: "0.1.0",
    unitPreference: "lbs",
    records: {
      exercises: [],
      trainingBlocks: [],
      templates: [],
      templateExercises: [],
      personalRecords: [],
      sessions: [
        { id: "mobile-session", name: "Gym Workout", workoutTemplateId: null, startedAt: "2026-05-06T20:00:00.000Z", finishedAt: "2026-05-06T21:00:00.000Z", createdAt: "2026-05-06T20:00:00.000Z", updatedAt: "2026-05-06T21:00:00.000Z", ...sync }
      ],
      sessionExercises: [
        { id: "mobile-row", workoutSessionId: "mobile-session", exerciseId: "bench", orderIndex: 0, createdAt: "2026-05-06T20:01:00.000Z", updatedAt: "2026-05-06T20:01:00.000Z", ...sync }
      ],
      setLogs: [
        { id: "mobile-set", workoutSessionExerciseId: "mobile-row", setNumber: 1, weight: 225, reps: 5, rpe: 8, setType: "working", isCompleted: true, createdAt: "2026-05-06T20:05:00.000Z", updatedAt: "2026-05-06T20:05:00.000Z", ...sync }
      ]
    },
    operationLog: [],
    summary: {
      workouts: 1,
      sets: 1,
      exercises: 0,
      dateRange: {
        start: "2026-05-06T20:00:00.000Z",
        end: "2026-05-06T20:00:00.000Z"
      }
    }
  };
}
