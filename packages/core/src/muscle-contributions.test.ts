import { describe, expect, it } from "vitest";
import { distributedMuscleVolume, muscleContributionWarnings, resolveMuscleContributions } from "./muscle-contributions";
import type { Exercise } from "./types";

describe("muscle contribution model", () => {
  it("uses default weighted contributions for bench press", () => {
    const contributions = resolveMuscleContributions(exercise("Bench Press", "Chest", ["Triceps"]));

    expect(contributions).toContainEqual({ muscle: "Pectoralis major", percent: 0.55, role: "primary" });
    expect(contributions.find((item) => item.muscle === "Anterior deltoids")?.percent).toBe(0.2);
    expect(contributions.reduce((sum, item) => sum + item.percent, 0)).toBeCloseTo(1);
  });

  it("prefers incline press preset before the generic chest press preset", () => {
    const contributions = resolveMuscleContributions(exercise("Incline Chest Press", "Chest", ["Triceps"]));

    expect(contributions.find((item) => item.muscle === "Upper pectoralis major")?.percent).toBe(0.5);
  });

  it("distributes volume instead of duplicating it across muscles", () => {
    const volume = distributedMuscleVolume(exercise("Bench Press", "Chest", ["Triceps"]), 1000);

    expect(volume.find((item) => item.muscle === "Pectoralis major")?.volume).toBe(550);
    expect(volume.reduce((sum, item) => sum + item.volume, 0)).toBe(1000);
  });

  it("falls back safely for old imported exercises without contribution data", () => {
    const contributions = resolveMuscleContributions(exercise("Custom Press", "Chest", ["Shoulders", "Triceps"]));

    expect(contributions[0]).toEqual({ muscle: "Chest", percent: 0.65, role: "primary" });
    expect(contributions.reduce((sum, item) => sum + item.percent, 0)).toBeCloseTo(1);
  });

  it("covers common row, squat, deadlift, curl, and pulldown presets", () => {
    const cases = [
      ["Cable Row", "Latissimus dorsi"],
      ["Back Squat", "Quads"],
      ["Romanian Deadlift", "Hamstrings"],
      ["Dumbbell Curl", "Biceps brachii"],
      ["Lat Pulldown", "Latissimus dorsi"]
    ] as const;

    for (const [name, expectedMuscle] of cases) {
      const contributions = resolveMuscleContributions(exercise(name, "Other", []));
      expect(contributions.find((item) => item.muscle === expectedMuscle)?.percent).toBeGreaterThan(0);
      expect(contributions.reduce((sum, item) => sum + item.percent, 0)).toBeCloseTo(1);
    }
  });

  it("warns when custom contributions need normalization", () => {
    const custom = {
      ...exercise("Custom Lift", "Chest", []),
      muscleContributions: [
        { muscle: "Chest", percent: 70, role: "primary" as const },
        { muscle: "Triceps", percent: 30, role: "secondary" as const }
      ]
    };

    expect(muscleContributionWarnings(custom)[0]).toContain("normalizes");
    expect(resolveMuscleContributions(custom).reduce((sum, item) => sum + item.percent, 0)).toBeCloseTo(1);
  });
});

function exercise(name: string, primaryMuscle: string, secondaryMuscles: string[]): Exercise {
  return {
    id: name,
    name,
    primaryMuscle,
    secondaryMuscles,
    equipment: "Barbell",
    movementPattern: "Press",
    isUnilateral: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  };
}
