import { useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock, Copy, Dumbbell, List, MessageSquare, MoreHorizontal, Trophy, Zap } from "lucide-react";
import type { MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel } from "../features/analytics/mobileAnalytics";
import type { MobileTab } from "../types";
import { formatNumber } from "./AnalyzerShared";

type BenchSet = {
  set: number;
  weight: number;
  reps: number;
  rpe: number;
  e1rm: number;
  completed: boolean;
  pr?: boolean;
};

const initialSets: BenchSet[] = [
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
  const [notice, setNotice] = useState("Preview controls are active on this phone. Permanent workout logging still belongs in desktop for now.");
  const [activeExercise, setActiveExercise] = useState("Bench Press");
  const completedSets = sets.filter((set) => set.completed).length;
  const volume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
  const topE1rm = Math.max(...sets.map((set) => set.e1rm));

  const addSet = () => {
    const e1rm = Math.round(nextWeight * (1 + nextReps / 30));
    setSets((current) => [...current, { set: current.length + 1, weight: nextWeight, reps: nextReps, rpe: nextRpe, e1rm, completed: false, pr: e1rm > topE1rm }]);
    setNotice(`Added preview set ${sets.length + 1}: ${nextWeight} lb x ${nextReps} @ RPE ${nextRpe}. This is local UI preview only.`);
  };

  const copyLastSet = () => {
    const last = sets[sets.length - 1];
    setNextWeight(last.weight);
    setNextReps(last.reps);
    setNextRpe(last.rpe);
    setNotice("Copied the last set into the next-set controls.");
  };

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between pt-1">
        <button onClick={() => onNavigate("home")} aria-label="Back to Home"><ChevronLeft className="h-9 w-9 text-white" /></button>
        <div className="text-center">
          <div className="text-xl font-black leading-tight min-[400px]:text-2xl">Upper Strength - Active</div>
          <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-400"><Clock className="h-4 w-4" />01:22 elapsed</div>
        </div>
        <button onClick={() => setNotice("Workout menu opened. Desktop remains the source of truth for saved workouts.")} aria-label="Workout menu" className="grid h-8 w-8 place-items-center rounded-full border border-white/70"><MoreHorizontal className="h-5 w-5" /></button>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
        <div className="grid grid-cols-4 divide-x divide-white/10">
          <TopMetric icon={Dumbbell} value={formatNumber(volume)} label="Volume (lb)" />
          <TopMetric icon={List} value={formatNumber(sets.length)} label="Sets" />
          <TopMetric icon={Trophy} value={formatNumber(sets.filter((set) => set.pr).length)} label="PRs" />
          <TopMetric icon={Zap} value={formatNumber(topE1rm)} label="Est. 1RM" />
        </div>
      </section>
      <div>
        <div className="h-1.5 rounded-full bg-slate-700"><div className="h-full w-4/5 rounded-full bg-blue-500" /></div>
        <div className="mt-2 flex justify-between text-sm text-slate-400"><span>4 of 5 exercises</span><span>80%</span></div>
      </div>
      <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-3 text-sm leading-relaxed text-slate-200">{notice}</div>

      <section className="rounded-[1.55rem] border border-white/12 bg-[linear-gradient(135deg,rgba(26,35,51,.92),rgba(10,15,24,.94))] p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <ExerciseIcon icon={Dumbbell} />
            <div>
              <div className="text-xl font-black min-[400px]:text-2xl">{activeExercise}</div>
              <div className="mt-1 text-slate-400">Chest, triceps, front delts</div>
            </div>
          </div>
          <button onClick={() => setNotice(`${activeExercise} is expanded.`)} className="flex items-center gap-2"><span className="rounded-full bg-blue-500 px-3 py-2 text-sm font-bold min-[400px]:px-4 min-[400px]:text-base">{completedSets} of {sets.length} sets</span><ChevronDown className="h-5 w-5" /></button>
        </div>
        <button onClick={() => setNotice("Last session: 205x8, 215x6, 225x4. Previous best: 225 lb x 5.")} className="mt-4 grid w-full grid-cols-2 rounded-2xl border border-white/10 bg-black/10 p-3 text-left">
          <div><div className="text-xs text-slate-400">Previous best</div><div className="mt-1 font-mono">225 lb x 5</div></div>
          <div className="flex items-center justify-between border-l border-white/10 pl-4"><div><div className="text-xs text-slate-400">Last time</div><div className="mt-1 font-mono">205x8, 215x6, 225x4</div></div><ChevronRight /></div>
        </button>
        <div className="mt-4 grid grid-cols-[1fr_1.35fr_0.85fr_0.8fr_1.2fr_1.6rem] px-3 text-[0.58rem] font-black uppercase tracking-widest text-slate-500 min-[400px]:grid-cols-[1fr_1.4fr_1fr_1fr_1.3fr_2rem] min-[400px]:px-4 min-[400px]:text-[0.65rem]">
          <span>Set</span><span>Weight</span><span>Reps</span><span>RPE</span><span>e1RM</span><span />
        </div>
        <div className="mt-2 space-y-1.5">
          {sets.map((row) => (
            <button key={row.set} onClick={() => setNotice(`Set ${row.set}: ${row.weight} lb x ${row.reps}, estimated 1RM ${row.e1rm} lb.`)} className={`grid w-full grid-cols-[1fr_1.35fr_0.85fr_0.8fr_1.2fr_1.6rem] items-center rounded-xl border border-white/10 px-3 py-3 text-left font-mono text-sm min-[400px]:grid-cols-[1fr_1.4fr_1fr_1fr_1.3fr_2rem] min-[400px]:px-4 min-[400px]:text-lg ${row.pr ? "border-l-4 border-l-blue-500 bg-blue-500/10" : "bg-black/12"}`}>
              <span className={row.pr ? "font-black text-blue-400" : ""}>{row.set}</span>
              <span className="font-bold">{row.weight} lb</span><span>{row.reps}</span><span>{row.rpe}</span>
              <span className={row.pr ? "font-black text-blue-400" : ""}>{row.e1rm}{row.pr ? " PR" : ""}</span>
              {row.completed ? <Check className="h-6 w-6 rounded-full border-2 border-emerald-400 p-0.5 text-emerald-400" /> : <Circle className="h-7 w-7 text-blue-500" />}
            </button>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-blue-500/45 bg-black/20 p-4">
          <div className="text-sm font-black uppercase tracking-widest text-blue-400">Next set</div>
          <div className="mt-3 grid grid-cols-3 gap-2 min-[400px]:gap-3">
            <InputBox label="Weight" value={formatNumber(nextWeight)} unit="lb" />
            <InputBox label="Reps" value={formatNumber(nextReps)} unit="reps" />
            <InputBox label="RPE" value={formatNumber(nextRpe)} unit="RPE" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 min-[400px]:grid-cols-[1fr_1fr_1.8fr_1.8fr]">
            <SmallButton onClick={() => setNextWeight((value) => Math.max(0, value - 5))}>-5 lb</SmallButton>
            <SmallButton onClick={() => setNextWeight((value) => value + 5)}>+5 lb</SmallButton>
            <SmallButton onClick={copyLastSet}><Copy className="h-5 w-5" />Copy last set</SmallButton>
            <button onClick={addSet} className="min-h-12 rounded-xl bg-blue-500 font-black shadow-[0_0_24px_rgba(59,130,246,0.35)]">Add Set</button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 rounded-xl border border-white/10 py-3 text-sm text-slate-300">
          <button onClick={() => setNotice("Rest timer opened for this preview workout.")} className="flex items-center justify-center gap-3"><Clock />Rest Timer <span className="text-blue-400">01:22</span></button>
          <button onClick={() => setNotice("Notes are preview-only here. Save permanent workout notes in desktop.")} className="flex items-center justify-center gap-3 border-l border-white/10"><MessageSquare />Add to notes</button>
        </div>
      </section>

      {[
        ["Weighted Pull-Up", "3 sets, lats, biceps", "3 / 3 sets", "text-emerald-400"],
        ["Incline DB Press", "3 sets, upper chest", "3 / 3 sets", "text-emerald-400"],
        ["Cable Row", "3 sets, mid back", "0 / 3 sets", "text-slate-400"],
        ["Lateral Raise", "2 sets, shoulders", "0 / 2 sets", "text-slate-400"]
      ].map((item) => (
        <button key={item[0]} onClick={() => { setActiveExercise(item[0]); setNotice(`${item[0]} selected in the preview workout.`); }} className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left">
          <ExerciseIcon icon={Dumbbell} />
          <div className="min-w-0 flex-1"><div className="truncate text-lg font-black min-[400px]:text-xl">{item[0]}</div><div className="truncate text-sm text-slate-400">{item[1]}</div></div>
          <div className={`shrink-0 text-sm font-bold min-[400px]:text-base ${item[3]}`}>{item[2]}</div><ChevronDown className="h-5 w-5 shrink-0" />
        </button>
      ))}
      <button onClick={() => setNotice("Workout summary opened. This mobile Train screen is still a preview, so nothing was written to storage.")} className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-500 text-lg font-black shadow-[0_0_32px_rgba(59,130,246,0.4)] min-[400px]:h-16 min-[400px]:text-xl"><Check className="rounded-full border border-white" />Finish Workout</button>
    </div>
  );
}

function TopMetric({ icon: Icon, value, label }: { icon: typeof Dumbbell; value: string; label: string }) {
  return <div className="flex flex-col items-center justify-center gap-1 px-1 text-center min-[400px]:flex-row min-[400px]:gap-3 min-[400px]:px-2"><ExerciseIcon icon={Icon} compact /><div><div className="text-lg font-black min-[400px]:text-2xl">{value}</div><div className="text-[0.68rem] text-slate-400 min-[400px]:text-sm">{label}</div></div></div>;
}

function ExerciseIcon({ icon: Icon, compact = false }: { icon: typeof Dumbbell; compact?: boolean }) {
  return <div className={`${compact ? "h-11 w-11" : "h-14 w-14"} grid place-items-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400`}><Icon className={compact ? "h-6 w-6" : "h-8 w-8"} /></div>;
}

function InputBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2 min-[400px]:p-3"><div className="text-xs text-slate-400 min-[400px]:text-sm">{label}</div><div className="mt-2 flex items-end gap-1 min-[400px]:gap-2"><span className="font-mono text-3xl font-black min-[400px]:text-5xl">{value}</span><span className="pb-1 text-xs text-slate-400 min-[400px]:pb-2 min-[400px]:text-sm">{unit}</span></div></div>;
}

function SmallButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 text-sm font-bold text-slate-200">{children}</button>;
}
