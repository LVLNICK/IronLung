import { useState } from "react";
import { BarChart3, CalendarCheck, ChevronRight, Dumbbell, Star, TrendingUp, Trophy } from "lucide-react";
import type { MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel } from "../features/analytics/mobileAnalytics";
import { EmptyMobileState, GlassCard, IconTile, MetricChip, MiniTrendBars, MobileHeader, MobilePage, SectionTitle, StatusPill } from "../components/MobilePrimitives";
import { formatNumber } from "./AnalyzerShared";

type AnalyticsSection = "Overview" | "Strength" | "Volume" | "Balance";
type RangeLabel = "7D" | "30D" | "90D" | "All";

const sections: AnalyticsSection[] = ["Overview", "Strength", "Volume", "Balance"];
const ranges: RangeLabel[] = ["7D", "30D", "90D", "All"];

export function AnalyticsPage({ snapshot, analyzer }: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel }) {
  const [activeSection, setActiveSection] = useState<AnalyticsSection>("Overview");
  const [range, setRange] = useState<RangeLabel>("30D");
  const [selectedInsight, setSelectedInsight] = useState("Tap an insight to see the reasoning.");
  const hasData = snapshot.setLogs.some((set) => !set.deletedAt);

  if (!hasData) {
    return (
      <MobilePage>
        <PageHeader range={range} setRange={setRange} />
        <EmptyMobileState icon={BarChart3} title="Import desktop data" body="Analytics unlock after you import an IronLung desktop seed. Your cache stays local on this phone." />
      </MobilePage>
    );
  }

  const volumeValues = trendValues(analyzer.dailyRows);
  const topLifts = analyzer.strengthRows.slice(0, 5);
  const muscles = muscleSummary(analyzer);

  return (
    <MobilePage>
      <PageHeader range={range} setRange={setRange} />

      <div className="grid grid-cols-4 rounded-2xl border border-white/10 bg-white/[0.045] p-1">
        {sections.map((tab) => (
          <button key={tab} onClick={() => setActiveSection(tab)} className={`min-h-[44px] rounded-xl text-[0.73rem] font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 min-[390px]:text-sm ${activeSection === tab ? "bg-blue-500 text-white shadow-[0_0_22px_rgba(59,130,246,0.28)]" : "text-slate-300"}`}>
            {tab}
          </button>
        ))}
      </div>

      <GlassCard className="p-4">
        <SectionTitle label={`${activeSection} summary`} />
        <p className="text-sm leading-relaxed text-slate-300">{sectionCopy(activeSection, range)}</p>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <MetricChip icon={Dumbbell} label="Total Volume" value={`${shortVolume(analyzer.summary.totals.volume)} lb`} sub={formatDelta(analyzer.summary.comparison.volumeDeltaPercent)} />
        <MetricChip icon={CalendarCheck} label="Sessions" value={formatNumber(analyzer.summary.totals.sessions)} sub={`${formatDelta(analyzer.summary.comparison.sessionsDeltaPercent)} vs prev`} />
        <MetricChip icon={Star} label="PRs" value={formatNumber(analyzer.recentPrs.length)} sub="meaningful only" />
        <MetricChip icon={Trophy} label="Balance" value={`${Math.round(analyzer.summary.balance.overall || 0)}`} sub="muscle score" />
      </div>

      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">Volume Trend</h2>
            <p className="mt-1 text-sm text-slate-400">Blue bars show daily workload.</p>
          </div>
          <StatusPill tone="green">{formatDelta(analyzer.summary.comparison.volumeDeltaPercent)}</StatusPill>
        </div>
        <MiniTrendBars values={volumeValues} labels={["M", "T", "W", "T", "F", "S", "S"]} className="h-40" />
      </GlassCard>

      <div className="grid grid-cols-1 gap-3 min-[405px]:grid-cols-2">
        <GlassCard className="p-4">
          <SectionTitle label="Muscle balance" action="View all" onAction={() => setActiveSection("Balance")} />
          <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3">
            <BodyMini />
            <div className="space-y-2">
              {muscles.map((muscle) => (
                <div key={muscle.label} className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold">{muscle.label}</span>
                  <StatusPill tone={muscle.tone}>{muscle.status}</StatusPill>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 rounded-2xl bg-white/[0.045] p-3 text-sm leading-relaxed text-slate-400">Muscle volume is distributed from exercise contribution estimates.</p>
        </GlassCard>

        <GlassCard className="p-4">
          <SectionTitle label="Top lifts" action="View all" onAction={() => setActiveSection("Strength")} />
          <div className="space-y-3">
            {topLifts.length ? topLifts.map((lift, index) => (
              <button key={lift.exerciseId} onClick={() => setSelectedInsight(`${lift.exerciseName}: best set ${lift.bestSet}, estimated 1RM ${formatNumber(lift.estimatedOneRm)} lb.`)} className="grid min-h-[56px] w-full grid-cols-[1rem_2.55rem_minmax(0,1fr)_3rem] items-center gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">
                <span className="font-mono text-lg font-black">{index + 1}</span>
                <IconTile icon={Dumbbell} />
                <div className="min-w-0">
                  <div className="truncate font-black">{lift.exerciseName}</div>
                  <div className="truncate font-mono text-sm text-blue-400">{lift.bestSet}</div>
                </div>
                <StatusPill tone={lift.strengthTrend > 0 ? "green" : "slate"}>{formatTrend(lift.strengthTrend)}</StatusPill>
              </button>
            )) : <p className="text-sm text-slate-400">No lift history in this cache yet.</p>}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <h2 className="text-xl font-black">Insights & Recommendations</h2>
        {insightRows(analyzer).map((insight) => (
          <InsightRow key={insight.title} {...insight} onOpen={() => setSelectedInsight(insight.detail)} />
        ))}
        <div className="mt-4 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-3 text-sm leading-relaxed text-slate-200">{selectedInsight}</div>
      </GlassCard>
    </MobilePage>
  );
}

function PageHeader({ range, setRange }: { range: RangeLabel; setRange: (range: RangeLabel) => void }) {
  return (
    <header className="space-y-4">
      <MobileHeader title="Analytics" subtitle="Understand your training. Improve every week." />
      <div className="grid grid-cols-4 rounded-2xl border border-white/10 bg-white/[0.045] p-1">
        {ranges.map((item) => (
          <button key={item} onClick={() => setRange(item)} className={`min-h-[44px] rounded-xl text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 ${range === item ? "bg-blue-500 text-white" : "text-slate-300"}`}>{item}</button>
        ))}
      </div>
    </header>
  );
}

function InsightRow({ icon: Icon, title, detail, tone = "blue", onOpen }: { icon: typeof Dumbbell; title: string; detail: string; tone?: "blue" | "yellow" | "green"; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="mt-4 grid min-h-[64px] w-full grid-cols-[3rem_minmax(0,1fr)_1.25rem] items-center gap-3 border-b border-white/10 pb-4 text-left last:border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">
      <IconTile icon={Icon} tone={tone} />
      <div className="min-w-0">
        <div className="text-base font-black leading-tight">{title}</div>
        <div className="mt-1 text-sm leading-relaxed text-slate-400">{detail}</div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-300" />
    </button>
  );
}

function BodyMini() {
  return (
    <div className="relative mx-auto h-44 w-20">
      <div className="absolute left-7 top-0 h-7 w-7 rounded-full bg-slate-600" />
      <div className="absolute left-4 top-8 h-20 w-12 rounded-[2rem] bg-blue-700" />
      <div className="absolute left-0 top-11 h-14 w-5 rotate-[22deg] rounded-full bg-emerald-500/70" />
      <div className="absolute right-0 top-11 h-14 w-5 -rotate-[22deg] rounded-full bg-emerald-500/70" />
      <div className="absolute left-4 top-[6.25rem] h-16 w-5 rotate-12 rounded-full bg-yellow-500/80" />
      <div className="absolute right-4 top-[6.25rem] h-16 w-5 -rotate-12 rounded-full bg-yellow-500/80" />
    </div>
  );
}

function trendValues(rows: MobileAnalyzerModel["dailyRows"]) {
  const values = rows.slice(0, 7).map((row) => row.value).reverse();
  return values.length ? [...Array(Math.max(0, 7 - values.length)).fill(0), ...values] : [18, 24, 32, 28, 42, 38, 55];
}

function muscleSummary(analyzer: MobileAnalyzerModel) {
  const base = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core"];
  const max = Math.max(...analyzer.muscleRows.map((row) => row.value), 1);
  return base.map((label) => {
    const found = analyzer.muscleRows.find((row) => row.label.toLowerCase().includes(label.toLowerCase()));
    const ratio = found ? found.value / max : 0;
    const status = ratio < 0.35 ? "Low" : ratio > 0.9 ? "High" : "Good";
    return { label, status, tone: status === "Low" ? "yellow" as const : status === "High" ? "blue" as const : "green" as const };
  });
}

function insightRows(analyzer: MobileAnalyzerModel) {
  return [
    { icon: TrendingUp, title: "Top signal", detail: analyzer.topInsight, tone: "blue" as const },
    { icon: Star, title: "Weak point", detail: analyzer.weakPoint, tone: "yellow" as const },
    { icon: Trophy, title: "Best recent lift", detail: analyzer.bestRecentLift, tone: "green" as const }
  ];
}

function sectionCopy(section: AnalyticsSection, range: RangeLabel) {
  if (section === "Strength") return `Strength view for ${range}: best sets, estimated 1RM, and meaningful PR direction.`;
  if (section === "Volume") return `Volume view for ${range}: workload trend, daily bars, and period-over-period movement.`;
  if (section === "Balance") return `Balance view for ${range}: distributed muscle volume and weak point signals.`;
  return `Overview for ${range}: the most important training signals in one screen.`;
}

function shortVolume(value: number) {
  return value >= 1000 ? `${(Math.round(value / 100) / 10).toFixed(1)}K` : formatNumber(value);
}

function formatDelta(value: number) {
  if (!Number.isFinite(value)) return "+0% vs prev";
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : ""}${rounded}% vs prev`;
}

function formatTrend(value: number) {
  if (!Number.isFinite(value) || Math.round(value) === 0) return "flat";
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}
