import { describe, expect, it } from "vitest";
import { detectPersonalRecords, type Exercise, type SetLog } from "..";
import { BoostcampCsvImporter, parseCsv } from "./csv";
import { BoostcampJsonImporter, parseJsonLike } from "./json";
import { stableImportHash } from "./hash";
import { buildImportPreview, convertWeight, createDefaultExerciseMappings } from "./types";

describe("Boostcamp importers", () => {
  it("parses flexible CSV columns", () => {
    const csv = [
      "performedAt,sessionName,movement,load,repetitions,set_index,notes,extra",
      "2026-01-01,Pull Day,Lat Pulldown,120,10,1,good set,ignored"
    ].join("\n");
    const result = new BoostcampCsvImporter().parse(csv, { unit: "lbs" });

    expect(result.workouts).toHaveLength(1);
    expect(result.workouts[0].name).toBe("Pull Day");
    expect(result.workouts[0].exercises[0].exerciseName).toBe("Lat Pulldown");
    expect(result.workouts[0].exercises[0].sets[0]).toMatchObject({ weight: 120, reps: 10, setNumber: 1, unit: "lbs" });
    expect(result.unknownFields).toContain("extra");
  });

  it("handles quoted CSV cells", () => {
    const rows = parseCsv('date,exercise,reps,weight,notes\n"2026-01-01","Bench, Press",5,225,"paused, clean"');
    expect(rows[0].exercise).toBe("Bench, Press");
    expect(rows[0].notes).toBe("paused, clean");
  });

  it("recursively parses nested JSON workout structures", () => {
    const json = JSON.stringify({
      workouts: [
        {
          workoutName: "Upper",
          startedAt: "2026-01-02T10:00:00.000Z",
          exercises: [
            {
              exerciseName: "Bench Press",
              sets: [{ setNumber: 1, weight: 225, reps: 5, rpe: 8 }]
            }
          ]
        }
      ]
    });
    const result = new BoostcampJsonImporter().parse(json, { unit: "lbs" });

    expect(result.workouts[0].name).toBe("Upper");
    expect(result.workouts[0].exercises[0].sets[0].importHash).toMatch(/^imp_/);
  });

  it("accepts Python repr-like output from local MCP tools", () => {
    const payload = "{'workouts': [{'workoutName': 'Upper', 'startedAt': '2026-01-02T10:00:00.000Z', 'exercises': [{'exerciseName': 'Bench Press', 'sets': [{'setNumber': 1, 'weight': 225, 'reps': 5, 'rpe': None}]}]}]}";
    const parsed = parseJsonLike(payload) as { workouts: unknown[] };
    expect(parsed.workouts).toHaveLength(1);

    const result = new BoostcampJsonImporter().parse(payload, { unit: "lbs" });
    expect(result.workouts[0].exercises[0].sets[0].rpe).toBeNull();
  });

  it("parses native Boostcamp training-history export shape", () => {
    const payload = JSON.stringify({
      data: {
        "2026-05-03": [
          {
            id: "workout-1",
            finished_at: "2026-05-03T14:00:00.000Z",
            title: "Week 1 Day 1",
            records: [
              {
                name: "Seated Military Press (Barbell)",
                sets: [
                  { value: "95", amount: "12", weight_unit: "lbs", intensity: 7, skipped: false },
                  { value: "", amount: "10", archived_weight: 100, archived_reps: 9, weight_unit: "lbs", intensity: 7, skipped: false },
                  { value: "105", amount: "8", weight_unit: "lbs", skipped: true }
                ]
              }
            ]
          }
        ]
      }
    });
    const result = new BoostcampJsonImporter().parse(payload, { unit: "lbs" });

    expect(result.workouts).toHaveLength(1);
    expect(result.workouts[0].exercises[0].sets).toHaveLength(2);
    expect(result.workouts[0].exercises[0].sets[1].weight).toBe(100);
    expect(result.workouts[0].exercises[0].sets[1].reps).toBe(9);
    expect(result.skippedRows[0].reason).toContain("skipped");
  });

  it("prefers native Boostcamp archived weights when visible set values are blank", () => {
    const payload = JSON.stringify({
      data: {
        "2026-05-06": [
          {
            finished_at: "2026-05-06 10:46:53",
            title: "Week 1 Day 4",
            records: [
              {
                name: "Bench Press (Barbell)",
                sets: [
                  { value: "", amount: "12", archived_weight: 135, archived_reps: 12, weight_unit: "lbs", skipped: false },
                  { value: "", amount: "10", archived_weight: 185, archived_reps: 10, weight_unit: "lbs", skipped: false },
                  { value: "", amount: "8", archived_weight: 205, archived_reps: 8, weight_unit: "lbs", skipped: false },
                  { value: "", amount: "5", archived_weight: 225, archived_reps: 3, weight_unit: "lbs", skipped: false },
                  { value: "135", amount: "12", archived_weight: 135, archived_reps: 12, weight_unit: "lbs", skipped: false }
                ]
              }
            ]
          }
        ]
      }
    });

    const result = new BoostcampJsonImporter().parse(payload, { unit: "lbs" });
    const sets = result.workouts[0].exercises[0].sets;

    expect(sets.map((set) => set.weight)).toEqual([135, 185, 205, 225, 135]);
    expect(sets.map((set) => set.reps)).toEqual([12, 10, 8, 3, 12]);
  });

  it("detects duplicate hashes in preview", () => {
    const hash = stableImportHash({
      source: "boostcamp",
      workoutDate: "2026-01-01T00:00:00.000Z",
      exerciseName: "Squat",
      setNumber: 1,
      weight: 315,
      reps: 3,
      notes: "",
      unit: "lbs"
    });
    const csv = "date,exercise,weight,reps,setNumber\n2026-01-01,Squat,315,3,1";
    const result = new BoostcampCsvImporter().parse(csv, { unit: "lbs" });
    const preview = buildImportPreview(result, [], [hash]);

    expect(preview.duplicateSetHashes).toContain(hash);
  });

  it("matches similar exercise names and converts units", () => {
    const exercises: Exercise[] = [{
      id: "bench",
      name: "Barbell Bench Press",
      primaryMuscle: "Chest",
      secondaryMuscles: [],
      equipment: "Barbell",
      movementPattern: "Horizontal Push",
      isUnilateral: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    }];
    const mappings = createDefaultExerciseMappings(["Bench Press"], exercises);
    expect(mappings[0].action).toBe("map");
    expect(convertWeight(100, "kg", "lbs")).toBe(220.46);
  });

  it("PR recalculation works on imported set sequence", () => {
    const oldSet = set("old", 200, 5);
    const newSet = set("new", 225, 5);
    const records = detectPersonalRecords({
      exerciseId: "bench",
      workoutSessionId: "imported",
      achievedAt: "2026-01-02T00:00:00.000Z",
      unit: "lbs",
      newSet,
      sessionSetsForExercise: [newSet],
      historicalSetsForExercise: [oldSet],
      historicalSessionVolumesForExercise: [1000]
    });

    expect(records.map((record) => record.type)).toContain("max_weight");
    expect(records.map((record) => record.type)).toContain("estimated_1rm");
  });
});

function set(id: string, weight: number, reps: number): SetLog {
  return {
    id,
    workoutSessionExerciseId: "wse",
    setNumber: 1,
    weight,
    reps,
    setType: "working",
    isCompleted: true,
    createdAt: "2026-01-01T00:00:00.000Z"
  };
}
