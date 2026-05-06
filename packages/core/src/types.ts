export type UnitPreference = "lbs" | "kg";
export type ThemePreference = "dark" | "light" | "system";
export type TrainingGoal = "strength" | "hypertrophy" | "lean_bulk" | "cutting" | "powerbuilding" | "general_fitness";

export type SetType = "warmup" | "working" | "drop" | "failure" | "amrap";
export type PRImportance = "baseline" | "small" | "medium" | "major";
export type PRType =
  | "max_weight"
  | "estimated_1rm"
  | "session_volume"
  | "reps_at_weight"
  | "best_set"
  | "exercise_session_volume"
  | "workout_session_volume";

export type PoseType = "front" | "side" | "back" | "other";

export interface MuscleContribution {
  muscle: string;
  percent: number;
  role?: "primary" | "secondary" | "stabilizer";
}

export interface UserSettings {
  id: string;
  unitPreference: UnitPreference;
  theme: ThemePreference;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  muscleContributions?: MuscleContribution[];
  equipment: string;
  movementPattern: string;
  isUnilateral: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  workoutTemplateId: string;
  exerciseId: string;
  orderIndex: number;
  targetSets: number;
  targetReps: string;
  targetRestSeconds: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  workoutTemplateId?: string | null;
  name: string;
  startedAt: string;
  finishedAt?: string | null;
  notes?: string;
  bodyweight?: number | null;
  trainingBlockId?: string | null;
  importSource?: string;
  importedMetadataJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSessionExercise {
  id: string;
  workoutSessionId: string;
  exerciseId: string;
  orderIndex: number;
  notes?: string;
  importSource?: string;
  importedMetadataJson?: Record<string, unknown>;
}

export interface SetLog {
  id: string;
  workoutSessionExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number | null;
  setType: SetType;
  isCompleted: boolean;
  notes?: string;
  importSource?: string;
  importHash?: string;
  importedMetadataJson?: Record<string, unknown>;
  createdAt: string;
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  workoutSessionId: string;
  setLogId?: string | null;
  type: PRType;
  value: number;
  unit: string;
  importance?: PRImportance;
  achievedAt: string;
}

export interface TrainingBlock {
  id: string;
  name: string;
  goal?: TrainingGoal;
  startedAt: string;
  endedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressPhoto {
  id: string;
  imagePath: string;
  poseType: PoseType;
  age?: number | null;
  height?: number | null;
  bodyweight?: number | null;
  lightingTag?: string | null;
  pumpTag?: string | null;
  notes?: string;
  capturedAt: string;
  createdAt: string;
}

export interface BodyAnalysis {
  id: string;
  progressPhotoId: string;
  score: number;
  confidence: number;
  modelVersion: string;
  measurementsJson: Record<string, unknown>;
  warningsJson: string[];
  createdAt: string;
}
