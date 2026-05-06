import { z } from "zod";

export const setTypeSchema = z.enum(["warmup", "working", "drop", "failure", "amrap"]);
export const poseTypeSchema = z.enum(["front", "side", "back", "other"]);

export const exerciseInputSchema = z.object({
  name: z.string().trim().min(1, "Exercise name is required"),
  primaryMuscle: z.string().trim().min(1, "Primary muscle is required"),
  secondaryMuscles: z.array(z.string().trim()).default([]),
  equipment: z.string().trim().min(1, "Equipment is required"),
  movementPattern: z.string().trim().min(1, "Movement pattern is required"),
  isUnilateral: z.boolean().default(false),
  notes: z.string().optional()
});

export const templateInputSchema = z.object({
  name: z.string().trim().min(1, "Workout name is required"),
  description: z.string().optional()
});

export const setLogInputSchema = z.object({
  weight: z.coerce.number().min(0),
  reps: z.coerce.number().int().min(0),
  rpe: z.coerce.number().min(1).max(10).nullable().optional(),
  setType: setTypeSchema.default("working"),
  notes: z.string().optional()
});

export const progressPhotoInputSchema = z.object({
  imagePath: z.string().min(1),
  poseType: poseTypeSchema,
  age: z.coerce.number().int().positive().nullable().optional(),
  height: z.coerce.number().positive().nullable().optional(),
  bodyweight: z.coerce.number().positive().nullable().optional(),
  lightingTag: z.string().nullable().optional(),
  pumpTag: z.string().nullable().optional(),
  notes: z.string().optional(),
  capturedAt: z.string().datetime()
});

export const importPayloadSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  data: z.object({
    unitPreference: z.enum(["lbs", "kg"]),
    theme: z.enum(["dark", "light", "system"]),
    exercises: z.array(z.unknown()),
    templates: z.array(z.unknown()),
    templateExercises: z.array(z.unknown()),
    sessions: z.array(z.unknown()),
    sessionExercises: z.array(z.unknown()),
    setLogs: z.array(z.unknown()),
    personalRecords: z.array(z.unknown()),
    photos: z.array(z.unknown()),
    analyses: z.array(z.unknown())
  })
});

export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
export type TemplateInput = z.infer<typeof templateInputSchema>;
export type SetLogInput = z.infer<typeof setLogInputSchema>;
