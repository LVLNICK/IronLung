import { useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock, Copy, Dumbbell, List, MessageSquare, MoreHorizontal, Trophy, Zap } from "lucide-react";
import type { MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel } from "../features/analytics/mobileAnalytics";
import type { MobileTab } from "../types";
import { GlassCard, IconTile, ListRow, MetricChip, MobileGhostButton, MobilePage, MobilePrimaryButton, SectionTitle, StatusPill } from "../components/MobilePrimitives";
import { formatNumber } from "./AnalyzerShared";

type LoggedSet = {
  set: number;
  weight: number;
  reps: number;
  rpe: number;
  e1rm: number;
  completed: boolean;
  pr?: boolean;
};

type PreviewExercise = {
  id: string;
  name: string;
  muscles: string;
  targetSets: number;
  previousBest: string;
  lastTime: string;
  sets: LoggedSet[];
};

const initialExercises: PreviewExercise[] = [
  {
    id: "bench",
    name: "Bench Press",
    muscles: "Chest, triceps, front delts",
    targetSets: 4,
    previousBest: "225 lb x 5",
    lastTime: "205x8, 215x6, 225x4",
    sets: [
      makeSet(1, 135, 10, 6, true),
      makeSet(2, 185, 8, 7, true),
      makeSet(3, 205, 6, 8, true)
    ]
  },
  {
    id: "pullup",
    name: "Weighted Pull-Up",
    muscles: "Lats, biceps",
    targetSets: 3,
    previousBest: "+35 lb x 5",
    lastTime: "+25x8, +30x6, +35x5",
    sets: [makeSet(1, 25, 8, 7, true), makeSet(2, 30, 6, 8, true), makeSet(3, 35, 5, 9, true)]
  },
  {
    id: "incline-db",
    name: "Incline DB Press",
    muscles: "Upper chest",
    targetSets: 3,
    previousBest: "100 lb x 6",
    lastTime: "85x10, 90x8, 95x7",
    sets: [makeSet(1, 85, 10, 7, true), makeSet(2, 90, 8, 8, true)]
  },
  {
    id: "row",
    name: "Cable Row",
    muscles: "Mid back",
    targetSets: 3,
    previousBest: "180 lb x 10",
    lastTime: "150x12, 165x10, 180x8",
    sets: []
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    muscles: "Shoulders",
    targetSets: 2,
    previousBest: "30 lb x 15",
    lastTime: "25x15, 25x14",
    sets: []
  }
];

