import { describe, expect, it } from "vitest";
import { classifyImportance, detectPersonalRecords } from "./pr";
import type { SetLog } from "./types";

describe("PR detection", () => {
  it("detects max weight, one rep max, session volume, reps at weight, and set volume records", () => {
    const newSet = set("new", 225, 6);
    const records = detectPersonalRecords({
      exerciseId: "bench",
      workoutSessionId: "session",
      achievedAt: "2026-05-05T12:00:00.000Z",
      unit: "lbs",
      newSet,
      sessionSetsForExercise: [newSet, set("second", 185, 8)],
      historicalSetsForExercise: [set("old", 205, 5), set("old-reps", 225, 4)],
      historicalSessionVolumesForExercise: [1800]
    });

    expect(records.map((record) => record.type)).toEqual([
      "estimated_1rm",
      "session_volume",
      "reps_at_weight",
      "best_set"
    ]);
    expect(records.every((record) => record.importance === "major")).toBe(true);
  });

  it("marks first-ever records as baseline instead of major PRs", () => {
    const records = detectPersonalRecords({
      exerciseId: "bench",
      workoutSessionId: "session",
      achievedAt: "2026-05-05T12:00:00.000Z",
      unit: "lbs",
      newSet: set("new", 135, 8),
      sessionSetsForExercise: [set("new", 135, 8)],
      historicalSetsForExercise: [],
      historicalSessionVolumesForExercise: []
    });

    expect(records.length).toBeGreaterThan(0);
    expect(records.every((record) => record.importance === "baseline")).toBe(true);
  });

  it("classifies small, medium, and major improvements", () => {
    expect(classifyImportance(101, 100)).toBe("small");
    expect(classifyImportance(103, 100)).toBe("medium");
    expect(classifyImportance(106, 100)).toBe("major");
  });
});

function set(id: string, weight: number, reps: number): SetLog {
  return {
    id,
    workoutSessionExerciseId: "wse",
    setNumber: 1,
    weight,
    reps,
    rpe: 8,
    setType: "working",
    isCompleted: true,
    createdAt: "2026-05-05T12:00:00.000Z"
  };
}
