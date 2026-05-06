import type { Exercise, SetLog, WorkoutSession } from "./types";

export function setVolume(weight: number, reps: number): number {
  return round(weight * reps);
}

export function estimatedOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  return round(weight * (1 + reps / 30));
}

export function exerciseSessionVolume(sets: SetLog[]): number {
  return round(
    sets.filter((set) => set.isCompleted).reduce((total, set) => total + setVolume(set.weight, set.reps), 0)
  );
}

export function workoutSessionVolume(sessionSets: SetLog[][]): number {
  return round(sessionSets.reduce((total, sets) => total + exerciseSessionVolume(sets), 0));
}

export function maxCompletedWeight(sets: SetLog[]): number {
  return Math.max(0, ...sets.filter((set) => set.isCompleted && set.reps > 0).map((set) => set.weight));
}

export function maxEstimatedOneRepMax(sets: SetLog[]): number {
  return Math.max(0, ...sets.filter((set) => set.isCompleted).map((set) => estimatedOneRepMax(set.weight, set.reps)));
}

export function maxRepsAtWeight(sets: SetLog[], weight: number): number {
  return Math.max(
    0,
    ...sets.filter((set) => set.isCompleted && set.weight === weight).map((set) => set.reps)
  );
}

export function weeklyVolume(
  sessions: WorkoutSession[],
  setsBySessionId: Record<string, SetLog[][]>,
  weekStartsOnMonday = true
): Array<{ weekStart: string; volume: number }> {
  const totals = new Map<string, number>();

  for (const session of sessions) {
    const date = new Date(session.startedAt);
    const key = startOfWeek(date, weekStartsOnMonday).toISOString().slice(0, 10);
    const volume = workoutSessionVolume(setsBySessionId[session.id] ?? []);
    totals.set(key, round((totals.get(key) ?? 0) + volume));
  }

  return [...totals.entries()]
    .map(([weekStart, volume]) => ({ weekStart, volume }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function workoutFrequencyStreaks(sessions: WorkoutSession[]): { currentStreakDays: number; longestStreakDays: number } {
  const days = new Set(sessions.map((session) => session.startedAt.slice(0, 10)));
  const sorted = [...days].sort();
  let longest = 0;
  let currentRun = 0;
  let previous: Date | null = null;

  for (const day of sorted) {
    const date = new Date(`${day}T00:00:00.000Z`);
    const consecutive = previous && date.getTime() - previous.getTime() === 86_400_000;
    currentRun = consecutive ? currentRun + 1 : 1;
    longest = Math.max(longest, currentRun);
    previous = date;
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  let current = 0;
  if (days.has(today) || days.has(yesterday)) {
    let cursor = new Date(`${days.has(today) ? today : yesterday}T00:00:00.000Z`);
    while (days.has(cursor.toISOString().slice(0, 10))) {
      current += 1;
      cursor = new Date(cursor.getTime() - 86_400_000);
    }
  }

  return { currentStreakDays: current, longestStreakDays: longest };
}

export function muscleGroupVolume(
  exercises: Exercise[],
  setsByExerciseId: Record<string, SetLog[]>
): Array<{ muscle: string; volume: number }> {
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const totals = new Map<string, number>();

  for (const [exerciseId, sets] of Object.entries(setsByExerciseId)) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise) continue;
    const volume = exerciseSessionVolume(sets);
    totals.set(exercise.primaryMuscle, round((totals.get(exercise.primaryMuscle) ?? 0) + volume));
  }

  return [...totals.entries()]
    .map(([muscle, volume]) => ({ muscle, volume }))
    .sort((a, b) => b.volume - a.volume);
}

function startOfWeek(date: Date, monday: boolean): Date {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = result.getUTCDay();
  const diff = monday ? (day === 0 ? -6 : 1 - day) : -day;
  result.setUTCDate(result.getUTCDate() + diff);
  return result;
}

export function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
