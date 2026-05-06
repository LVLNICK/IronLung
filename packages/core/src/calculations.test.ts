import { describe, expect, it } from "vitest";
import {
  estimatedOneRepMax,
  exerciseSessionVolume,
  maxCompletedWeight,
  maxRepsAtWeight,
  muscleGroupVolume,
  setVolume,
  weeklyVolume,
  workoutSessionVolume
} from "./calculations";
import type { Exercise, SetLog, WorkoutSession } from "./types";

const set = (weight: number, reps: number, id = crypto.randomUUID()): SetLog => ({
  id,
  workoutSessionExerciseId: "wse",
  setNumber: 1,
  weight,
  reps,
  rpe: 8,
  setType: "working",
  isCompleted: true,
  createdAt: "2026-05-05T12:00:00.000Z"
});

describe("fitness calculations", () => {
  it("calculates set volume and Epley estimated 1RM", () => {
    expect(setVolume(225, 5)).toBe(1125);
    expect(estimatedOneRepMax(225, 5)).toBe(262.5);
  });

  it("calculates exercise and workout volume", () => {
    const sets = [set(100, 10), set(120, 8)];
    expect(exerciseSessionVolume(sets)).toBe(1960);
    expect(workoutSessionVolume([sets, [set(50, 12)]])).toBe(2560);
  });

  it("finds max weight and reps at a specific weight", () => {
    const sets = [set(185, 5), set(205, 3), set(185, 8)];
    expect(maxCompletedWeight(sets)).toBe(205);
    expect(maxRepsAtWeight(sets, 185)).toBe(8);
  });

  it("groups weekly volume", () => {
    const sessions: WorkoutSession[] = [
      session("a", "2026-05-04T10:00:00.000Z"),
      session("b", "2026-05-10T10:00:00.000Z")
    ];
    expect(weeklyVolume(sessions, { a: [[set(100, 5)]], b: [[set(50, 10)]] })).toEqual([
      { weekStart: "2026-05-04", volume: 1000 }
    ]);
  });

  it("calculates muscle group volume", () => {
    const exercises: Exercise[] = [exercise("bench", "Chest"), exercise("row", "Back")];
    expect(muscleGroupVolume(exercises, { bench: [set(100, 10)], row: [set(90, 10)] })).toEqual([
      { muscle: "Chest", volume: 1000 },
      { muscle: "Back", volume: 900 }
    ]);
  });
});

function session(id: string, startedAt: string): WorkoutSession {
  return { id, name: id, startedAt, createdAt: startedAt, updatedAt: startedAt };
}

function exercise(id: string, primaryMuscle: string): Exercise {
  return {
    id,
    name: id,
    primaryMuscle,
    secondaryMuscles: [],
    equipment: "Barbell",
    movementPattern: "Push",
    isUnilateral: false,
    createdAt: "2026-05-05T12:00:00.000Z",
    updatedAt: "2026-05-05T12:00:00.000Z"
  };
}
