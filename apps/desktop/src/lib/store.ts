import {
  detectPersonalRecords,
  inferExerciseTargetProfile,
  exerciseSessionVolume,
  estimatedOneRepMax,
  convertWeight,
  type ExerciseMapping,
  type ImportCommitSummary,
  type ImportUnitPreference,
  type NormalizedWorkoutImport,
  type BodyAnalysis,
  type Exercise,
  type PersonalRecord,
  type ProgressPhoto,
  type SetLog,
  type SetType,
  type ThemePreference,
  type UnitPreference,
  type WorkoutSession,
  type WorkoutSessionExercise,
  type WorkoutTemplate,
  type WorkoutTemplateExercise
} from "@ironlung/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { analyzeProgressPhotoLocally } from "./photoAnalysis";

export interface IronLungStateData {
  unitPreference: UnitPreference;
  theme: ThemePreference;
  exercises: Exercise[];
  templates: WorkoutTemplate[];
  templateExercises: WorkoutTemplateExercise[];
  sessions: WorkoutSession[];
  sessionExercises: WorkoutSessionExercise[];
  setLogs: SetLog[];
  personalRecords: PersonalRecord[];
  photos: ProgressPhoto[];
  analyses: BodyAnalysis[];
}

interface IronLungStore extends IronLungStateData {
  createExercise(input: Omit<Exercise, "id" | "createdAt" | "updatedAt">): Exercise;
  updateExercise(id: string, input: Partial<Omit<Exercise, "id" | "createdAt" | "updatedAt">>): void;
  deleteExercise(id: string): void;
  createTemplate(name: string, description?: string): WorkoutTemplate;
  addTemplateExercise(templateId: string, exerciseId: string, details: Partial<WorkoutTemplateExercise>): void;
  removeTemplateExercise(id: string): void;
  startWorkout(templateId?: string): WorkoutSession;
  addExerciseToSession(sessionId: string, exerciseId: string): void;
  logSet(input: {
    workoutSessionExerciseId: string;
    exerciseId: string;
    workoutSessionId: string;
    weight: number;
    reps: number;
    rpe?: number | null;
    setType: SetType;
    notes?: string;
  }): PersonalRecord[];
  finishWorkout(sessionId: string, notes?: string, bodyweight?: number | null): void;
  deleteWorkout(sessionId: string): void;
  addPhoto(input: Omit<ProgressPhoto, "id" | "createdAt">): ProgressPhoto;
  analyzePhoto(photoId: string, consentGiven: boolean): Promise<BodyAnalysis>;
  importNormalizedWorkouts(input: NormalizedWorkoutImport, mappings: ExerciseMapping[], unit: ImportUnitPreference): ImportCommitSummary;
  deleteAllPhotoData(): void;
  updateSettings(input: Partial<Pick<IronLungStateData, "unitPreference" | "theme">>): void;
  importData(data: IronLungStateData): void;
  clearAllData(): void;
}

const initialData: IronLungStateData = {
  unitPreference: "lbs",
  theme: "dark",
  exercises: [],
  templates: [],
  templateExercises: [],
  sessions: [],
  sessionExercises: [],
  setLogs: [],
  personalRecords: [],
  photos: [],
  analyses: []
};

