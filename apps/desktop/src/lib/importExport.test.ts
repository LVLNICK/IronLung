import { describe, expect, it } from "vitest";
import { createExport, validateImportPayload } from "./importExport";
import type { IronLungStateData } from "./store";

describe("IronLung JSON import/export", () => {
  it("round-trips settings, training blocks, workouts, PRs, and photo metadata", () => {
    const data: IronLungStateData = {
      unitPreference: "lbs",
      theme: "dark",
      trainingGoal: "powerbuilding",
      currentTrainingBlockId: "block-1",
      trainingBlocks: [
        { id: "block-1", name: "Bench Focus", goal: "strength", startedAt: "2026-05-01T00:00:00.000Z", endedAt: null, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z" }
      ],
      exercises: [
        { id: "bench", name: "Bench Press", primaryMuscle: "Chest", secondaryMuscles: ["Triceps"], equipment: "Barbell", movementPattern: "Press", isUnilateral: false, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z" }
      ],
      templates: [],
      templateExercises: [],
      sessions: [
        { id: "session", name: "Upper", workoutTemplateId: null, trainingBlockId: "block-1", startedAt: "2026-05-02T12:00:00.000Z", finishedAt: "2026-05-02T13:00:00.000Z", createdAt: "2026-05-02T12:00:00.000Z", updatedAt: "2026-05-02T13:00:00.000Z" }
      ],
      sessionExercises: [
        { id: "row", workoutSessionId: "session", exerciseId: "bench", orderIndex: 0 }
      ],
      setLogs: [
        { id: "set", workoutSessionExerciseId: "row", setNumber: 1, weight: 225, reps: 5, rpe: 8, setType: "working", isCompleted: true, createdAt: "2026-05-02T12:10:00.000Z" }
      ],
      personalRecords: [
        { id: "pr", exerciseId: "bench", workoutSessionId: "session", setLogId: "set", type: "max_weight", value: 225, unit: "lbs", importance: "baseline", achievedAt: "2026-05-02T12:10:00.000Z" }
      ],
      photos: [
        { id: "photo", imagePath: "local-photo.jpg", poseType: "front", bodyweight: 180, lightingTag: "same room", pumpTag: "no pump", capturedAt: "2026-05-02T08:00:00.000Z", createdAt: "2026-05-02T08:00:00.000Z" }
      ],
      analyses: []
    };

    const exported = createExport(data);
    const imported = validateImportPayload(JSON.stringify(exported));

    expect(imported.trainingGoal).toBe("powerbuilding");
    expect(imported.trainingBlocks[0].name).toBe("Bench Focus");
    expect(imported.sessions[0].trainingBlockId).toBe("block-1");
    expect(imported.personalRecords[0].importance).toBe("baseline");
    expect(imported.photos[0].poseType).toBe("front");
  });
});
