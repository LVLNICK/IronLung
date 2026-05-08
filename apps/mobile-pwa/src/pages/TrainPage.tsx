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

const initialSets: LoggedSet[] = [
  { set: 1, weight: 135, reps: 10, rpe: 6, e1rm: 180, completed: true },
  { set: 2, weight: 185, reps: 8, rpe: 7, e1rm: 234, completed: true },
  { set: 3, weight: 205, reps: 6, rpe: 8, e1rm: 246, completed: true },
  { set: 4, weight: 225, reps: 5, rpe: 9, e1rm: 263, completed: false, pr: true }
];

export function TrainPage({ onNavigate }: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel; onNavigate: (tab: MobileTab) => void }) {
  const [sets, setSets] = useState(initialSets);
  const [nextWeight, setNextWeight] = useState(230);
  const [nextReps, setNextReps] = useState(5);
  const [nextRpe, setNextRpe] = useState(9);
  const [notice, setNotice] = useState("Local preview mode");
  const [lastAddedPr, setLastAddedPr] = useState(false);
  const [activeExercise, setActiveExercise] = useState("Bench Press");
  const completedSets = sets.filter((set) => set.completed).length;
  const volume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
  const topE1rm = Math.max(...sets.map((set) => set.e1rm));
  const prCount = sets.filter((set) => set.pr).length;

  // TODO: Replace this local preview state with repository-backed workout writes
  // once apps/mobile-pwa/src/data/mobileRepository.ts exposes create/update
  // APIs for sessions, sessionExercises, setLogs, operationLog entries, and PR
  // recalculation. Until then this screen must not claim persisted saves.
  const addSet = () => {
    const sanitizedWeight = Math.max(0, Math.round(nextWeight));
    const sanitizedReps = Math.max(1, Math.round(nextReps));
    const sanitizedRpe = Math.max(0, Math.min(10, Math.round(nextRpe * 2) / 2));
    const e1rm = Math.round(sanitizedWeight * (1 + sanitizedReps / 30));
    const isPr = e1rm > topE1rm;
    setNextWeight(sanitizedWeight);
    setNextReps(sanitizedReps);
    setNextRpe(sanitizedRpe);
    setSets((current) => [...current, { set: current.length + 1, weight: sanitizedWeight, reps: sanitizedReps, rpe: sanitizedRpe, e1rm, completed: false, pr: isPr }]);
    setLastAddedPr(isPr);
    setNotice(isPr ? "Preview PR detected" : `Preview set added: ${sanitizedWeight} lb x ${sanitizedReps}.`);
  };

  const copyLastSet = () => {
    const last = sets[sets.length - 1];
    setNextWeight(last.weight);
    setNextReps(last.reps);
    setNextRpe(last.rpe);
    setNotice("Copied last set into the entry row.");
  };

  const repeatLastSet = () => {
    const last = sets[sets.length - 1];
    const e1rm = Math.round(last.weight * (1 + last.reps / 30));
    const isPr = e1rm > topE1rm;
    setNextWeight(last.weight);
    setNextReps(last.reps);
    setNextRpe(last.rpe);
    setSets((current) => [...current, { set: current.length + 1, weight: last.weight, reps: last.reps, rpe: last.rpe, e1rm, completed: false, pr: isPr }]);
    setLastAddedPr(isPr);
    setNotice(`Repeated preview set: ${last.weight} lb x ${last.reps}.`);
  };

  return (
    <MobilePage>
      <header className="flex items-start justify-between pt-1">
        <button onClick={() => onNavigate("home")} aria-label="Back to Home" className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><ChevronLeft className="h-7 w-7 text-white" /></button>
        <div className="text-center">
          <div className="text-xl font-black leading-tight min-[400px]:text-2xl">Upper Strength - Active</div>
          <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-400"><Clock className="h-4 w-4" />01:22 elapsed</div>
        </div>
        <button onClick={() => setNotice("Workout actions are local preview only.")} aria-label="Workout menu" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><MoreHorizontal className="h-5 w-5" /></button>
      </header>

      <div className="flex items-center justify-between gap-3">
        <StatusPill tone="slate">{notice}</StatusPill>
        {lastAddedPr && <StatusPill tone="green">New PR</StatusPill>}
        <span className="text-xs text-slate-500">Phone-local UI</span>
      </div>

      <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-4">
        <TopMetric icon={Dumbbell} value={formatNumber(volume)} label="Volume" />
        <TopMetric icon={List} value={formatNumber(sets.length)} label="Sets" />
        <TopMetric icon={Trophy} value={formatNumber(prCount)} label="PRs" />
        <TopMetric icon={Zap} value={formatNumber(topE1rm)} label="e1RM" />
      </div>

      <div>
        <div className="h-2 rounded-full bg-slate-800"><div className="h-full w-4/5 rounded-full bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.38)]" /></div>
        <div className="mt-2 flex justify-between text-sm text-slate-400"><span>4 of 5 exercises</span><span>80%</span></div>
      </div>

      <GlassCard className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <IconTile icon={Dumbbell} size="large" />
            <div className="min-w-0">
              <div className="truncate text-2xl font-black">{activeExercise}</div>
              <div className="mt-1 text-sm text-slate-400">Chest, triceps, front delts</div>
            </div>
          </div>
          <button onClick={() => setNotice(`${activeExercise} selected`)} className="flex shrink-0 items-center gap-2"><StatusPill>{completedSets} / {sets.length}</StatusPill><ChevronDown className="h-5 w-5" /></button>
        </div>

        <button onClick={() => setNotice("Previous best and last-time performance opened.")} className="mt-4 grid w-full grid-cols-2 rounded-2xl border border-white/10 bg-black/15 p-3 text-left">
          <div>
            <div className="text-xs text-slate-500">Previous best</div>
            <div className="mt-1 font-mono text-base">225 lb x 5</div>
          </div>
          <div className="flex items-center justify-between border-l border-white/10 pl-4">
            <div className="min-w-0">
              <div className="text-xs text-slate-500">Last time</div>
              <div className="mt-1 truncate font-mono text-sm">205x8, 215x6, 225x4</div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0" />
          </div>
        </button>

        <SetTable sets={sets} onSelect={(set) => setNotice(`Set ${set.set}: ${set.weight} lb x ${set.reps}, e1RM ${set.e1rm} lb.`)} />

        <GlassCard className="mt-5 border-blue-500/45 bg-blue-500/[0.06] p-4">
          <SectionTitle label="Next set" />
          <div className="grid grid-cols-3 gap-2">
            <EntryBox label="Weight" value={formatNumber(nextWeight)} unit="lb" />
            <EntryBox label="Reps" value={formatNumber(nextReps)} unit="reps" />
            <EntryBox label="RPE" value={formatNumber(nextRpe)} unit="RPE" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 min-[400px]:grid-cols-4">
            <MobileGhostButton onClick={() => setNextWeight((value) => Math.max(0, value - 5))}>-5 lb</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextWeight((value) => value + 5)}>+5 lb</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextReps((value) => Math.max(1, Math.round(value - 1)))}>-1 rep</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextReps((value) => Math.round(value + 1))}>+1 rep</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextRpe((value) => Math.max(0, Math.round((value - 0.5) * 2) / 2))}>-0.5 RPE</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextRpe((value) => Math.min(10, Math.round((value + 0.5) * 2) / 2))}>+0.5 RPE</MobileGhostButton>
            <MobileGhostButton onClick={copyLastSet} className="flex items-center justify-center gap-2"><Copy className="h-4 w-4" />Copy</MobileGhostButton>
            <MobileGhostButton onClick={repeatLastSet}>Repeat set</MobileGhostButton>
            <MobilePrimaryButton onClick={addSet} className="col-span-2 min-[400px]:col-span-4">Add Set</MobilePrimaryButton>
          </div>
        </GlassCard>

        <div className="mt-4 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.035] py-3 text-sm text-slate-300">
          <button onClick={() => setNotice("Rest timer opened.")} className="flex items-center justify-center gap-2"><Clock className="h-5 w-5" />Rest <span className="font-mono text-blue-400">01:22</span></button>
          <button onClick={() => setNotice("Note action opened in preview mode.")} className="flex items-center justify-center gap-2 border-l border-white/10"><MessageSquare className="h-5 w-5" />Note</button>
        </div>
      </GlassCard>

      <div className="space-y-3">
        {[
          ["Weighted Pull-Up", "Lats, biceps", "3 / 3", "green"],
          ["Incline DB Press", "Upper chest", "3 / 3", "green"],
          ["Cable Row", "Mid back", "0 / 3", "slate"],
          ["Lateral Raise", "Shoulders", "0 / 2", "slate"]
        ].map(([name, muscles, progress, tone]) => (
          <ListRow key={name} icon={Dumbbell} title={name} subtitle={muscles} tone={tone === "green" ? "green" : "slate"} meta={<div className="flex items-center gap-2"><StatusPill tone={tone === "green" ? "green" : "slate"}>{progress} sets</StatusPill><ChevronDown className="h-5 w-5 text-slate-300" /></div>} onClick={() => { setActiveExercise(name); setNotice(`${name} selected.`); }} />
        ))}
      </div>

      <MobilePrimaryButton onClick={() => setNotice("Finish summary opened in preview mode.")} className="sticky bottom-28 z-10 flex h-14 w-full items-center justify-center gap-3 text-lg">
        <Check className="h-5 w-5 rounded-full border border-white" />Finish Workout
      </MobilePrimaryButton>
    </MobilePage>
  );
}