export function TrainPage({ onNavigate }: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel; onNavigate: (tab: MobileTab) => void }) {
  const [exercises, setExercises] = useState(initialExercises);
  const [activeExerciseId, setActiveExerciseId] = useState(initialExercises[0].id);
  const [nextWeight, setNextWeight] = useState(225);
  const [nextReps, setNextReps] = useState(5);
  const [nextRpe, setNextRpe] = useState(9);
  const [notice, setNotice] = useState("Preview session - changes stay on this screen");
  const [lastAddedPr, setLastAddedPr] = useState(false);
  const [finished, setFinished] = useState(false);

  const activeExercise = exercises.find((exercise) => exercise.id === activeExerciseId) ?? exercises[0];
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const completedSets = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0);
  const targetSets = exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0);
  const completedExercises = exercises.filter((exercise) => exercise.sets.filter((set) => set.completed).length >= exercise.targetSets).length;
  const volume = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).reduce((setSum, set) => setSum + set.weight * set.reps, 0), 0);
  const topE1rm = Math.max(0, ...exercises.flatMap((exercise) => exercise.sets.map((set) => set.e1rm)));
  const activeTopE1rm = Math.max(0, ...activeExercise.sets.map((set) => set.e1rm));
  const prCount = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.pr).length, 0);
  const progressPercent = Math.min(100, Math.round((completedExercises / exercises.length) * 100));

  // TODO: Replace this local preview state with repository-backed workout writes
  // once apps/mobile-pwa/src/data/mobileRepository.ts exposes create/update APIs
  // for sessions, sessionExercises, setLogs, operationLog entries, and PR recalculation.
  const updateActiveExercise = (updater: (exercise: PreviewExercise) => PreviewExercise) => {
    setExercises((current) => current.map((exercise) => exercise.id === activeExercise.id ? updater(exercise) : exercise));
  };

  const appendSet = (weight: number, reps: number, rpe: number, source: "add" | "repeat") => {
    const sanitizedWeight = sanitizeWeight(weight);
    const sanitizedReps = sanitizeReps(reps);
    const sanitizedRpe = sanitizeRpe(rpe);
    const e1rm = calculateE1rm(sanitizedWeight, sanitizedReps);
    const isPr = e1rm > activeTopE1rm;
    const newSet = {
      set: activeExercise.sets.length + 1,
      weight: sanitizedWeight,
      reps: sanitizedReps,
      rpe: sanitizedRpe,
      e1rm,
      completed: true,
      pr: isPr
    };

    updateActiveExercise((exercise) => ({ ...exercise, sets: [...exercise.sets, newSet] }));
    setNextWeight(sanitizedWeight);
    setNextReps(sanitizedReps);
    setNextRpe(sanitizedRpe);
    setLastAddedPr(isPr);
    setFinished(false);
    setNotice(isPr ? `${activeExercise.name}: preview PR detected at ${e1rm} lb e1RM.` : `${activeExercise.name}: ${source === "repeat" ? "repeated" : "added"} ${sanitizedWeight} lb x ${sanitizedReps}.`);
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
    appendSet(last.weight, last.reps, last.rpe, "repeat");
  };

  const toggleSetCompletion = (setNumber: number) => {
    updateActiveExercise((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => set.set === setNumber ? { ...set, completed: !set.completed } : set)
    }));
    setNotice(`${activeExercise.name} set ${setNumber} toggled.`);
  };

  const selectExercise = (exercise: PreviewExercise) => {
    const last = exercise.sets.at(-1);
    setActiveExerciseId(exercise.id);
    setNextWeight(last?.weight ?? 0);
    setNextReps(last?.reps ?? 8);
    setNextRpe(last?.rpe ?? 7);
    setLastAddedPr(false);
    setNotice(`${exercise.name} selected.`);
  };

  const finishWorkout = () => {
    setFinished(true);
    setNotice(`Preview summary: ${completedSets} sets, ${formatNumber(volume)} lb volume, ${prCount} PR${prCount === 1 ? "" : "s"}.`);
  };

  return (
    <MobilePage>
      <header className="flex items-start justify-between pt-1">
        <button onClick={() => onNavigate("home")} aria-label="Back to Home" className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><ChevronLeft className="h-7 w-7 text-white" /></button>
        <div className="min-w-0 px-2 text-center">
          <div className="truncate text-xl font-black leading-tight min-[400px]:text-2xl">Upper Strength - Active</div>
          <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-400"><Clock className="h-4 w-4" />01:22 elapsed</div>
        </div>
        <button onClick={() => setNotice("Menu: persistence export is not wired for preview sessions yet.")} aria-label="Workout menu" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><MoreHorizontal className="h-5 w-5" /></button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusPill tone={finished ? "green" : "slate"}>{finished ? "Finished preview" : notice}</StatusPill>
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
            <MobileGhostButton onClick={repeatLastSet}>Repeat set</MobileGhostButton>
            <MobilePrimaryButton onClick={() => appendSet(nextWeight, nextReps, nextRpe, "add")} className="col-span-2 min-[400px]:col-span-4">Add Set</MobilePrimaryButton>
          </div>
        </GlassCard>

        <div className="mt-4 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.035] py-3 text-sm text-slate-300">
          <button onClick={() => setNotice("Rest timer ready. Full timer persistence is future work.")} className="flex min-h-[44px] items-center justify-center gap-2"><Clock className="h-5 w-5" />Rest <span className="font-mono text-blue-400">01:22</span></button>
          <button onClick={() => setNotice("Notes are not persisted in preview sessions yet.")} className="flex min-h-[44px] items-center justify-center gap-2 border-l border-white/10"><MessageSquare className="h-5 w-5" />Note</button>
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

      <MobilePrimaryButton onClick={finishWorkout} className="sticky bottom-28 z-10 flex h-14 w-full items-center justify-center gap-3 text-lg">
        <Check className="h-5 w-5 rounded-full border border-white" />Finish Workout
      </MobilePrimaryButton>
    </MobilePage>
  );
}

function makeSet(set: number, weight: number, reps: number, rpe: number, completed: boolean, pr = false): LoggedSet {
  return { set, weight, reps, rpe, completed, pr, e1rm: calculateE1rm(weight, reps) };
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

function TopMetric({ icon, value, label }: { icon: typeof Dumbbell; value: string; label: string }) {
  return <MetricChip icon={icon} value={value} label={label} />;
}

function SetTable({ sets, onToggle }: { sets: LoggedSet[]; onToggle: (setNumber: number) => void }) {
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
          <button key={row.set} onClick={() => onToggle(row.set)} className={`grid min-h-[48px] w-full grid-cols-[0.7fr_1.3fr_0.8fr_0.8fr_1.1fr_1.4rem] items-center rounded-xl border border-white/10 px-2 py-3 text-left font-mono text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 ${row.pr ? "border-l-4 border-l-blue-500 bg-blue-500/10 text-blue-300" : row.completed ? "bg-black/12 text-slate-100" : "bg-white/[0.035] text-slate-500"}`}>
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
