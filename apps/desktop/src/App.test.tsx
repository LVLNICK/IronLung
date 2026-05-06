import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { useIronLungStore } from "./lib/store";

describe("IronLung analytics desktop", () => {
  beforeEach(() => {
    useIronLungStore.getState().clearAllData();
  });

  it("renders the analytics-only navigation", async () => {
    render(<App />);
    expect(screen.getByText("Analytics Overview")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Daily Log" }));
    expect(screen.getByText("Every-Day Training Log")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Data" }));
    expect(screen.getByText("Data Quality Analytics")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Weak Points" }));
    expect(screen.getByText("Weak Point Detection")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Muscles" }));
    expect(screen.getByText("Body heat map")).toBeInTheDocument();
  });

  it("shows imported history in daily analytics", async () => {
    useIronLungStore.getState().importData({
      unitPreference: "lbs",
      theme: "dark",
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
    await userEvent.click(screen.getByRole("button", { name: "Daily Log" }));

    expect(screen.getAllByText("2026-01-01").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1").length).toBeTruthy();
  });
});
