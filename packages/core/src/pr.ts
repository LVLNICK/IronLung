import { estimatedOneRepMax, exerciseSessionVolume, maxRepsAtWeight, round, setVolume } from "./calculations";
import type { PersonalRecord, PRType, SetLog } from "./types";

export interface PRCheckInput {
  exerciseId: string;
  workoutSessionId: string;
  achievedAt: string;
  unit: string;
  newSet: SetLog;
  sessionSetsForExercise: SetLog[];
  historicalSetsForExercise: SetLog[];
  historicalSessionVolumesForExercise: number[];
}

export function detectPersonalRecords(input: PRCheckInput): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  const completedHistoricalSets = input.historicalSetsForExercise.filter((set) => set.isCompleted);

  if (!input.newSet.isCompleted || input.newSet.reps <= 0) return records;

  const historicalMaxWeight = Math.max(0, ...completedHistoricalSets.map((set) => set.weight));
  if (input.newSet.weight > historicalMaxWeight) {
    records.push(makeRecord(input, "max_weight", input.newSet.weight, input.unit));
  }

  const newOneRm = estimatedOneRepMax(input.newSet.weight, input.newSet.reps);
  const historicalOneRm = Math.max(0, ...completedHistoricalSets.map((set) => estimatedOneRepMax(set.weight, set.reps)));
  if (newOneRm > historicalOneRm) {
    records.push(makeRecord(input, "estimated_1rm", newOneRm, input.unit));
  }

  const newSessionVolume = exerciseSessionVolume(input.sessionSetsForExercise);
  const oldBestSessionVolume = Math.max(0, ...input.historicalSessionVolumesForExercise);
  if (newSessionVolume > oldBestSessionVolume) {
    records.push(makeRecord(input, "session_volume", newSessionVolume, `${input.unit} total`));
  }

  const oldRepsAtWeight = maxRepsAtWeight(completedHistoricalSets, input.newSet.weight);
  if (input.newSet.reps > oldRepsAtWeight) {
    records.push(makeRecord(input, "reps_at_weight", input.newSet.reps, `reps @ ${input.newSet.weight}${input.unit}`));
  }

  const newSetVolume = setVolume(input.newSet.weight, input.newSet.reps);
  const historicalSetVolume = Math.max(0, ...completedHistoricalSets.map((set) => setVolume(set.weight, set.reps)));
  if (newSetVolume > historicalSetVolume) {
    records.push(makeRecord(input, "best_set", newSetVolume, `${input.unit} set volume`));
  }

  return records;
}

function makeRecord(input: PRCheckInput, type: PRType, value: number, unit: string): PersonalRecord {
  return {
    id: crypto.randomUUID(),
    exerciseId: input.exerciseId,
    workoutSessionId: input.workoutSessionId,
    setLogId: input.newSet.id,
    type,
    value: round(value),
    unit,
    achievedAt: input.achievedAt
  };
}

export function prLabel(type: PRType): string {
  const labels: Record<PRType, string> = {
    max_weight: "Max weight",
    estimated_1rm: "Estimated 1RM",
    session_volume: "Session volume",
    reps_at_weight: "Reps at weight",
    best_set: "Best set",
    exercise_session_volume: "Session volume",
    workout_session_volume: "Best set"
  };
  return labels[type];
}
