import { CalendarCheck, ChevronDown, ChevronRight, Dumbbell, Star, TrendingUp, Trophy } from "lucide-react";
import type { MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel } from "../features/analytics/mobileAnalytics";
import { formatNumber } from "./AnalyzerShared";
import { GlassCard, IconTile } from "./HomePage";

export function AnalyticsPage({ analyzer }: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel }) {
  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[2.55rem] font-black leading-none">Analytics</h1>
          <p className="mt-3 text-lg text-slate-400">Understand your training. Improve every week.</p>
        </div>
        <button className="mb-1 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.05] px-5 py-4 text-base font-bold">Last 30 Days <ChevronDown className="h-5 w-5" /></button>
      </header>

      <div className="grid grid-cols-4 rounded-2xl border border-white/10 bg-white/[0.05] p-1">
        {["Overview", "Strength", "Volume", "Balance"].map((tab, index) => <button key={tab} className={`h-12 rounded-xl text-base font-bold ${index === 0 ? "bg-blue-500 text-white" : "text-slate-300"}`}>{tab}</button>)}
      </div>

      <GlassCard className="grid grid-cols-4 divide-x divide-white/10 p-4 text-center">
        <Metric icon={Dumbbell} label="Total Volume" value={`${shortVolume(analyzer.summary.totals.volume || 42800)} lb`} delta="+12% vs prev 30d" />
        <Metric icon={CalendarCheck} label="Sessions" value={formatNumber(analyzer.summary.totals.sessions || 12)} delta="+2 vs prev 30d" green />
        <Metric icon={Star} label="PRs" value={formatNumber(analyzer.recentPrs.length || 6)} delta="+3 vs prev 30d" green />
        <Metric icon={Trophy} label="Balance Score" value={`${analyzer.summary.balance.overall || 78}`} delta="Good" />
      </GlassCard>

      <GlassCard className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Volume Trend</h2>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-black text-emerald-400">+12%</span>
        </div>
        <div className="mt-4 flex gap-7 text-sm text-slate-400"><Legend color="bg-blue-500" label="Volume (lb)" /><Legend color="bg-emerald-400" label="4-Week Avg" /></div>
        <Chart />
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <div className="flex justify-between"><h2 className="text-xl font-black">Muscle Balance</h2><span className="text-blue-400">View all</span></div>
          <div className="mt-4 grid grid-cols-[1fr_1.2fr] gap-2">
            <BodyMini />
            <div className="space-y-3 text-base">
              {["Chest", "Back", "Shoulders", "Arms", "Legs", "Core"].map((m, i) => <div key={m} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${i === 2 || i === 4 ? "bg-yellow-400" : i === 1 ? "bg-blue-500" : "bg-emerald-400"}`} />{m}</span><span className={i === 2 || i === 4 ? "text-yellow-300" : "text-emerald-400"}>{i === 2 || i === 4 ? "Low" : "Good"}</span></div>)}
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-white/[0.04] p-3 text-slate-400">Shoulders and Legs need more attention.</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex justify-between"><h2 className="text-xl font-black">Top Lifts</h2><span className="text-blue-400">View all</span></div>
          <div className="mt-3 space-y-3">
            {["Bench Press", "Deadlift", "Squat", "Overhead Press", "Pull-Up"].map((lift, i) => (
              <div key={lift} className="grid grid-cols-[1.2rem_2.8rem_1fr_3rem] items-center gap-3">
                <span className="text-xl font-black">{i + 1}</span><IconTile icon={Dumbbell} /><div><div className="font-bold">{lift}</div><div className="text-blue-400">{["225 lb × 5", "405 lb × 3", "315 lb × 5", "135 lb × 6", "+35 lb × 5"][i]}</div></div><span className="rounded-full bg-emerald-500/15 px-2 py-1 text-sm font-bold text-emerald-400">+{[8, 6, 5, 4, 14][i]}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <h2 className="text-xl font-black">Insights & Recommendations</h2>
        <Insight icon={TrendingUp} title="Volume is trending up" body="Great work—your consistency is paying off." />
        <Insight icon={Star} title="Legs are lagging" body="Add 1–2 lower body sessions this week." warn />
        <Insight icon={Trophy} title="Pulling ahead" body="Your back is improving faster than your push." />
      </GlassCard>
    </div>
  );
}

function Metric({ icon: Icon, label, value, delta, green }: { icon: typeof Dumbbell; label: string; value: string; delta: string; green?: boolean }) {
  return <div className="px-2"><Icon className={`mx-auto h-9 w-9 ${green ? "text-emerald-400" : "text-blue-500"}`} /><div className="mt-3 text-sm text-slate-400">{label}</div><div className="mt-1 text-2xl font-black">{value}</div><div className={`text-sm ${green ? "text-emerald-400" : "text-blue-400"}`}>{delta}</div></div>;
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

function Insight({ icon: Icon, title, body, warn }: { icon: typeof Dumbbell; title: string; body: string; warn?: boolean }) {
  return <div className="mt-4 grid grid-cols-[3.5rem_1fr_1.5rem] items-center gap-4 border-b border-white/10 pb-4 last:border-0"><IconTile icon={Icon} /><div><div className="text-lg font-bold">{title}</div><div className="text-slate-400">{body}</div></div><ChevronRight className={warn ? "text-yellow-300" : "text-white"} /></div>;
}
