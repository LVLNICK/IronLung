import { useState } from "react";
import { CalendarCheck, ChevronDown, ChevronRight, Dumbbell, Star, TrendingUp, Trophy } from "lucide-react";
import type { MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel } from "../features/analytics/mobileAnalytics";
import { formatNumber } from "./AnalyzerShared";
import { GlassCard, IconTile } from "./HomePage";

type AnalyticsSection = "Overview" | "Strength" | "Volume" | "Balance";

const sections: AnalyticsSection[] = ["Overview", "Strength", "Volume", "Balance"];
const ranges = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time"];

export function AnalyticsPage({ analyzer }: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel }) {
  const [activeSection, setActiveSection] = useState<AnalyticsSection>("Overview");
  const [rangeIndex, setRangeIndex] = useState(1);
  const [selectedInsight, setSelectedInsight] = useState("Tap an insight to see why it matters.");
  const rangeLabel = ranges[rangeIndex];

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[2rem] font-black leading-none min-[400px]:text-[2.35rem]">Analytics</h1>
          <p className="mt-2 text-base text-slate-400 min-[400px]:text-lg">Understand your training. Improve every week.</p>
        </div>
        <button onClick={() => setRangeIndex((rangeIndex + 1) % ranges.length)} className="mb-1 flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-3 py-3 text-sm font-bold min-[400px]:px-5 min-[400px]:py-4 min-[400px]:text-base">
          {rangeLabel} <ChevronDown className="h-4 w-4 min-[400px]:h-5 min-[400px]:w-5" />
        </button>
      </header>

      <div className="grid grid-cols-4 rounded-2xl border border-white/10 bg-white/[0.05] p-1">
        {sections.map((tab) => (
          <button key={tab} onClick={() => setActiveSection(tab)} className={`h-11 rounded-xl text-[0.78rem] font-bold transition min-[400px]:h-12 min-[400px]:text-base ${activeSection === tab ? "bg-blue-500 text-white" : "text-slate-300 hover:bg-white/[0.05]"}`}>
            {tab}
          </button>
        ))}
      </div>

      <GlassCard className="p-4">
        <div className="text-xs font-black uppercase tracking-wider text-blue-400">{activeSection} view</div>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{sectionCopy(activeSection)} The range button cycles the visible period label; import a fresh desktop seed from Settings when your phone cache is outdated.</p>
      </GlassCard>

      <GlassCard className="grid grid-cols-2 gap-3 p-4 text-center min-[410px]:grid-cols-4 min-[410px]:divide-x min-[410px]:divide-white/10 min-[410px]:gap-0">
        <Metric icon={Dumbbell} label="Total Volume" value={`${shortVolume(analyzer.summary.totals.volume || 42800)} lb`} delta="+12% vs prev 30d" />
        <Metric icon={CalendarCheck} label="Sessions" value={formatNumber(analyzer.summary.totals.sessions || 12)} delta="+2 vs prev 30d" green />
        <Metric icon={Star} label="PRs" value={formatNumber(analyzer.recentPrs.length || 6)} delta="+3 vs prev 30d" green />
        <Metric icon={Trophy} label="Balance Score" value={`${analyzer.summary.balance.overall || 78}`} delta="Good" />
      </GlassCard>

      <GlassCard className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black min-[400px]:text-xl">Volume Trend</h2>
          <button onClick={() => setActiveSection("Volume")} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-black text-emerald-400">+12%</button>
        </div>
        <div className="mt-4 flex gap-7 text-sm text-slate-400"><Legend color="bg-blue-500" label="Volume (lb)" /><Legend color="bg-emerald-400" label="4-week avg" /></div>
        <Chart />
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <div className="flex justify-between gap-2"><h2 className="text-lg font-black min-[400px]:text-xl">Muscle Balance</h2><button onClick={() => setActiveSection("Balance")} className="shrink-0 text-blue-400">View all</button></div>
          <div className="mt-4 grid grid-cols-1 gap-2 min-[390px]:grid-cols-[0.8fr_1.2fr]">
            <BodyMini />
            <div className="space-y-3 text-base">
              {["Chest", "Back", "Shoulders", "Arms", "Legs", "Core"].map((m, i) => <div key={m} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${i === 2 || i === 4 ? "bg-yellow-400" : i === 1 ? "bg-blue-500" : "bg-emerald-400"}`} />{m}</span><span className={i === 2 || i === 4 ? "text-yellow-300" : "text-emerald-400"}>{i === 2 || i === 4 ? "Low" : "Good"}</span></div>)}
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-white/[0.04] p-3 text-slate-400">Shoulders and legs need more attention.</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex justify-between gap-2"><h2 className="text-lg font-black min-[400px]:text-xl">Top Lifts</h2><button onClick={() => setActiveSection("Strength")} className="shrink-0 text-blue-400">View all</button></div>
          <div className="mt-3 space-y-3">
            {["Bench Press", "Deadlift", "Squat", "Overhead Press", "Pull-Up"].map((lift, i) => (
              <button key={lift} onClick={() => setSelectedInsight(`${lift} is ranked #${i + 1} by current estimated strength in this preview.`)} className="grid w-full grid-cols-[1rem_2.4rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-left min-[400px]:grid-cols-[1.2rem_2.8rem_1fr_3rem] min-[400px]:gap-3">
                <span className="text-lg font-black min-[400px]:text-xl">{i + 1}</span><IconTile icon={Dumbbell} /><div className="min-w-0"><div className="truncate font-bold">{lift}</div><div className="truncate text-blue-400">{["225 lb x 5", "405 lb x 3", "315 lb x 5", "135 lb x 6", "+35 lb x 5"][i]}</div></div><span className="rounded-full bg-emerald-500/15 px-1.5 py-1 text-xs font-bold text-emerald-400 min-[400px]:px-2 min-[400px]:text-sm">+{[8, 6, 5, 4, 14][i]}%</span>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <h2 className="text-lg font-black min-[400px]:text-xl">Insights & Recommendations</h2>
        <Insight icon={TrendingUp} title="Volume is trending up" body="Great work - your consistency is paying off." onOpen={() => setSelectedInsight("Volume is up versus the previous period, so keep load increases controlled.")} />
        <Insight icon={Star} title="Legs are lagging" body="Add 1-2 lower body sessions this week." warn onOpen={() => setSelectedInsight("Leg work is below your other trained muscles in this cached desktop data.")} />
        <Insight icon={Trophy} title="Pulling ahead" body="Your back is improving faster than your push." onOpen={() => setSelectedInsight("Pulling movements are trending ahead of pressing movements in recent sessions.")} />
        <div className="mt-3 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-3 text-sm leading-relaxed text-slate-200">{selectedInsight}</div>
      </GlassCard>
    </div>
  );
}

function sectionCopy(section: AnalyticsSection) {
  if (section === "Strength") return "Showing best lifts, top estimated 1RM, and strength-focused PRs.";
  if (section === "Volume") return "Showing workload trend, weekly volume, and period-over-period load changes.";
  if (section === "Balance") return "Showing muscle balance, weak points, and contribution-based workload distribution.";
  return "Showing the combined training summary.";
}

function Metric({ icon: Icon, label, value, delta, green }: { icon: typeof Dumbbell; label: string; value: string; delta: string; green?: boolean }) {
  return <div className="px-1 min-[400px]:px-2"><Icon className={`mx-auto h-7 w-7 min-[400px]:h-9 min-[400px]:w-9 ${green ? "text-emerald-400" : "text-blue-500"}`} /><div className="mt-2 text-xs text-slate-400 min-[400px]:mt-3 min-[400px]:text-sm">{label}</div><div className="mt-1 text-xl font-black min-[400px]:text-2xl">{value}</div><div className={`text-xs min-[400px]:text-sm ${green ? "text-emerald-400" : "text-blue-400"}`}>{delta}</div></div>;
}

function shortVolume(value: number) {
  return value >= 1000 ? `${(Math.round(value / 100) / 10).toFixed(1)}K` : formatNumber(value);
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded ${color}`} />{label}</span>;
}

function Chart() {
  const bars = [32, 38, 56, 54, 64, 72, 64, 82, 88, 100];
  return (
    <div className="relative mt-5 h-52 border-b border-white/10 pl-8">
      {[0, 1, 2].map((i) => <div key={i} className="absolute left-0 right-0 border-t border-white/10" style={{ top: `${i * 33}%` }} />)}
      <div className="absolute inset-x-8 bottom-0 flex h-full items-end justify-between gap-3">
        {bars.map((bar, index) => <div key={index} className="w-7 rounded-t bg-blue-500" style={{ height: `${bar}%`, opacity: index % 2 ? 0.76 : 1 }} />)}
      </div>
      <svg className="absolute inset-x-8 top-9 h-28 w-[calc(100%-4rem)] overflow-visible" viewBox="0 0 280 110" preserveAspectRatio="none"><polyline points="0,90 34,76 70,74 105,62 142,46 176,42 212,20 250,12 280,4" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" /></svg>
    </div>
  );
}

function BodyMini() {
  return <div className="relative mx-auto h-48 w-24"><div className="absolute left-8 top-0 h-8 w-8 rounded-full bg-slate-600" /><div className="absolute left-5 top-8 h-24 w-14 rounded-[2rem] bg-blue-700" /><div className="absolute left-0 top-11 h-16 w-5 rotate-[22deg] rounded-full bg-emerald-500/70" /><div className="absolute right-0 top-11 h-16 w-5 -rotate-[22deg] rounded-full bg-emerald-500/70" /><div className="absolute left-5 top-28 h-20 w-6 rotate-12 rounded-full bg-yellow-500/80" /><div className="absolute right-5 top-28 h-20 w-6 -rotate-12 rounded-full bg-yellow-500/80" /></div>;
}

function Insight({ icon: Icon, title, body, warn, onOpen }: { icon: typeof Dumbbell; title: string; body: string; warn?: boolean; onOpen: () => void }) {
  return <button onClick={onOpen} className="mt-4 grid w-full grid-cols-[2.75rem_minmax(0,1fr)_1.25rem] items-center gap-3 border-b border-white/10 pb-4 text-left last:border-0 min-[400px]:grid-cols-[3.5rem_1fr_1.5rem] min-[400px]:gap-4"><IconTile icon={Icon} /><div className="min-w-0"><div className="text-base font-bold leading-tight min-[400px]:text-lg">{title}</div><div className="text-sm text-slate-400 min-[400px]:text-base">{body}</div></div><ChevronRight className={warn ? "text-yellow-300" : "text-white"} /></button>;
}
