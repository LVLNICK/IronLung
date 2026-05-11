import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { useIronLogStore } from "./lib/store";

describe("IronLog desktop command center", () => {
  beforeEach(() => {
    useIronLogStore.getState().clearAllData();
  });

  it("renders the six-page navigation and preserves photo safety copy", async () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Command Center" })).toBeInTheDocument();

    for (const name of ["Command Center", "Train", "Exercises", "Analytics", "Photos", "Data & Settings"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }

    for (const oldName of ["Overview", "Daily Log", "Strength", "Volume", "Weak Points", "PRs", "Consistency", "Intensity", "Muscles", "Data", "Settings"]) {
      expect(screen.queryByRole("button", { name: oldName })).not.toBeInTheDocument();
    }

    await userEvent.click(screen.getByRole("button", { name: "Train" }));
    expect(screen.getByRole("heading", { name: "Train" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Analytics" }));
    expect(screen.getByRole("heading", { name: "Analytics" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Photos" }));
    expect(screen.getByText("This is an experimental progress metric. It is not a medical diagnosis, body-fat measurement, or attractiveness rating.")).toBeInTheDocument();
  });

  it("shows imported history in the training journal", async () => {
    useIronLogStore.getState().importData({
      unitPreference: "lbs",
      theme: "dark",
      trainingGoal: "general_fitness",
      currentTrainingBlockId: null,
      trainingBlocks: [],
      exercises: [{
        id: "ex-bench",
        name: "Bench Press",
        primaryMuscle: "Chest",
        secondaryMuscles: [],
        equipment: "Barbell",
        movementPattern: "Horizontal Push",
        isUnilateral: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }],
      templates: [],
      templateExercises: [],
      sessions: [{
        id: "session-1",
        workoutTemplateId: null,
        name: "Upper",
        startedAt: "2026-01-01T12:00:00.000Z",
        finishedAt: "2026-01-01T13:00:00.000Z",
        createdAt: "2026-01-01T12:00:00.000Z",
        updatedAt: "2026-01-01T13:00:00.000Z"
      }],
      sessionExercises: [{
        id: "session-ex-1",
        workoutSessionId: "session-1",
        exerciseId: "ex-bench",
        orderIndex: 0
      }],
      setLogs: [{
        id: "set-1",
        workoutSessionExerciseId: "session-ex-1",
        setNumber: 1,
        weight: 135,
        reps: 8,
        rpe: 8,
        setType: "working",
        isCompleted: true,
        createdAt: "2026-01-01T12:05:00.000Z"
      }],
      personalRecords: [{
        id: "pr-1",
        exerciseId: "ex-bench",
        workoutSessionId: "session-1",
        setLogId: "set-1",
        type: "estimated_1rm",
        value: 171,
        unit: "lbs",
        achievedAt: "2026-01-01T12:05:00.000Z"
      }],
      photos: [],
      analyses: []
    });

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Train" }));
    await userEvent.click(screen.getByRole("button", { name: "Training Journal" }));

    expect(screen.getAllByText(/Jan 1/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Upper").length).toBeGreaterThan(0);
  });

  it("keeps exercise search stable for imported exercises with missing metadata", async () => {
    useIronLogStore.getState().importData({
      unitPreference: "lbs",
      theme: "dark",
      trainingGoal: "general_fitness",
      currentTrainingBlockId: null,
      trainingBlocks: [],
      exercises: [{
        id: "ex-legacy",
        name: "Legacy Row",
        primaryMuscle: { legacy: "Back" },
        equipment: { legacy: "Cable" },
        movementPattern: null,
        isUnilateral: false,
        notes: { legacy: "do not render objects as React children" },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      } as any],
      templates: [],
      templateExercises: [],
      sessions: [{
        id: "session-legacy",
        workoutTemplateId: null,
        name: "Back Day",
        startedAt: "2026-01-02T12:00:00.000Z",
        finishedAt: "2026-01-02T13:00:00.000Z",
        createdAt: "2026-01-02T12:00:00.000Z",
        updatedAt: "2026-01-02T13:00:00.000Z"
      }],
      sessionExercises: [{
        id: "session-ex-legacy",
        workoutSessionId: "session-legacy",
        exerciseId: "ex-legacy",
        orderIndex: 0
      }],
      setLogs: [{
        id: "set-legacy",
        workoutSessionExerciseId: "session-ex-legacy",
        setNumber: 1,
        weight: 100,
        reps: 10,
        rpe: null,
        setType: "working",
        isCompleted: true,
        createdAt: "2026-01-02T12:05:00.000Z"
      }],
      personalRecords: [],
      photos: [],
      analyses: []
    });

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Exercises" }));
    await userEvent.type(screen.getByPlaceholderText("Search exercises"), "legacy");

    expect(screen.getAllByText("Legacy Row").length).toBeGreaterThan(0);
    expect(screen.getByText("No secondary muscles listed.")).toBeInTheDocument();
    expect(screen.getByText("No exercise notes yet.")).toBeInTheDocument();

    await userEvent.clear(screen.getByPlaceholderText("Search exercises"));
    await userEvent.type(screen.getByPlaceholderText("Search exercises"), "not real");

    expect(screen.getByText("No exercises match")).toBeInTheDocument();
  });

  it("keeps exercise search results visible after a second typed character", async () => {
    useIronLogStore.getState().importData({
      unitPreference: "lbs",
      theme: "dark",
      trainingGoal: "general_fitness",
      currentTrainingBlockId: null,
      trainingBlocks: [],
      exercises: [{
        id: "ex-bench",
        name: "Bench Press",
        primaryMuscle: "Pectoralis major",
        secondaryMuscles: ["Anterior deltoids", "Triceps brachii"],
        equipment: "Barbell",
        movementPattern: "Horizontal press",
        isUnilateral: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }],
      templates: [],
      templateExercises: [],
      sessions: [],
      sessionExercises: [],
      setLogs: [],
      personalRecords: [],
      photos: [],
      analyses: []
    });

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Exercises" }));
    await userEvent.type(screen.getByPlaceholderText("Search exercises"), "bp");

    expect(screen.getAllByText("Bench Press").length).toBeGreaterThan(0);
    expect(screen.queryByText("No exercises match")).not.toBeInTheDocument();
  });

  it("does not blank exercises search when matching an exercise with invalid imported PR data", async () => {
    useIronLogStore.getState().importData({
      unitPreference: "lbs",
      theme: "dark",
      trainingGoal: "general_fitness",
      currentTrainingBlockId: null,
      trainingBlocks: [],
      exercises: [{
        id: "ex-bad-pr",
        name: "Cable Curl",
        primaryMuscle: "Biceps brachii",
        secondaryMuscles: [],
        equipment: "Cable",
        movementPattern: "Curl",
        isUnilateral: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }],
      templates: [],
      templateExercises: [],
      sessions: [{
        id: "session-bad-pr",
        name: "Arms",
        startedAt: "2026-01-02T12:00:00.000Z",
        finishedAt: "2026-01-02T13:00:00.000Z",
        createdAt: "2026-01-02T12:00:00.000Z",
        updatedAt: "2026-01-02T13:00:00.000Z"
      }],
      sessionExercises: [{
        id: "session-ex-bad-pr",
        workoutSessionId: "session-bad-pr",
        exerciseId: "ex-bad-pr",
        orderIndex: 0
      }],
      setLogs: [{
        id: "set-bad-pr",
        workoutSessionExerciseId: "session-ex-bad-pr",
        setNumber: 1,
        weight: 40,
        reps: 12,
        rpe: 8,
        setType: "working",
        isCompleted: true,
        createdAt: "2026-01-02T12:05:00.000Z"
      }],
      personalRecords: [{
        id: "bad-pr",
        exerciseId: "ex-bad-pr",
        workoutSessionId: "session-bad-pr",
        setLogId: "set-bad-pr",
        type: "custom_bad_type",
        value: { bad: "value" },
        unit: { bad: "unit" },
        achievedAt: "not-a-date"
      } as any],
      photos: [],
      analyses: []
    });

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Exercises" }));
    await userEvent.type(screen.getByPlaceholderText("Search exercises"), "c");

    expect(screen.getAllByText("Cable Curl").length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText("Search exercises")).toHaveValue("c");
  });
});