export const useIronLungStore = create<IronLungStore>()(
  persist(
    (set, get) => ({
      ...initialData,
      createExercise: (input) => {
        const now = new Date().toISOString();
        const exercise: Exercise = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        set((state) => ({ exercises: [...state.exercises, exercise] }));
        return exercise;
      },
      updateExercise: (id, input) => {
        set((state) => ({
          exercises: state.exercises.map((exercise) =>
            exercise.id === id ? { ...exercise, ...input, updatedAt: new Date().toISOString() } : exercise
          )
        }));
      },
      deleteExercise: (id) => {
        set((state) => ({ exercises: state.exercises.filter((exercise) => exercise.id !== id) }));
      },
      createTemplate: (name, description) => {
        const now = new Date().toISOString();
        const template: WorkoutTemplate = { id: crypto.randomUUID(), name, description, createdAt: now, updatedAt: now };
        set((state) => ({ templates: [...state.templates, template] }));
        return template;
      },
      addTemplateExercise: (templateId, exerciseId, details) => {
        const orderIndex = get().templateExercises.filter((item) => item.workoutTemplateId === templateId).length;
        const row: WorkoutTemplateExercise = {
          id: crypto.randomUUID(),
          workoutTemplateId: templateId,
          exerciseId,
          orderIndex,
          targetSets: details.targetSets ?? 3,
          targetReps: details.targetReps ?? "8-10",
          targetRestSeconds: details.targetRestSeconds ?? 120,
          notes: details.notes
        };
        set((state) => ({ templateExercises: [...state.templateExercises, row] }));
      },
      removeTemplateExercise: (id) => {
        set((state) => ({ templateExercises: state.templateExercises.filter((item) => item.id !== id) }));
      },
      startWorkout: (templateId) => {
        const now = new Date().toISOString();
        const template = get().templates.find((item) => item.id === templateId);
        const session: WorkoutSession = {
          id: crypto.randomUUID(),
          workoutTemplateId: templateId ?? null,
          name: template?.name ?? "Untitled Workout",
          startedAt: now,
          finishedAt: null,
          createdAt: now,
          updatedAt: now
        };
        const templateRows = get().templateExercises.filter((item) => item.workoutTemplateId === templateId);
        const sessionExerciseRows: WorkoutSessionExercise[] = templateRows.map((row, index) => ({
          id: crypto.randomUUID(),
          workoutSessionId: session.id,
          exerciseId: row.exerciseId,
          orderIndex: index,
          notes: row.notes
        }));
        set((state) => ({
          sessions: [...state.sessions, session],
          sessionExercises: [...state.sessionExercises, ...sessionExerciseRows]
        }));
        return session;
      },
      addExerciseToSession: (sessionId, exerciseId) => {
        const orderIndex = get().sessionExercises.filter((item) => item.workoutSessionId === sessionId).length;
        set((state) => ({
          sessionExercises: [
            ...state.sessionExercises,
            { id: crypto.randomUUID(), workoutSessionId: sessionId, exerciseId, orderIndex }
          ]
        }));
      },
      logSet: (input) => {
        const now = new Date().toISOString();
        const setNumber =
          get().setLogs.filter((setLog) => setLog.workoutSessionExerciseId === input.workoutSessionExerciseId).length + 1;
        const setLog: SetLog = {
          id: crypto.randomUUID(),
          workoutSessionExerciseId: input.workoutSessionExerciseId,
          setNumber,
          weight: input.weight,
          reps: input.reps,
          rpe: input.rpe ?? null,
          setType: input.setType,
          isCompleted: true,
          notes: input.notes,
          createdAt: now
        };
        const state = get();
        const exerciseSessionExerciseIds = state.sessionExercises
          .filter((item) => item.exerciseId === input.exerciseId)
          .map((item) => item.id);
        const historicalSets = state.setLogs.filter(
          (item) =>
            exerciseSessionExerciseIds.includes(item.workoutSessionExerciseId) &&
            item.workoutSessionExerciseId !== input.workoutSessionExerciseId
        );
        const sessionSets = [...state.setLogs, setLog].filter((item) => item.workoutSessionExerciseId === input.workoutSessionExerciseId);
        const historicalVolumes = state.sessionExercises
          .filter((item) => item.exerciseId === input.exerciseId && item.workoutSessionId !== input.workoutSessionId)
          .map((item) => exerciseSessionVolume(state.setLogs.filter((set) => set.workoutSessionExerciseId === item.id)));
        const records = detectPersonalRecords({
          exerciseId: input.exerciseId,
          workoutSessionId: input.workoutSessionId,
          achievedAt: now,
          unit: state.unitPreference,
          newSet: setLog,
          sessionSetsForExercise: sessionSets,
          historicalSetsForExercise: historicalSets,
          historicalSessionVolumesForExercise: historicalVolumes
        });
        set((current) => ({
          setLogs: [...current.setLogs, setLog],
          personalRecords: [...current.personalRecords, ...records]
        }));
        return records;
      },
      finishWorkout: (sessionId, notes, bodyweight) => {
        const now = new Date().toISOString();
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId ? { ...session, finishedAt: now, notes, bodyweight, updatedAt: now } : session
          )
        }));
      },
      deleteWorkout: (sessionId) => {
        const sessionExerciseIds = get()
          .sessionExercises.filter((item) => item.workoutSessionId === sessionId)
          .map((item) => item.id);
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== sessionId),
          sessionExercises: state.sessionExercises.filter((item) => item.workoutSessionId !== sessionId),
          setLogs: state.setLogs.filter((setLog) => !sessionExerciseIds.includes(setLog.workoutSessionExerciseId)),
          personalRecords: state.personalRecords.filter((record) => record.workoutSessionId !== sessionId)
        }));
      },
      addPhoto: (input) => {
        const photo: ProgressPhoto = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        set((state) => ({ photos: [...state.photos, photo] }));
        return photo;
      },
      analyzePhoto: async (photoId, consentGiven) => {
        const photo = get().photos.find((item) => item.id === photoId);
        if (!photo) throw new Error("Photo not found.");
        const result = await analyzeProgressPhotoLocally(photo, consentGiven);
        const analysis: BodyAnalysis = {
          id: crypto.randomUUID(),
          progressPhotoId: photo.id,
          ...result,
          createdAt: new Date().toISOString()
        };
        set((state) => ({ analyses: [...state.analyses, analysis] }));
        return analysis;
      },
      importNormalizedWorkouts: (input, mappings, unit) => {
        const state = get();
        const mappingByName = new Map(mappings.map((mapping) => [mapping.importedName, mapping]));
        const existingHashes = new Set(state.setLogs.map((setLog) => setLog.importHash).filter(Boolean));
        const exercises = [...state.exercises];
        const sessions = [...state.sessions];
        const sessionExercises = [...state.sessionExercises];
        const setLogs = [...state.setLogs];
        const personalRecords = [...state.personalRecords];
        const warnings = [...input.warnings];
        const errors: string[] = [];
        let workoutsImported = 0;
        let exercisesCreated = 0;
        let setsImported = 0;
        let prsDetected = 0;
        let skippedRows = input.skippedRows.length;
        const now = new Date().toISOString();
        const createdExerciseByImportedName = new Map<string, Exercise>();

        const workoutsInHistoryOrder = [...input.workouts].sort((a, b) => a.startedAt.localeCompare(b.startedAt));

        for (const workout of workoutsInHistoryOrder) {
          const sessionId = crypto.randomUUID();
          const session: WorkoutSession = {
            id: sessionId,
            workoutTemplateId: null,
            name: workout.name,
            startedAt: workout.startedAt,
            finishedAt: workout.finishedAt ?? workout.startedAt,
            notes: workout.notes,
            bodyweight: workout.bodyweight,
            importSource: input.source,
            importedMetadataJson: workout.importedMetadataJson,
            createdAt: now,
            updatedAt: now
          };
          let sessionHadSets = false;

          workout.exercises.forEach((importedExercise, exerciseIndex) => {
            const mapping = mappingByName.get(importedExercise.exerciseName);
            if (!mapping || mapping.action === "skip") {
              skippedRows += importedExercise.sets.length;
              return;
            }

            let exercise = mapping.exerciseId ? exercises.find((item) => item.id === mapping.exerciseId) : undefined;
            if (!exercise && mapping.action === "create") {
              exercise = createdExerciseByImportedName.get(mapping.importedName)
                ?? exercises.find((item) => item.name.toLowerCase() === (mapping.exerciseName || importedExercise.exerciseName).toLowerCase());
            }
            if (!exercise) {
              const targetProfile = inferExerciseTargetProfile(mapping.exerciseName || importedExercise.exerciseName);
              exercise = {
                id: crypto.randomUUID(),
                name: mapping.exerciseName || importedExercise.exerciseName,
                primaryMuscle: targetProfile.primaryMuscle,
                secondaryMuscles: targetProfile.secondaryMuscles,
                equipment: targetProfile.equipment,
                movementPattern: targetProfile.movementPattern,
                isUnilateral: targetProfile.isUnilateral,
                notes: `Created from Boostcamp import.\n\n${targetProfile.notes}`,
                createdAt: now,
                updatedAt: now
              };
              exercises.push(exercise);
              createdExerciseByImportedName.set(mapping.importedName, exercise);
              exercisesCreated += 1;
            }

            const sessionExercise: WorkoutSessionExercise = {
              id: crypto.randomUUID(),
              workoutSessionId: sessionId,
              exerciseId: exercise.id,
              orderIndex: exerciseIndex,
              notes: importedExercise.notes,
              importSource: input.source,
              importedMetadataJson: importedExercise.importedMetadataJson
            };
            const sessionExerciseSets: SetLog[] = [];

            importedExercise.sets.forEach((importedSet) => {
              if (existingHashes.has(importedSet.importHash)) {
                skippedRows += 1;
                return;
              }
              const sourceUnit = importedSet.unit ?? (unit === "auto" ? state.unitPreference : unit);
              const weight = convertWeight(importedSet.weight, sourceUnit, state.unitPreference);
              const setLog: SetLog = {
                id: crypto.randomUUID(),
                workoutSessionExerciseId: sessionExercise.id,
                setNumber: importedSet.setNumber,
                weight,
                reps: importedSet.reps,
                rpe: importedSet.rpe ?? null,
                setType: "working",
                isCompleted: true,
                notes: importedSet.notes,
                importSource: input.source,
                importHash: importedSet.importHash,
                importedMetadataJson: importedSet.importedMetadataJson,
                createdAt: workout.startedAt
              };
              const exerciseSessionExerciseIds = sessionExercises
                .filter((item) => item.exerciseId === exercise.id)
                .map((item) => item.id);
              const historicalSets = setLogs.filter((item) => exerciseSessionExerciseIds.includes(item.workoutSessionExerciseId));
              const historicalVolumes = sessionExercises
                .filter((item) => item.exerciseId === exercise.id)
                .map((item) => exerciseSessionVolume(setLogs.filter((set) => set.workoutSessionExerciseId === item.id)));
              const records = detectPersonalRecords({
                exerciseId: exercise.id,
                workoutSessionId: sessionId,
                achievedAt: workout.startedAt,
                unit: state.unitPreference,
                newSet: setLog,
                sessionSetsForExercise: [...sessionExerciseSets, setLog],
                historicalSetsForExercise: historicalSets,
                historicalSessionVolumesForExercise: historicalVolumes
              });
              sessionExerciseSets.push(setLog);
              setLogs.push(setLog);
              personalRecords.push(...records);
              existingHashes.add(importedSet.importHash);
              setsImported += 1;
              prsDetected += records.length;
              sessionHadSets = true;
            });

            if (sessionExerciseSets.length) sessionExercises.push(sessionExercise);
          });

          if (sessionHadSets) {
            sessions.push(session);
            workoutsImported += 1;
          }
        }

        set({ exercises, sessions, sessionExercises, setLogs, personalRecords });
        if (setsImported === 0) warnings.push("No new sets were imported. This may be a duplicate file.");
        return { workoutsImported, exercisesCreated, setsImported, prsDetected, skippedRows, warnings, errors };
      },
      deleteAllPhotoData: () => set({ photos: [], analyses: [] }),
      updateSettings: (input) => set((state) => ({ ...state, ...input })),
      importData: (data) => set({ ...initialData, ...data }),
      clearAllData: () => set(initialData)
    }),
    {
      name: "ironlung-desktop-local"
    }
  )
);

export function selectOpenSession(state: IronLungStateData): WorkoutSession | undefined {
  return state.sessions.find((session) => !session.finishedAt);
}

export function oneRmForSet(setLog: SetLog): number {
  return estimatedOneRepMax(setLog.weight, setLog.reps);
}
