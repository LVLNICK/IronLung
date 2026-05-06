import { describe, expect, it } from "vitest";
import {
  buildTrainingAnalytics,
  detectWeakPoints,
  filterDatasetByRange,
  generateFatigueFlags,
  muscleBalanceScore,
  resolveDateRange,
  type AnalyticsDataset
} from "./index";

function fixture(): AnalyticsDataset {
  return {
    exercises: [
      {
        id: "bench",
        name: "Bench Press",
        primaryMuscle: "Pectoralis major",
        secondaryMuscles: ["Anterior deltoids", "Triceps brachii"],
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
        secondaryMuscles: ["Rhomboids", "Biceps brachii"],
        equipment: "Cable",
        movementPattern: "Horizontal pull/row",
        isUnilateral: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    ],
    sessions: [
      { id: "s1", name: "Push", startedAt: "2026-01-01T12:00:00.000Z", finishedAt: "2026-01-01T13:00:00.000Z", createdAt: "2026-01-01T12:00:00.000Z", updatedAt: "2026-01-01T13:00:00.000Z" },
      { id: "s2", name: "Push", trainingBlockId: "block-1", startedAt: "2026-01-08T12:00:00.000Z", finishedAt: "2026-01-08T13:00:00.000Z", createdAt: "2026-01-08T12:00:00.000Z", updatedAt: "2026-01-08T13:00:00.000Z" },
      { id: "s3", name: "Pull", startedAt: "2026-01-09T12:00:00.000Z", finishedAt: "2026-01-09T13:00:00.000Z", createdAt: "2026-01-09T12:00:00.000Z", updatedAt: "2026-01-09T13:00:00.000Z" }
    ],
    sessionExercises: [
      { id: "r1", workoutSessionId: "s1", exerciseId: "bench", orderIndex: 0 },
      { id: "r2", workoutSessionId: "s2", exerciseId: "bench", orderIndex: 0 },
      { id: "r3", workoutSessionId: "s3", exerciseId: "row", orderIndex: 0 }
    ],
    setLogs: [
      { id: "set1", workoutSessionExerciseId: "r1", setNumber: 1, weight: 200, reps: 5, rpe: 8, setType: "working", isCompleted: true, createdAt: "2026-01-01T12:05:00.000Z" },
      { id: "set2", workoutSessionExerciseId: "r2", setNumber: 1, weight: 220, reps: 5, rpe: 9.5, setType: "working", isCompleted: true, createdAt: "2026-01-08T12:05:00.000Z" },
      { id: "set3", workoutSessionExerciseId: "r3", setNumber: 1, weight: 80, reps: 8, rpe: 8, setType: "working", isCompleted: true, createdAt: "2026-01-09T12:05:00.000Z" }
    ],
    personalRecords: [
      { id: "pr1", exerciseId: "bench", workoutSessionId: "s2", setLogId: "set2", type: "estimated_1rm", value: 257, unit: "lbs", achievedAt: "2026-01-08T12:05:00.000Z" }
    ],
    trainingGoal: "strength",
    currentTrainingBlockId: "block-1",
    trainingBlocks: [
      { id: "block-1", name: "Bench Focus", goal: "strength", startedAt: "2026-01-08T00:00:00.000Z", createdAt: "2026-01-08T00:00:00.000Z", updatedAt: "2026-01-08T00:00:00.000Z" }
    ]
  };
}

describe("core analytics engine", () => {
  it("filters date ranges and compares periods", () => {
    const data = fixture();
    const range = resolveDateRange(data.sessions, "7d", new Date("2026-01-09T12:00:00.000Z"));
    const filtered = filterDatasetByRange(data, range);

    expect(filtered.sessions.map((session) => session.id)).toEqual(["s2", "s3"]);
    expect(filtered.setLogs).toHaveLength(2);
  });

  it("builds balance scores, weak points, fatigue, and insights", () => {
    const summary = buildTrainingAnalytics(fixture(), "all", new Date("2026-01-09T12:00:00.000Z"));

    expect(summary.totals.volume).toBe(2740);
    expect(summary.exerciseMetrics.find((exercise) => exercise.name === "Bench Press")?.estimatedOneRepMax).toBeGreaterThan(250);
    expect(summary.prGroups[0].type).toBe("estimated_1rm");
    expect(summary.muscleVolume.find((row) => row.muscle === "Pectoralis major")?.volume).toBe(1155);
    expect(summary.balance.overall).toBeGreaterThanOrEqual(0);
    expect(summary.trainingGoal).toBe("strength");
    expect(summary.currentBlock?.name).toBe("Bench Focus");
    expect(summary.insights.length).toBeGreaterThan(0);
  });

  it("formats fatigue flag related set counts without decimal noise", () => {
    const data = fixture();
    const heavyRecentData: AnalyticsDataset = {
      ...data,
      setLogs: Array.from({ length: 30 }, (_, index) => ({
        id: `heavy-${index}`,
        workoutSessionExerciseId: "r2",
        setNumber: index + 1,
        weight: 220,
        reps: 5,
        rpe: 9,
        setType: "working",
        isCompleted: true,
        createdAt: "2026-01-08T12:05:00.000Z"
      }))
    };
    const flags = generateFatigueFlags(heavyRecentData, new Date("2026-01-09T12:00:00.000Z"));

    expect(flags.length).toBeGreaterThan(0);
    expect(flags.every((flag) => !/\d+\.\d/.test(flag.detail))).toBe(true);
  });

  it("detects imbalance weak points deterministically", () => {
    const balance = muscleBalanceScore([
      { muscle: "Pectoralis major", volume: 10000, sets: 10, exercises: 1, prs: 0, lastTrained: null },
      { muscle: "Latissimus dorsi", volume: 100, sets: 1, exercises: 1, prs: 0, lastTrained: null },
      { muscle: "Quads", volume: 6000, sets: 10, exercises: 1, prs: 0, lastTrained: null },
      { muscle: "Hamstrings", volume: 100, sets: 1, exercises: 1, prs: 0, lastTrained: null }
    ]);
    const weak = detectWeakPoints({ muscles: [], exercises: [], balance });

    expect(balance.pushPull).toBeLessThan(70);
    expect(weak.some((item) => item.id === "balance-push-pull")).toBe(true);
  });
});
