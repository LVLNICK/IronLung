import { describe, expect, it } from "vitest";
import { detectPersonalRecords } from "./pr";
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
      "exercise_session_volume",
      "reps_at_weight",
      "workout_session_volume"
    ]);
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