function TopMetric({ icon, value, label }: { icon: typeof Dumbbell; value: string; label: string }) {
  return <MetricChip icon={icon} value={value} label={label} />;
}

function SetTable({ sets, onSelect }: { sets: LoggedSet[]; onSelect: (set: LoggedSet) => void }) {
  return (
    <>
      <div className="mt-4 grid grid-cols-[0.7fr_1.3fr_0.8fr_0.8fr_1.1fr_1.4rem] px-2 text-[0.58rem] font-black uppercase tracking-widest text-slate-500">
        <span>Set</span><span>Weight</span><span>Reps</span><span>RPE</span><span>e1RM</span><span />
      </div>
      <div className="mt-2 space-y-1.5">
        {sets.map((row) => (
          <button key={row.set} onClick={() => onSelect(row)} className={`grid w-full grid-cols-[0.7fr_1.3fr_0.8fr_0.8fr_1.1fr_1.4rem] items-center rounded-xl border border-white/10 px-2 py-3 text-left font-mono text-sm ${row.pr ? "border-l-4 border-l-blue-500 bg-blue-500/10 text-blue-300" : "bg-black/12 text-slate-100"}`}>
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

function EntryBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <div className="text-xs font-bold text-slate-400">{label}</div>
      <div className="mt-2 flex items-end gap-1">
        <span className="font-mono text-[2.2rem] font-black leading-none">{value}</span>
        <span className="pb-1 text-xs text-slate-400">{unit}</span>
      </div>
    </div>
  );
}
