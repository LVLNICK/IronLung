import { describe, expect, it } from "vitest";
import { createIronLungDatabase } from "./repository";

describe("SQLite repository", () => {
  it("runs migrations and stores snapshot data", async () => {
    const store = await createIronLungDatabase();
    store.upsert("exercise", {
      id: "bench",
      name: "Bench Press",
      primary_muscle: "Chest",
      secondary_muscles: "[]",
      equipment: "Barbell",
      movement_pattern: "Horizontal Push",
      is_unilateral: 0,
      notes: null,
      created_at: "2026-05-05T12:00:00.000Z",
      updated_at: "2026-05-05T12:00:00.000Z"
    });

    const snapshot = store.snapshot();
    expect(snapshot.user_settings[0].unit_preference).toBe("lbs");
    expect(snapshot.exercise[0].name).toBe("Bench Press");
  });
});
