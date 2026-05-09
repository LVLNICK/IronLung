import { describe, expect, it } from "vitest";
import { buildDeterministicAnalystReport, buildPersonalRecommendations, buildStatisticalForecasts, buildTrainingIntelligence } from "./training-intelligence";
import type { AnalyticsDataset } from "./analytics";

function intelligenceFixture(): AnalyticsDataset {
  const sessions = Array.from({ length: 6 }, (_, index) => ({
    id: `s${index + 1}`,
    name: "Upper",
    startedAt: `2026-01-${String(index * 3 + 1).padStart(2, "0")}T12:00:00.000Z`,
    finishedAt: `2026-01-${String(index * 3 + 1).padStart(2, "0")}T13:00:00.000Z`,
    createdAt: `2026-01-${String(index * 3 + 1).padStart(2, "0")}T12:00:00.000Z`,
    updatedAt: `2026-01-${String(index * 3 + 1).padStart(2, "0")}T13:00:00.000Z`
  }));
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
        name: "Chest Supported Row",
        primaryMuscle: "Latissimus dorsi",
        secondaryMuscles: ["Rhomboids", "Biceps brachii"],
        equipment: "Machine",
        movementPattern: "Horizontal pull/row",
        isUnilateral: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    ],
    sessions,
    sessionExercises: sessions.flatMap((session, index) => [
      { id: `bench-row-${index + 1}`, workoutSessionId: session.id, exerciseId: "bench", orderIndex: 0 },
      { id: `row-row-${index + 1}`, workoutSessionId: session.id, exerciseId: "row", orderIndex: 1 }
    ]),
    setLogs: sessions.flatMap((session, index) => [
      {
        id: `bench-set-${index + 1}`,
        workoutSessionExerciseId: `bench-row-${index + 1}`,
        setNumber: 1,
        weight: 200 + index * 5,
        reps: 5,
        rpe: index >= 4 ? 9 : 8,
        setType: "working" as const,
        isCompleted: true,
        createdAt: session.startedAt
      },
      {
        id: `row-set-${index + 1}`,
        workoutSessionExerciseId: `row-row-${index + 1}`,
        setNumber: 1,
        weight: 100,
        reps: 8,
        rpe: 8,
        setType: "working" as const,
        isCompleted: true,
        createdAt: session.startedAt
      }
    ]),
    personalRecords: [
      { id: "pr1", exerciseId: "bench", workoutSessionId: "s6", setLogId: "bench-set-6", type: "estimated_1rm", value: 263, unit: "lbs", importance: "medium", achievedAt: "2026-01-16T12:00:00.000Z" }
    ],
    trainingGoal: "strength"
  };
}

describe("training intelligence", () => {
  it("builds deterministic report, statistical forecasts, and recommendations", () => {
    const intelligence = buildTrainingIntelligence(intelligenceFixture(), "all", new Date("2026-01-18T12:00:00.000Z"));

    expect(intelligence.analyst.readinessScore).toBeGreaterThanOrEqual(0);
    expect(intelligence.forecasts.some((forecast) => forecast.type === "next_e1rm" && forecast.targetName === "Bench Press")).toBe(true);
    expect(intelligence.forecasts.some((forecast) => forecast.type === "weekly_volume")).toBe(true);
    expect(intelligence.recommendations.length).toBeGreaterThan(0);
  });

  it("forecasts next e1RM with bounds from recent exercise trend", () => {
    const forecasts = buildStatisticalForecasts(intelligenceFixture());
    const bench = forecasts.find((forecast) => forecast.type === "next_e1rm" && forecast.targetName === "Bench Press");

    expect(bench?.value).toBeGreaterThan(260);
    expect(bench?.lowerBound).toBeLessThanOrEqual(bench?.value ?? 0);
    expect(bench?.upperBound).toBeGreaterThanOrEqual(bench?.value ?? 0);
    expect(bench?.confidence).toBeGreaterThan(40);
  });

  it("keeps recommendations explainable with evidence and actions", () => {
    const intelligence = buildTrainingIntelligence(intelligenceFixture(), "all", new Date("2026-01-18T12:00:00.000Z"));
    const recommendations = buildPersonalRecommendations(intelligence.summary, intelligence.forecasts, "strength");

    expect(recommendations.every((item) => item.evidence.length > 0)).toBe(true);
    expect(recommendations.every((item) => item.suggestedAction.length > 0)).toBe(true);
  });

  it("deterministic analyst reflects fatigue and weak point signals without model calls", () => {
    const intelligence = buildTrainingIntelligence(intelligenceFixture(), "all", new Date("2026-01-18T12:00:00.000Z"));
    const report = buildDeterministicAnalystReport(intelligence.summary, intelligence.forecasts);

    expect(report.focus.length).toBeGreaterThan(0);
    expect(report.weakPoint.length).toBeGreaterThan(0);
    expect(report.recoveryConcern.length).toBeGreaterThan(0);
  });
});
