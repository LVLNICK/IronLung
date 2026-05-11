import { describe, expect, it } from "vitest";
import { clearAllMobileData, putInStore } from "./mobileDb";
import { addSetToActiveMobileWorkout, discardActiveMobileWorkout, finishActiveMobileWorkout, loadMobileSnapshot, setMobileSetCompleted } from "./mobileRepository";
import type { MobileExercise, MobileSettings } from "./mobileSyncTypes";

describe("mobile workout repository", () => {
  it("saves active workout sets locally and lets sets be toggled", async () => {
    await clearAllMobileData();
    await putInStore("settings", settings());
    await putInStore("exercises", exercise());

    const first = await addSetToActiveMobileWorkout(settings(), { exerciseId: "bench", weight: 225, reps: 5, rpe: 8 });

    expect(first.snapshot.sessions).toHaveLength(1);
    expect(first.snapshot.sessionExercises).toHaveLength(1);
    expect(first.snapshot.setLogs).toHaveLength(1);
    expect(first.snapshot.setLogs[0]).toMatchObject({ weight: 225, reps: 5, isCompleted: true });

    const toggled = await setMobileSetCompleted(settings(), first.setLog.id, false);
    expect(toggled.setLogs.find((set) => set.id === first.setLog.id)?.isCompleted).toBe(false);

    const finished = await finishActiveMobileWorkout(settings());
    expect(finished.sessions[0].finishedAt).toBeTruthy();

    const persisted = await loadMobileSnapshot();
    expect(persisted.setLogs).toHaveLength(1);
    expect(persisted.sessions[0].finishedAt).toBeTruthy();
  });

  it("discards an accidental active workout without deleting imported exercise data", async () => {
    await clearAllMobileData();
    await putInStore("settings", settings());
    await putInStore("exercises", exercise());

    const first = await addSetToActiveMobileWorkout(settings(), { exerciseId: "bench", weight: 135, reps: 10, rpe: 7 });
    expect(first.snapshot.sessions.filter((session) => !session.deletedAt && !session.finishedAt)).toHaveLength(1);

    const discarded = await discardActiveMobileWorkout(settings());
    expect(discarded.exercises.filter((item) => !item.deletedAt)).toHaveLength(1);
    expect(discarded.sessions.filter((session) => !session.deletedAt && !session.finishedAt)).toHaveLength(0);
    expect(discarded.setLogs.filter((set) => !set.deletedAt)).toHaveLength(0);

    const next = await addSetToActiveMobileWorkout(settings(), { exerciseId: "bench", weight: 185, reps: 5, rpe: 8 });
    expect(next.snapshot.sessions.filter((session) => !session.deletedAt && !session.finishedAt)).toHaveLength(1);
    expect(next.snapshot.setLogs.filter((set) => !set.deletedAt)).toHaveLength(1);
  });
});

function settings(): MobileSettings {
  return {
    id: "settings",
    unitPreference: "lbs",
    deviceId: "phone",
    deviceName: "Phone",
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
    lastExportedAt: null,
    lastImportedAt: null
  };
}

function exercise(): MobileExercise {
  return {
    id: "bench",
    name: "Bench Press",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Triceps"],
    equipment: "Barbell",
    movementPattern: "Press",
    isUnilateral: false,
    createdAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
    deletedAt: null,
    originDeviceId: "desktop",
    lastModifiedDeviceId: "desktop",
    syncVersion: 1,
    importSource: "desktop-seed",
    mobileBatchId: null
  };
}
