import { describe, expect, it } from "vitest";
import { availableMuscles, buildMobileAnalyzer } from "./mobileAnalytics";
import type { MobileSnapshot } from "../../data/mobileRepository";

describe("mobile analyzer model", () => {
  it("filters by range, ranks distributed muscle volume, and hides baseline PRs", () => {
    const model = buildMobileAnalyzer(snapshot(), "30d");

    expect(model.summary.totals.sessions).toBe(1);
    expect(model.muscleRows[0].label).toBe("Pectoralis major");
    expect(model.recentPrs.map((record) => record.importance)).not.toContain("baseline");
    expect(model.strengthRows[0].exerciseName).toBe("Bench Press");
  });

  it("builds muscle filters from resolved contributions and includes bench under chest, triceps, and front delts", () => {
    const data = snapshot();

    expect(availableMuscles(data)).toEqual(expect.arrayContaining(["Pectoralis major", "Triceps brachii", "Anterior deltoids"]));
    expect(buildMobileAnalyzer(data, "30d", "Pectoralis major").strengthRows.map((row) => row.exerciseName)).toContain("Bench Press");
    expect(buildMobileAnalyzer(data, "30d", "Triceps brachii").strengthRows.map((row) => row.exerciseName)).toContain("Bench Press");
    expect(buildMobileAnalyzer(data, "30d", "Anterior deltoids").strengthRows.map((row) => row.exerciseName)).toContain("Bench Press");
  });

  it("formats distributed muscle set labels without decimal noise", () => {
    const model = buildMobileAnalyzer(snapshot(), "30d");

    expect(model.muscleRows.length).toBeGreaterThan(0);
    expect(model.muscleRows.every((row) => !/\d+\.\d/.test(row.meta ?? ""))).toBe(true);
    expect(model.muscleRows.map((row) => row.meta)).toEqual(expect.arrayContaining(["1 related set"]));
  });

  it("changes totals when analytics date range changes", () => {
    const data = snapshot();
    const sevenDays = buildMobileAnalyzer(data, "7d");
    const allTime = buildMobileAnalyzer(data, "all");

    expect(sevenDays.summary.totals.sessions).toBe(1);
    expect(allTime.summary.totals.sessions).toBe(2);
    expect(allTime.summary.totals.volume).toBeGreaterThan(sevenDays.summary.totals.volume);
  });

  it("keeps Home PRs non-baseline so the newest small PR can still surface", () => {
    const model = buildMobileAnalyzer(snapshot(), "30d");

    expect(model.recentPrs.map((record) => record.importance)).toEqual(expect.arrayContaining(["major", "medium"]));
    expect(model.recentPrs.map((record) => record.importance)).toContain("small");
    expect(model.recentPrs.map((record) => record.importance)).not.toContain("baseline");
    expect(model.strengthPrs.map((record) => record.importance)).toContain("small");
    expect(model.strengthPrs.map((record) => record.importance)).not.toContain("baseline");
  });
});

function snapshot(): MobileSnapshot {
  const sync = {
    originDeviceId: "desktop",
    lastModifiedDeviceId: "desktop",
    syncVersion: 1,
    importSource: "desktop-seed",
    mobileBatchId: null,
    deletedAt: null
  };
  return {
    settings: {
      id: "settings",
      unitPreference: "lbs",
      deviceId: "phone",
      deviceName: "Phone",
      createdAt: "2026-05-06T00:00:00.000Z",
      updatedAt: "2026-05-06T00:00:00.000Z",
      lastExportedAt: null,
      lastImportedAt: null
    },
    operationLog: [],
    exercises: [
      { id: "bench", name: "Bench Press", primaryMuscle: "Chest", secondaryMuscles: ["Triceps"], equipment: "Barbell", movementPattern: "Press", isUnilateral: false, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z", ...sync }
    ],
    templates: [],
    templateExercises: [],
    trainingBlocks: [],
    personalRecords: [
      { id: "baseline", exerciseId: "bench", workoutSessionId: "session", setLogId: "set", type: "max_weight", value: 225, unit: "lbs", importance: "baseline", achievedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...sync },
      { id: "major", exerciseId: "bench", workoutSessionId: "session", setLogId: "set", type: "estimated_1rm", value: 263, unit: "lbs", importance: "major", achievedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...sync },
      { id: "medium", exerciseId: "bench", workoutSessionId: "session", setLogId: "set", type: "best_set", value: 1125, unit: "lbs", importance: "medium", achievedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...sync },
      { id: "small", exerciseId: "bench", workoutSessionId: "session", setLogId: "set", type: "reps_at_weight", value: 6, unit: "reps", importance: "small", achievedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...sync }
    ],
    sessions: [
      { id: "session", name: "Upper", workoutTemplateId: null, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...sync },
      { id: "old-session", name: "Old", workoutTemplateId: null, startedAt: "2024-01-01T10:00:00.000Z", finishedAt: "2024-01-01T11:00:00.000Z", createdAt: "2024-01-01T10:00:00.000Z", updatedAt: "2024-01-01T11:00:00.000Z", ...sync }
    ],
    sessionExercises: [
      { id: "row", workoutSessionId: "session", exerciseId: "bench", orderIndex: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...sync },
      { id: "old-row", workoutSessionId: "old-session", exerciseId: "bench", orderIndex: 0, createdAt: "2024-01-01T10:01:00.000Z", updatedAt: "2024-01-01T10:01:00.000Z", ...sync }
    ],
    setLogs: [
      { id: "set", workoutSessionExerciseId: "row", setNumber: 1, weight: 225, reps: 5, rpe: 8, setType: "working", isCompleted: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...sync },
      { id: "old-set", workoutSessionExerciseId: "old-row", setNumber: 1, weight: 95, reps: 5, rpe: 7, setType: "working", isCompleted: true, createdAt: "2024-01-01T10:05:00.000Z", updatedAt: "2024-01-01T10:05:00.000Z", ...sync }
    ]
  };
}
