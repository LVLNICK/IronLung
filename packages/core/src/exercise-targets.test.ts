import { describe, expect, it } from "vitest";
import { inferExerciseTargetProfile } from "./exercise-targets";

const importedExerciseNames = [
  "21s (EZ Bar)",
  "Alternating Dumbbell Curl",
  "Back Extension (Weighted)",
  "Behind-the-Neck Push Press",
  "Bench Press (Barbell)",
  "Bench Press (Close Grip)",
  "Bent Over Row (Barbell)",
  "Bicep Curl (Barbell)",
  "Bicep Curl (Cable)",
  "Bulgarian Split Squat (Barbell)",
  "Bulgarian Split Squat (Dumbbell)",
  "Cable Crossover",
  "Chest Fly (Cable)",
  "Chest Fly (Dumbbell)",
  "Chest Fly (Machine)",
  "Chest Press (Machine)",
  "Chest Supported Row (Machine)",
  "Concentration Curl",
  "Dip (Weighted)",
  "Dips",
  "Face Pull",
  "French Press",
  "Front Raise",
  "Hack Squat",
  "Hammer Curl",
  "Hammer Curl (Dumbbell)",
  "Hamstring Curl",
  "High Row",
  "Hip Thrust (Barbell)",
  "Incline Bench Press (Barbell)",
  "Incline Bench Press (Dumbbell)",
  "Incline Chest Press (Machine)",
  "Incline Curl (Dumbbell)",
  "JM Press",
  "Lat Pulldown",
  "Lat Pulldown (Neutral Grip)",
  "Lat Pulldown (Single Arm)",
  "Lateral Raise (Dumbbell)",
  "Leg Extension",
  "Leg Press",
  "Leg Press (45 Degrees)",
  "Lying Leg Curl",
  "One Arm Lateral Raise (Cable)",
  "Overhead Extension (Dumbbell)",
  "Overhead Tricep Extension (Cable)",
  "Preacher Curl (Barbell)",
  "Pull-Up (Weighted)",
  "Pullover (Dumbbell)",
  "Rear Delt Fly (Cable)",
  "Rear Delt Fly (Machine)",
  "Romanian Deadlift (Barbell)",
  "Romanian Deadlift (Dumbbell)",
  "Seated Calf Raise",
  "Seated Dip (Machine)",
  "Seated Hamstring Curl",
  "Seated Military Press (Barbell)",
  "Seated Row (Cable)",
  "Seated Shoulder Press (Dumbbell)",
  "Seated Wide-Grip Row (Cable)",
  "Shoulder Press (Dumbbell)",
  "Shoulder Press (Machine)",
  "Single Arm Iso Row",
  "Single Arm Row (Dumbbell)",
  "Single Leg Press",
  "Skull Crusher",
  "Squat (Barbell)",
  "Standing Calf Raise",
  "Stiff Leg Deadlift",
  "Tricep Rope Push Down (Cable)",
  "Upright Row (Barbell)",
  "V-Handle Tricep Pushdown (Cable)",
  "Walking Lunge (Dumbbell)"
];

describe("exercise target inference", () => {
  it("maps barbell bench press to detailed chest press targets", () => {
    const profile = inferExerciseTargetProfile("Bench Press (Barbell)");

    expect(profile.primaryMuscle).toBe("Pectoralis major");
    expect(profile.equipment).toBe("Barbell");
    expect(profile.secondaryMuscles).toContain("Anterior deltoids - major secondary mover");
    expect(profile.secondaryMuscles).toContain("Triceps brachii - pressing/lockout");
    expect(profile.secondaryMuscles).toContain("Serratus anterior - shoulder blade control/stability");
    expect(profile.secondaryMuscles).toContain("Lats - stabilization and bar control");
    expect(profile.secondaryMuscles).toContain("Quads - leg drive");
    expect(profile.notes).toContain("Pectoralis major - main mover");
  });

  it("covers every exercise currently imported from Boostcamp", () => {
    for (const name of importedExerciseNames) {
      const profile = inferExerciseTargetProfile(name);
      expect(profile.primaryMuscle, name).not.toBe("Full body");
      expect(profile.secondaryMuscles.length, name).toBeGreaterThan(0);
      expect(profile.movementPattern, name).not.toBe("General strength");
    }
  });
});
