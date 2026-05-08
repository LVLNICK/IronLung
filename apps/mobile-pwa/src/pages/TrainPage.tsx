import { Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock, Copy, Dumbbell, List, MessageSquare, MoreHorizontal, Trophy, Zap } from "lucide-react";
import type { MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel } from "../features/analytics/mobileAnalytics";

export function TrainPage(_: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel }) {
  const rows = [
    ["1", "135 lb", "10", "6", "180", true],
    ["2", "185 lb", "8", "7", "234", true],
    ["3", "205 lb", "6", "8", "246", true],
    ["4", "225 lb", "5", "9", "263 PR", false]
  ] as const;
  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between pt-1">
        <ChevronLeft className="h-9 w-9 text-white" />
        <div className="text-center">
          <div className="text-xl font-black leading-tight min-[400px]:text-2xl">Upper Strength — Active</div>
          <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-400"><Clock className="h-4 w-4" />01:22 elapsed</div>
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-full border border-white/70"><MoreHorizontal className="h-5 w-5" /></div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
        <div className="grid grid-cols-4 divide-x divide-white/10">
          <TopMetric icon={Dumbbell} value="12,840" label="Volume (lb)" />
          <TopMetric icon={List} value="18" label="Sets" />
          <TopMetric icon={Trophy} value="2" label="PRs" />
          <TopMetric icon={Zap} value="205" label="Est. 1RM" />
        </div>
      </section>
      <div>
        <div className="h-1.5 rounded-full bg-slate-700"><div className="h-full w-4/5 rounded-full bg-blue-500" /></div>
        <div className="mt-2 flex justify-between text-sm text-slate-400"><span>4 of 5 exercises</span><span>80%</span></div>
      </div>

      <section className="rounded-[1.55rem] border border-white/12 bg-[linear-gradient(135deg,rgba(26,35,51,.92),rgba(10,15,24,.94))] p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <ExerciseIcon icon={Dumbbell} />
            <div>
              <div className="text-xl font-black min-[400px]:text-2xl">Bench Press</div>
              <div className="mt-1 text-slate-400">Chest • Triceps • Front Delts</div>
            </div>
          </div>
          <div className="flex items-center gap-2"><span className="rounded-full bg-blue-500 px-3 py-2 text-sm font-bold min-[400px]:px-4 min-[400px]:text-base">4 of 4 sets</span><ChevronDown className="h-5 w-5" /></div>
        </div>
        <div className="mt-4 grid grid-cols-2 rounded-2xl border border-white/10 bg-black/10 p-3">
          <div><div className="text-xs text-slate-400">Previous best</div><div className="mt-1 font-mono">225 lb x 5</div></div>
          <div className="flex items-center justify-between border-l border-white/10 pl-4"><div><div className="text-xs text-slate-400">Last time</div><div className="mt-1 font-mono">205x8, 215x6, 225x4</div></div><ChevronRight /></div>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_1.35fr_0.85fr_0.8fr_1.2fr_1.6rem] px-3 text-[0.58rem] font-black uppercase tracking-widest text-slate-500 min-[400px]:grid-cols-[1fr_1.4fr_1fr_1fr_1.3fr_2rem] min-[400px]:px-4 min-[400px]:text-[0.65rem]">
          <span>Set</span><span>Weight</span><span>Reps</span><span>RPE</span><span>e1RM</span><span />
        </div>
        <div className="mt-2 space-y-1.5">
          {rows.map((row) => (
            <div key={row[0]} className={`grid grid-cols-[1fr_1.35fr_0.85fr_0.8fr_1.2fr_1.6rem] items-center rounded-xl border border-white/10 px-3 py-3 font-mono text-sm min-[400px]:grid-cols-[1fr_1.4fr_1fr_1fr_1.3fr_2rem] min-[400px]:px-4 min-[400px]:text-lg ${row[0] === "4" ? "border-l-4 border-l-blue-500 bg-blue-500/10" : "bg-black/12"}`}>
              <span className={row[0] === "4" ? "font-black text-blue-400" : ""}>{row[0]}</span>
              <span className="font-bold">{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span>
              <span className={row[0] === "4" ? "font-black text-blue-400" : ""}>{row[4]}</span>
              {row[5] ? <Check className="h-6 w-6 rounded-full border-2 border-emerald-400 p-0.5 text-emerald-400" /> : <Circle className="h-7 w-7 text-blue-500" />}
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-blue-500/45 bg-black/20 p-4">
          <div className="text-sm font-black uppercase tracking-widest text-blue-400">Next set</div>
          <div className="mt-3 grid grid-cols-3 gap-2 min-[400px]:gap-3">
            <InputBox label="Weight" value="230" unit="lb" />
            <InputBox label="Reps" value="5" unit="reps" />
            <InputBox label="RPE" value="9" unit="RPE" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 min-[400px]:grid-cols-[1fr_1fr_1.8fr_1.8fr]">
            <SmallButton>-5 lb</SmallButton><SmallButton>+5 lb</SmallButton><SmallButton><Copy className="h-5 w-5" />Copy last set</SmallButton>
            <button className="rounded-xl bg-blue-500 font-black shadow-[0_0_24px_rgba(59,130,246,0.35)]">Add Set</button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 rounded-xl border border-white/10 py-3 text-sm text-slate-300">
          <div className="flex items-center justify-center gap-3"><Clock />Rest Timer <span className="text-blue-400">01:22</span></div>
          <div className="flex items-center justify-center gap-3 border-l border-white/10"><MessageSquare />Add to notes</div>
        </div>
      </section>

      {[
        ["Weighted Pull-Up", "3 sets • Lats • Biceps", "3 / 3 sets", "text-emerald-400"],
        ["Incline DB Press", "3 sets • Upper Chest", "3 / 3 sets", "text-emerald-400"],
        ["Cable Row", "3 sets • Mid Back", "0 / 3 sets", "text-slate-400"],
        ["Lateral Raise", "2 sets • Shoulders", "0 / 2 sets", "text-slate-400"]
      ].map((item) => (
        <div key={item[0]} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
          <ExerciseIcon icon={Dumbbell} />
          <div className="min-w-0 flex-1"><div className="truncate text-lg font-black min-[400px]:text-xl">{item[0]}</div><div className="truncate text-sm text-slate-400">{item[1]}</div></div>
          <div className={`shrink-0 text-sm font-bold min-[400px]:text-base ${item[3]}`}>{item[2]}</div><ChevronDown className="h-5 w-5 shrink-0" />
        </div>
      ))}
      <button className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-500 text-lg font-black shadow-[0_0_32px_rgba(59,130,246,0.4)] min-[400px]:h-16 min-[400px]:text-xl"><Check className="rounded-full border border-white" />Finish Workout</button>
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

function SmallButton({ children }: { children: React.ReactNode }) {
  return <button className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 text-sm font-bold text-slate-200">{children}</button>;
}
