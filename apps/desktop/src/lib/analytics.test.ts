import { describe, expect, it } from "vitest";
import { buildAnalyticsSnapshot, buildDailyMetrics } from "./analytics";

describe("analytics aggregation", () => {
  it("returns every calendar day between first and last workout", () => {
    const daily = buildDailyMetrics(
      [
        {
          id: "session-1",
          name: "First",
          startedAt: "2026-01-01T12:00:00.000Z",
          finishedAt: "2026-01-01T13:00:00.000Z",
          createdAt: "2026-01-01T12:00:00.000Z",
          updatedAt: "2026-01-01T13:00:00.000Z"
        },
        {
          id: "session-2",
          name: "Second",
          startedAt: "2026-01-03T12:00:00.000Z",
          finishedAt: "2026-01-03T13:00:00.000Z",
          createdAt: "2026-01-03T12:00:00.000Z",
          updatedAt: "2026-01-03T13:00:00.000Z"
        }
      ],
      [
        { id: "row-1", workoutSessionId: "session-1", exerciseId: "bench", orderIndex: 0 },
        { id: "row-2", workoutSessionId: "session-2", exerciseId: "bench", orderIndex: 0 }
      ],
      [
        {
          id: "set-1",
          workoutSessionExerciseId: "row-1",
          setNumber: 1,
          weight: 100,
          reps: 5,
          rpe: 8,
          setType: "working",
          isCompleted: true,
          createdAt: "2026-01-01T12:05:00.000Z"
        },
        {
          id: "set-2",
          workoutSessionExerciseId: "row-2",
          setNumber: 1,
          weight: 110,
          reps: 5,
          rpe: 9,
          setType: "working",
          isCompleted: true,
          createdAt: "2026-01-03T12:05:00.000Z"
        }
      ],
      []
    );

    expect(daily.map((day) => day.date)).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
    expect(daily[1].active).toBe(false);
    expect(daily[0].volume).toBe(500);
    expect(daily[2].volume).toBe(550);
  });

  it("builds muscle heat and weak-point findings from exercise targets", () => {
    const snapshot = buildAnalyticsSnapshot({
      exercises: [
        {
          id: "bench",
          name: "Bench Press",
          primaryMuscle: "Pectoralis major",
          secondaryMuscles: ["Anterior deltoids - major secondary mover", "Triceps brachii - pressing/lockout"],
          equipment: "Barbell",
          movementPattern: "Horizontal press",
          isUnilateral: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z"
        },
        {
          id: "row",
          name: "Row",
          primaryMuscle: "Latissimus dorsi",
          secondaryMuscles: ["Rhomboids"],
          equipment: "Cable",
          movementPattern: "Horizontal pull/row",
          isUnilateral: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z"
        }
      ],
      sessions: [
        {
          id: "session-1",
          name: "Push",
          startedAt: "2026-01-01T12:00:00.000Z",
          finishedAt: "2026-01-01T13:00:00.000Z",
          createdAt: "2026-01-01T12:00:00.000Z",
          updatedAt: "2026-01-01T13:00:00.000Z"
        },
        {
          id: "session-2",
          name: "Push",
          startedAt: "2026-01-08T12:00:00.000Z",
          finishedAt: "2026-01-08T13:00:00.000Z",
          createdAt: "2026-01-08T12:00:00.000Z",
          updatedAt: "2026-01-08T13:00:00.000Z"
        }
      ],
      sessionExercises: [
        { id: "bench-row-1", workoutSessionId: "session-1", exerciseId: "bench", orderIndex: 0 },
        { id: "bench-row-2", workoutSessionId: "session-2", exerciseId: "bench", orderIndex: 0 },
        { id: "pull-row-1", workoutSessionId: "session-1", exerciseId: "row", orderIndex: 1 }
      ],
      setLogs: [
        { id: "set-1", workoutSessionExerciseId: "bench-row-1", setNumber: 1, weight: 200, reps: 5, rpe: 8, setType: "working", isCompleted: true, createdAt: "2026-01-01T12:05:00.000Z" },
        { id: "set-2", workoutSessionExerciseId: "bench-row-2", setNumber: 1, weight: 220, reps: 5, rpe: 8, setType: "working", isCompleted: true, createdAt: "2026-01-08T12:05:00.000Z" },
        { id: "set-3", workoutSessionExerciseId: "pull-row-1", setNumber: 1, weight: 20, reps: 5, rpe: 8, setType: "working", isCompleted: true, createdAt: "2026-01-01T12:20:00.000Z" }
      ],
      personalRecords: [],
      photos: [],
      analyses: []
    });

    expect(snapshot.muscleHeatStats.find((row) => row.muscle === "Pectoralis major")?.totalExposure).toBeGreaterThan(0);
    expect(snapshot.muscleHeatStats.find((row) => row.muscle === "Triceps brachii")?.secondaryVolume).toBeGreaterThan(0);
    expect(snapshot.weakPointFindings.some((finding) => finding.title.includes("Pressing is outpacing pulling"))).toBe(true);
  });
});
