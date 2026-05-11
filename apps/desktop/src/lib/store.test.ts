import { describe, expect, it } from "vitest";
import { useIronLogStore } from "./store";
import type { ExerciseMapping, NormalizedWorkoutImport } from "@ironlog/core";

describe("IronLog import store", () => {
  it("replays imported workouts chronologically before calculating PRs", () => {
    useIronLogStore.getState().clearAllData();

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

    useIronLogStore.getState().importNormalizedWorkouts(normalized, mappings, "lbs");

    const records = useIronLogStore.getState().personalRecords;
    expect(records[0].achievedAt).toBe("2024-02-19T12:00:00.000Z");
    expect(records.some((record) => record.achievedAt === "2026-05-03T12:00:00.000Z")).toBe(true);
  });

  it("dedupes same-session PR types during import", () => {
    useIronLogStore.getState().clearAllData();

    const normalized: NormalizedWorkoutImport = {
      source: "boostcamp",
      format: "json",
      unknownFields: [],
      skippedRows: [],
      warnings: [],
      workouts: [
        {
          name: "Volume workout",
          startedAt: "2026-05-04T12:00:00.000Z",
          importedMetadataJson: {},
          exercises: [
            {
              exerciseName: "Bench Press",
              importedMetadataJson: {},
              sets: [
                { setNumber: 1, weight: 100, reps: 5, unit: "lbs", importHash: "bench-1", importedMetadataJson: {} },
                { setNumber: 2, weight: 100, reps: 6, unit: "lbs", importHash: "bench-2", importedMetadataJson: {} },
                { setNumber: 3, weight: 100, reps: 7, unit: "lbs", importHash: "bench-3", importedMetadataJson: {} }
              ]
            }
          ]
        }
      ]
    };

    useIronLogStore.getState().importNormalizedWorkouts(normalized, [{ importedName: "Bench Press", action: "create", exerciseName: "Bench Press" }], "lbs");

    const sessionRecords = useIronLogStore.getState().personalRecords.filter((record) => record.type === "session_volume");
    expect(sessionRecords).toHaveLength(1);
    expect(sessionRecords[0].value).toBe(1800);
  });

  it("prevents multiple active workouts and recalculates PRs after set deletion", () => {
    useIronLogStore.getState().clearAllData();
    const state = useIronLogStore.getState();
    const exercise = state.createExercise({ name: "Bench Press", primaryMuscle: "Chest", secondaryMuscles: [], equipment: "Barbell", movementPattern: "Press", isUnilateral: false });
    const first = state.startWorkout();
    const second = state.startWorkout();
    state.addExerciseToSession(first.id, exercise.id);
    const row = useIronLogStore.getState().sessionExercises.find((item) => item.workoutSessionId === first.id)!;

    useIronLogStore.getState().logSet({ workoutSessionExerciseId: row.id, exerciseId: exercise.id, workoutSessionId: first.id, weight: 100, reps: 5, setType: "working" });
    const prsBeforeDelete = useIronLogStore.getState().personalRecords.length;
    const setId = useIronLogStore.getState().setLogs[0].id;
    useIronLogStore.getState().deleteSet(setId);

    expect(first.id).toBe(second.id);
    expect(prsBeforeDelete).toBeGreaterThan(0);
    expect(useIronLogStore.getState().setLogs).toHaveLength(0);
    expect(useIronLogStore.getState().personalRecords).toHaveLength(0);
  });
});
