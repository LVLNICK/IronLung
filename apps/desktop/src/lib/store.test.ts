import { describe, expect, it } from "vitest";
import { useIronLungStore } from "./store";
import type { ExerciseMapping, NormalizedWorkoutImport } from "@ironlung/core";

describe("IronLung import store", () => {
  it("replays imported workouts chronologically before calculating PRs", () => {
    useIronLungStore.getState().clearAllData();

    const normalized: NormalizedWorkoutImport = {
      source: "boostcamp",
      format: "json",
      unknownFields: [],
      skippedRows: [],
      warnings: [],
      workouts: [
        {
          name: "New workout",
          startedAt: "2026-05-03T12:00:00.000Z",
          finishedAt: "2026-05-03T12:45:00.000Z",
          importedMetadataJson: {},
          exercises: [
            {
              exerciseName: "Bench Press",
              importedMetadataJson: {},
              sets: [
                {
                  setNumber: 1,
                  weight: 150,
                  reps: 5,
                  unit: "lbs",
                  importHash: "new-bench-150x5",
                  importedMetadataJson: {}
                }
              ]
            }
          ]
        },
        {
          name: "Old workout",
          startedAt: "2024-02-19T12:00:00.000Z",
          finishedAt: "2024-02-19T12:45:00.000Z",
          importedMetadataJson: {},
          exercises: [
            {
              exerciseName: "Bench Press",
              importedMetadataJson: {},
              sets: [
                {
                  setNumber: 1,
                  weight: 100,
                  reps: 5,
                  unit: "lbs",
                  importHash: "old-bench-100x5",
                  importedMetadataJson: {}
                }
              ]
            }
          ]
        }
      ]
    };
    const mappings: ExerciseMapping[] = [{ importedName: "Bench Press", action: "create", exerciseName: "Bench Press" }];

    useIronLungStore.getState().importNormalizedWorkouts(normalized, mappings, "lbs");

    const records = useIronLungStore.getState().personalRecords;
    expect(records[0].achievedAt).toBe("2024-02-19T12:00:00.000Z");
    expect(records.some((record) => record.achievedAt === "2026-05-03T12:00:00.000Z")).toBe(true);
  });
});
