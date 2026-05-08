import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock, Copy, Dumbbell, List, MessageSquare, MoreHorizontal, Trophy, Zap } from "lucide-react";
import { addSetToActiveMobileWorkout, finishActiveMobileWorkout, setMobileSetCompleted, type MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel } from "../features/analytics/mobileAnalytics";
import type { MobileTab } from "../types";
import { EmptyMobileState, GlassCard, IconTile, ListRow, MetricChip, MobileGhostButton, MobilePage, MobilePrimaryButton, SectionTitle, StatusPill } from "../components/MobilePrimitives";
import { formatNumber } from "./AnalyzerShared";

type LoggedSet = {
  id: string;
  set: number;
  weight: number;
  reps: number;
  rpe: number;
  e1rm: number;
  completed: boolean;
  pr?: boolean;
};

type WorkoutExercise = {
  id: string;
  name: string;
  muscles: string;
  targetSets: number;
  previousBest: string;
  lastTime: string;
  sets: LoggedSet[];
};

export function TrainPage({ snapshot, analyzer, onNavigate, onSnapshot }: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel; onNavigate: (tab: MobileTab) => void; onSnapshot: (snapshot: MobileSnapshot) => void }) {
  const [localSnapshot, setLocalSnapshot] = useState(snapshot);
  const [activeExerciseId, setActiveExerciseId] = useState("");
  const [nextWeight, setNextWeight] = useState(0);
  const [nextReps, setNextReps] = useState(8);
  const [nextRpe, setNextRpe] = useState(7);
  const [notice, setNotice] = useState("Phone-local workout ready");
  const [lastAddedPr, setLastAddedPr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setLocalSnapshot(snapshot);
  }, [snapshot]);

  const exercises = useMemo(() => buildWorkoutExercises(localSnapshot, analyzer), [localSnapshot, analyzer]);
  const activeExercise = exercises.find((exercise) => exercise.id === activeExerciseId) ?? exercises[0];

  useEffect(() => {
    if (!activeExerciseId && exercises[0]) setActiveExerciseId(exercises[0].id);
  }, [activeExerciseId, exercises]);

  useEffect(() => {
    if (!activeExercise) return;
    const last = activeExercise.sets.at(-1);
    if (last) {
      setNextWeight(last.weight);
      setNextReps(last.reps);
      setNextRpe(last.rpe);
    } else {
      const recent = analyzer.strengthRows.find((row) => row.exerciseId === activeExercise.id);
      setNextWeight(recent?.maxWeight ?? 0);
      setNextReps(8);
      setNextRpe(7);
    }
  }, [activeExercise?.id]);

  if (!exercises.length || !activeExercise) {
    return (
      <MobilePage>
        <header className="flex items-center gap-3 pt-1">
          <button onClick={() => onNavigate("settings")} aria-label="Back to Settings" className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><ChevronLeft className="h-7 w-7 text-white" /></button>
          <div>
            <div className="text-xl font-black">Train</div>
            <div className="text-sm text-slate-400">Import desktop data first.</div>
          </div>
        </header>
        <EmptyMobileState icon={Dumbbell} title="No exercises on this phone" body="Import a desktop seed or Boostcamp history before logging mobile sets. Workouts stay local on this phone." actionLabel="Open Import" onAction={() => onNavigate("settings")} />
      </MobilePage>
    );
  }

  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const completedSets = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0);
  const completedExercises = exercises.filter((exercise) => exercise.sets.filter((set) => set.completed).length >= exercise.targetSets).length;
  const volume = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).reduce((setSum, set) => setSum + set.weight * set.reps, 0), 0);
  const topE1rm = Math.max(0, ...exercises.flatMap((exercise) => exercise.sets.map((set) => set.e1rm)));
  const prCount = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.pr).length, 0);
  const progressPercent = Math.min(100, Math.round((completedExercises / exercises.length) * 100));

  const saveSnapshot = (next: MobileSnapshot) => {
    setLocalSnapshot(next);
    onSnapshot(next);
  };

  const addSet = async (weight: number, reps: number, rpe: number, source: "add" | "repeat") => {
    setSaving(true);
    try {
      const result = await withSaveTimeout(addSetToActiveMobileWorkout(localSnapshot.settings, {
        exerciseId: activeExercise.id,
        weight: sanitizeWeight(weight),
        reps: sanitizeReps(reps),
        rpe: sanitizeRpe(rpe),
        setType: "working"
      }));
      saveSnapshot(result.snapshot);
      setNextWeight(result.setLog.weight);
      setNextReps(result.setLog.reps);
      setNextRpe(result.setLog.rpe ?? rpe);
      setLastAddedPr(result.personalRecords.some((record) => record.importance === "major" || record.importance === "medium"));
      setFinished(false);
      setNotice(result.personalRecords.length ? `Saved ${result.personalRecords.length} PR${result.personalRecords.length === 1 ? "" : "s"} locally.` : `${source === "repeat" ? "Repeated" : "Saved"} ${result.setLog.weight} lb x ${result.setLog.reps} locally.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save set locally.");
    } finally {
      setSaving(false);
    }
  };

  const copyLastSet = () => {
    const last = activeExercise.sets.at(-1);
    if (!last) {
      setNotice(`No previous ${activeExercise.name} set to copy.`);
      return;
    }
    setNextWeight(last.weight);
    setNextReps(last.reps);
    setNextRpe(last.rpe);
    setNotice(`Copied ${activeExercise.name} set ${last.set}.`);
  };

  const repeatLastSet = () => {
    const last = activeExercise.sets.at(-1);
    if (!last) {
      setNotice(`No previous ${activeExercise.name} set to repeat.`);
      return;
    }
    void addSet(last.weight, last.reps, last.rpe, "repeat");
  };

  const toggleSetCompletion = async (set: LoggedSet) => {
    setSaving(true);
    try {
      const next = await withSaveTimeout(setMobileSetCompleted(localSnapshot.settings, set.id, !set.completed));
      saveSnapshot(next);
      setNotice(`${activeExercise.name} set ${set.set} ${set.completed ? "unchecked" : "completed"} locally.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update set.");
    } finally {
      setSaving(false);
    }
  };

  const selectExercise = (exercise: WorkoutExercise) => {
    setActiveExerciseId(exercise.id);
    setLastAddedPr(false);
    setFinished(false);
    setNotice(`${exercise.name} selected.`);
  };

  const finishWorkout = async () => {
    setSaving(true);
    try {
      const next = await withSaveTimeout(finishActiveMobileWorkout(localSnapshot.settings));
      saveSnapshot(next);
      setFinished(true);
      setNotice(`Workout saved locally: ${completedSets} sets, ${formatNumber(volume)} lb volume, ${prCount} PR${prCount === 1 ? "" : "s"}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not finish workout.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobilePage>
      <header className="flex items-start justify-between pt-1">
        <button onClick={() => onNavigate("home")} aria-label="Back to Home" className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><ChevronLeft className="h-7 w-7 text-white" /></button>
        <div className="min-w-0 px-2 text-center">
          <div className="truncate text-xl font-black leading-tight min-[400px]:text-2xl">Mobile Workout</div>
          <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-400"><Clock className="h-4 w-4" />saved on phone</div>
        </div>
        <button onClick={() => setNotice("Workout actions are saved to phone-local storage.")} aria-label="Workout menu" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><MoreHorizontal className="h-5 w-5" /></button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusPill tone={finished ? "green" : "slate"}>{saving ? "Saving..." : notice}</StatusPill>
        {lastAddedPr && <StatusPill tone="green">New PR</StatusPill>}
      </div>

      <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-4">
        <TopMetric icon={Dumbbell} value={formatNumber(volume)} label="Volume" />
        <TopMetric icon={List} value={formatNumber(totalSets)} label="Sets" />
        <TopMetric icon={Trophy} value={formatNumber(prCount)} label="PRs" />
        <TopMetric icon={Zap} value={formatNumber(topE1rm)} label="e1RM" />
      </div>

      <div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.38)]" style={{ width: `${progressPercent}%` }} /></div>
        <div className="mt-2 flex justify-between text-sm text-slate-400"><span>{completedExercises} of {exercises.length} exercises</span><span>{progressPercent}%</span></div>
      </div>

      <GlassCard className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <IconTile icon={Dumbbell} size="large" />
            <div className="min-w-0">
              <div className="truncate text-2xl font-black">{activeExercise.name}</div>
              <div className="mt-1 text-sm text-slate-400">{activeExercise.muscles}</div>
            </div>
          </div>
          <StatusPill>{activeExercise.sets.filter((set) => set.completed).length} / {activeExercise.targetSets}</StatusPill>
        </div>

        <button onClick={() => setNotice(`${activeExercise.name}: previous best ${activeExercise.previousBest}; last time ${activeExercise.lastTime}.`)} className="mt-4 grid min-h-[72px] w-full grid-cols-2 rounded-2xl border border-white/10 bg-black/15 p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">
          <div>
            <div className="text-xs text-slate-500">Previous best</div>
            <div className="mt-1 font-mono text-base">{activeExercise.previousBest}</div>
          </div>
          <div className="flex items-center justify-between border-l border-white/10 pl-4">
            <div className="min-w-0">
              <div className="text-xs text-slate-500">Last time</div>
              <div className="mt-1 truncate font-mono text-sm">{activeExercise.lastTime}</div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0" />
          </div>
        </button>

        <SetTable sets={activeExercise.sets} onToggle={toggleSetCompletion} />

        <GlassCard className="mt-5 border-blue-500/45 bg-blue-500/[0.06] p-4">
          <SectionTitle label="Next set" />
          <div className="grid grid-cols-1 gap-2 min-[370px]:grid-cols-3">
            <EntryBox label="Weight" value={nextWeight} unit="lb" min={0} step={5} onChange={(value) => setNextWeight(sanitizeWeight(value))} />
            <EntryBox label="Reps" value={nextReps} unit="reps" min={1} step={1} onChange={(value) => setNextReps(sanitizeReps(value))} />
            <EntryBox label="RPE" value={nextRpe} unit="RPE" min={0} max={10} step={0.5} onChange={(value) => setNextRpe(sanitizeRpe(value))} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 min-[400px]:grid-cols-4">
            <MobileGhostButton onClick={() => setNextWeight((value) => sanitizeWeight(value - 5))}>-5 lb</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextWeight((value) => sanitizeWeight(value + 5))}>+5 lb</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextReps((value) => sanitizeReps(value - 1))}>-1 rep</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextReps((value) => sanitizeReps(value + 1))}>+1 rep</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextRpe((value) => sanitizeRpe(value - 0.5))}>-0.5 RPE</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextRpe((value) => sanitizeRpe(value + 0.5))}>+0.5 RPE</MobileGhostButton>
            <MobileGhostButton onClick={copyLastSet} className="flex items-center justify-center gap-2"><Copy className="h-4 w-4" />Copy</MobileGhostButton>
            <MobileGhostButton disabled={saving} onClick={repeatLastSet}>Repeat set</MobileGhostButton>
            <MobilePrimaryButton disabled={saving} onClick={() => void addSet(nextWeight, nextReps, nextRpe, "add")} className="col-span-2 min-[400px]:col-span-4">Add Set</MobilePrimaryButton>
          </div>
        </GlassCard>

        <div className="mt-4 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.035] py-3 text-sm text-slate-300">
          <button onClick={() => setNotice("Rest timer is local UI only for now; sets are saved.")} className="flex min-h-[44px] items-center justify-center gap-2"><Clock className="h-5 w-5" />Rest <span className="font-mono text-blue-400">01:22</span></button>
          <button onClick={() => setNotice("Notes are coming next; sets are saved locally now.")} className="flex min-h-[44px] items-center justify-center gap-2 border-l border-white/10"><MessageSquare className="h-5 w-5" />Note</button>
        </div>
      </GlassCard>

      <div className="space-y-3">
        {exercises.filter((exercise) => exercise.id !== activeExercise.id).map((exercise) => {
          const completed = exercise.sets.filter((set) => set.completed).length;
          const done = completed >= exercise.targetSets;
          return (
            <ListRow
              key={exercise.id}
              icon={Dumbbell}
              title={exercise.name}
              subtitle={exercise.muscles}
              tone={done ? "green" : "slate"}
              meta={<div className="flex items-center gap-2"><StatusPill tone={done ? "green" : "slate"}>{completed} / {exercise.targetSets} sets</StatusPill><ChevronDown className="h-5 w-5 text-slate-300" /></div>}
              onClick={() => selectExercise(exercise)}
            />
          );
        })}
      </div>

      <MobilePrimaryButton disabled={saving} onClick={() => void finishWorkout()} className="sticky bottom-28 z-10 flex h-14 w-full items-center justify-center gap-3 text-lg">
        <Check className="h-5 w-5 rounded-full border border-white" />Finish Workout
      </MobilePrimaryButton>
    </MobilePage>
  );
}

function buildWorkoutExercises(snapshot: MobileSnapshot, analyzer: MobileAnalyzerModel): WorkoutExercise[] {
  const exercisesById = new Map(snapshot.exercises.filter((exercise) => !exercise.deletedAt).map((exercise) => [exercise.id, exercise]));
  const rankedIds = [...analyzer.strengthRows.map((row) => row.exerciseId), ...snapshot.exercises.map((exercise) => exercise.id)];
  const uniqueIds = [...new Set(rankedIds)].filter((id) => exercisesById.has(id)).slice(0, 6);
  const activeSession = snapshot.sessions
    .filter((session) => !session.deletedAt && !session.finishedAt && session.importSource === "mobile-pwa")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const activeRows = snapshot.sessionExercises.filter((row) => !row.deletedAt && row.workoutSessionId === activeSession?.id);
  const prsBySetId = new Set(snapshot.personalRecords.filter((record) => !record.deletedAt && record.importSource === "mobile-workout").map((record) => record.setLogId).filter(Boolean));

  return uniqueIds.map((exerciseId) => {
    const exercise = exercisesById.get(exerciseId);
    if (!exercise) return null;
    const activeRow = activeRows.find((row) => row.exerciseId === exercise.id);
    const sets = activeRow
      ? snapshot.setLogs
        .filter((set) => !set.deletedAt && set.workoutSessionExerciseId === activeRow.id)
        .sort((a, b) => a.setNumber - b.setNumber)
        .map((set): LoggedSet => ({
          id: set.id,
          set: set.setNumber,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe ?? 0,
          e1rm: calculateE1rm(set.weight, set.reps),
          completed: set.isCompleted,
          pr: prsBySetId.has(set.id)
        }))
      : [];
    const history = historyForExercise(snapshot, exercise.id, activeSession?.id);
    return {
      id: exercise.id,
      name: exercise.name,
      muscles: [exercise.primaryMuscle, ...exercise.secondaryMuscles].filter(Boolean).slice(0, 3).join(", ") || "Custom exercise",
      targetSets: Math.max(sets.length, 3),
      previousBest: history.previousBest,
      lastTime: history.lastTime,
      sets
    };
  }).filter(Boolean) as WorkoutExercise[];
}

function historyForExercise(snapshot: MobileSnapshot, exerciseId: string, activeSessionId?: string): { previousBest: string; lastTime: string } {
  const rows = snapshot.sessionExercises.filter((row) => !row.deletedAt && row.exerciseId === exerciseId);
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const sessionsById = new Map(snapshot.sessions.filter((session) => !session.deletedAt).map((session) => [session.id, session]));
  const historicalSets = snapshot.setLogs
    .filter((set) => {
      const row = rowById.get(set.workoutSessionExerciseId);
      return !set.deletedAt && set.isCompleted && row && row.workoutSessionId !== activeSessionId;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const best = [...historicalSets].sort((a, b) => calculateE1rm(b.weight, b.reps) - calculateE1rm(a.weight, a.reps))[0];
  const latestSessionId = historicalSets.map((set) => rowById.get(set.workoutSessionExerciseId)?.workoutSessionId).find(Boolean);
  const latestSets = latestSessionId
    ? historicalSets
      .filter((set) => rowById.get(set.workoutSessionExerciseId)?.workoutSessionId === latestSessionId)
      .sort((a, b) => a.setNumber - b.setNumber)
    : [];
  const latestSession = latestSessionId ? sessionsById.get(latestSessionId) : undefined;
  return {
    previousBest: best ? `${formatNumber(best.weight)} lb x ${best.reps}` : "No previous best",
    lastTime: latestSets.length ? `${latestSets.map((set) => `${formatNumber(set.weight)}x${set.reps}`).join(", ")}${latestSession ? ` (${new Date(latestSession.startedAt).toLocaleDateString()})` : ""}` : "No previous session"
  };
}

function calculateE1rm(weight: number, reps: number) {
  return Math.round(weight * (1 + reps / 30));
}

function sanitizeWeight(value: number) {
  return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
}

function sanitizeReps(value: number) {
  return Math.max(1, Math.round(Number.isFinite(value) ? value : 1));
}

function sanitizeRpe(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, Math.round(value * 2) / 2));
}

function withSaveTimeout<T>(operation: Promise<T>, timeoutMs = 4500): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Phone storage took too long. Try again after reopening the app.")), timeoutMs);
    operation.then((value) => {
      window.clearTimeout(timeout);
      resolve(value);
    }, (error) => {
      window.clearTimeout(timeout);
      reject(error);
    });
  });
}

function TopMetric({ icon, value, label }: { icon: typeof Dumbbell; value: string; label: string }) {
  return <MetricChip icon={icon} value={value} label={label} />;
}

function SetTable({ sets, onToggle }: { sets: LoggedSet[]; onToggle: (set: LoggedSet) => void }) {
  if (!sets.length) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.035] p-4 text-center text-sm text-slate-400">
        No sets logged yet. Enter the next set below and tap Add Set.
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 grid grid-cols-[0.7fr_1.3fr_0.8fr_0.8fr_1.1fr_1.4rem] px-2 text-[0.58rem] font-black uppercase tracking-widest text-slate-500">
        <span>Set</span><span>Weight</span><span>Reps</span><span>RPE</span><span>e1RM</span><span />
      </div>
      <div className="mt-2 space-y-1.5">
        {sets.map((row) => (
          <button key={row.id} onClick={() => onToggle(row)} className={`grid min-h-[48px] w-full grid-cols-[0.7fr_1.3fr_0.8fr_0.8fr_1.1fr_1.4rem] items-center rounded-xl border border-white/10 px-2 py-3 text-left font-mono text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 ${row.pr ? "border-l-4 border-l-blue-500 bg-blue-500/10 text-blue-300" : row.completed ? "bg-black/12 text-slate-100" : "bg-white/[0.035] text-slate-500"}`}>
            <span className="font-black">{row.set}</span>
            <span className="font-bold">{row.weight} lb</span>
            <span>{row.reps}</span>
            <span>{row.rpe}</span>
            <span className="font-black">{row.e1rm}{row.pr ? " PR" : ""}</span>
            {row.completed ? <Check className="h-5 w-5 rounded-full border-2 border-emerald-400 p-0.5 text-emerald-400" /> : <Circle className="h-6 w-6 text-blue-500" />}
          </button>
        ))}
      </div>
    </>
  );
}

function EntryBox({ label, value, unit, min, max, step, onChange }: { label: string; value: number; unit: string; min: number; max?: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      <span className="mt-2 flex items-end gap-1">
        <input
          aria-label={label}
          className="min-h-[54px] min-w-0 flex-1 bg-transparent font-mono text-[2rem] font-black leading-none text-white outline-none focus:text-blue-300"
          inputMode="decimal"
          max={max}
          min={min}
          step={step}
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span className="pb-3 text-xs text-slate-400">{unit}</span>
      </span>
    </label>
  );
}
