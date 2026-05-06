import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { useIronLungStore } from "./lib/store";

describe("IronLung desktop command center", () => {
  beforeEach(() => {
    useIronLungStore.getState().clearAllData();
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
    useIronLungStore.getState().importData({
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
    expect(screen.getByText("Upper")).toBeInTheDocument();
  });
});
