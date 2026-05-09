import { useMemo, useState } from "react";
import { BarChart3, Brain, CalendarCheck, ChevronRight, Dumbbell, Star, TrendingUp, Trophy } from "lucide-react";
import type { MobileSnapshot } from "../data/mobileRepository";
import { buildMobileAnalyzer, type MobileAnalyzerModel, type MobileRangePreset } from "../features/analytics/mobileAnalytics";
import { EmptyMobileState, GlassCard, IconTile, MetricChip, MiniTrendBars, MobileHeader, MobilePage, SectionTitle, StatusPill } from "../components/MobilePrimitives";
import { formatNumber } from "./AnalyzerShared";

type AnalyticsSection = "Overview" | "Strength" | "Volume" | "Balance" | "Intel";
type RangeLabel = "7D" | "30D" | "90D" | "All";
type TrendSeries = {
  values: number[];
  labels: string[];
  hasVolume: boolean;
  source: string;
};

const sections: AnalyticsSection[] = ["Overview", "Strength", "Volume", "Balance", "Intel"];
const ranges: RangeLabel[] = ["7D", "30D", "90D", "All"];

export function AnalyticsPage({ snapshot, analyzer }: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel }) {
  const [activeSection, setActiveSection] = useState<AnalyticsSection>("Overview");
  const [range, setRange] = useState<RangeLabel>("30D");
  const [selectedInsight, setSelectedInsight] = useState("Tap an insight to see the reasoning.");
  const rangeAnalyzer = useMemo(() => buildMobileAnalyzer(snapshot, toRangePreset(range), "all"), [snapshot, range]);
  const hasData = snapshot.setLogs.some((set) => !set.deletedAt);
  const activeAnalyzer = hasData ? rangeAnalyzer : analyzer;

  if (!hasData) {
    return (
      <MobilePage>
        <PageHeader range={range} setRange={setRange} />
        <EmptyMobileState icon={BarChart3} title="Import desktop data" body="Analytics unlock after you import an IronLung desktop seed. Your cache stays local on this phone." />
      </MobilePage>
    );
  }

  const switchSection = (section: AnalyticsSection) => {
    setActiveSection(section);
    window.requestAnimationFrame(() => document.getElementById("analytics-section-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const volumeSeries = volumeTrendSeries(activeAnalyzer, snapshot);
  const topLifts = activeAnalyzer.strengthRows.slice(0, activeSection === "Strength" ? 24 : 5);
  const muscles = muscleSummary(activeAnalyzer);

  return (
    <MobilePage>
      <PageHeader range={range} setRange={setRange} />

      <div className="grid grid-cols-5 rounded-2xl border border-white/10 bg-white/[0.045] p-1">
        {sections.map((tab) => (
          <button key={tab} onClick={() => switchSection(tab)} className={`min-h-[44px] rounded-xl text-[0.73rem] font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 min-[390px]:text-sm ${activeSection === tab ? "bg-blue-500 text-white shadow-[0_0_22px_rgba(59,130,246,0.28)]" : "text-slate-300"}`}>
            {tab}
          </button>
        ))}
      </div>

      <div id="analytics-section-detail" className="scroll-mt-4" />

      <GlassCard className="p-4">
        <SectionTitle label={`${activeSection} summary`} />
        <p className="text-sm leading-relaxed text-slate-300">{sectionCopy(activeSection, range)}</p>
      </GlassCard>

      {activeSection === "Overview" && (
        <>
          <SummaryMetrics analyzer={activeAnalyzer} />
          <VolumeTrendCard analyzer={activeAnalyzer} series={volumeSeries} />
          <OverviewSection topLifts={topLifts} muscles={muscles} onSection={switchSection} onInsight={setSelectedInsight} />
          <InsightsCard analyzer={activeAnalyzer} selectedInsight={selectedInsight} onInsight={setSelectedInsight} />
        </>
      )}
      {activeSection === "Strength" && (
        <>
          <StrengthMetrics analyzer={activeAnalyzer} />
          <StrengthSection analyzer={activeAnalyzer} topLifts={topLifts} onInsight={setSelectedInsight} />
          <InsightsCard analyzer={activeAnalyzer} selectedInsight={selectedInsight} onInsight={setSelectedInsight} />
        </>
      )}
      {activeSection === "Volume" && (
        <>
          <VolumeMetrics analyzer={activeAnalyzer} />
          <VolumeTrendCard analyzer={activeAnalyzer} series={volumeSeries} />
          <VolumeSection analyzer={activeAnalyzer} />
        </>
      )}
      {activeSection === "Balance" && (
        <>
          <BalanceMetrics analyzer={activeAnalyzer} muscles={muscles} />
          <BalanceSection analyzer={activeAnalyzer} muscles={muscles} />
        </>
      )}
      {activeSection === "Intel" && <IntelligenceSection analyzer={activeAnalyzer} />}
    </MobilePage>
  );
}

function SummaryMetrics({ analyzer }: { analyzer: MobileAnalyzerModel }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricChip icon={Dumbbell} label="Total Volume" value={`${shortVolume(analyzer.summary.totals.volume)} lb`} sub={formatDelta(analyzer.summary.comparison.volumeDeltaPercent)} />
      <MetricChip icon={CalendarCheck} label="Sessions" value={formatNumber(analyzer.summary.totals.sessions)} sub={formatDelta(analyzer.summary.comparison.sessionsDeltaPercent)} />
      <MetricChip icon={Star} label="PRs" value={formatNumber(analyzer.recentPrs.length)} sub="non-baseline" />
      <MetricChip icon={Trophy} label="Balance" value={`${Math.round(analyzer.summary.balance.overall || 0)}`} sub="muscle score" />
    </div>
  );
}

function StrengthMetrics({ analyzer }: { analyzer: MobileAnalyzerModel }) {
  const topLift = analyzer.strengthRows[0];
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricChip icon={Dumbbell} label="Top e1RM" value={`${formatNumber(topLift?.estimatedOneRm ?? 0)} lb`} sub={topLift?.exerciseName ?? "No lift yet"} />
      <MetricChip icon={Trophy} label="Best Set" value={topLift?.bestSet ?? "-"} sub="estimated strength" />
      <MetricChip icon={Star} label="Meaningful PRs" value={formatNumber(analyzer.recentPrs.length)} sub="major / medium / small" />
      <MetricChip icon={TrendingUp} label="Tracked Lifts" value={formatNumber(analyzer.strengthRows.length)} sub="with set history" />
    </div>
  );
}

function VolumeMetrics({ analyzer }: { analyzer: MobileAnalyzerModel }) {
  const topExercise = analyzer.topExerciseVolumeRows[0];
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricChip icon={BarChart3} label="Volume" value={`${shortVolume(analyzer.summary.totals.volume)} lb`} sub={formatDelta(analyzer.summary.comparison.volumeDeltaPercent)} />
      <MetricChip icon={CalendarCheck} label="Sessions" value={formatNumber(analyzer.summary.totals.sessions)} sub={formatDelta(analyzer.summary.comparison.sessionsDeltaPercent)} />
      <MetricChip icon={Dumbbell} label="Top Exercise" value={topExercise ? shortVolume(topExercise.value) : "0"} sub={topExercise?.label ?? "No volume"} />
      <MetricChip icon={TrendingUp} label="Volume Rows" value={formatNumber(analyzer.topExerciseVolumeRows.length)} sub="ranked exercises" />
    </div>
  );
}

function BalanceMetrics({ analyzer, muscles }: { analyzer: MobileAnalyzerModel; muscles: ReturnType<typeof muscleSummary> }) {
  const lowCount = muscles.filter((muscle) => muscle.status === "Low").length;
  const highCount = muscles.filter((muscle) => muscle.status === "High").length;
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricChip icon={Trophy} label="Balance Score" value={`${Math.round(analyzer.summary.balance.overall || 0)}`} sub="distributed volume" />
      <MetricChip icon={Dumbbell} label="Muscles" value={formatNumber(analyzer.muscleRows.length)} sub="detected groups" />
      <MetricChip icon={Star} label="Needs Work" value={formatNumber(lowCount)} sub="low exposure" />
      <MetricChip icon={TrendingUp} label="High Areas" value={formatNumber(highCount)} sub="highest exposure" />
    </div>
  );
}

function VolumeTrendCard({ analyzer, series }: { analyzer: MobileAnalyzerModel; series: TrendSeries }) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">Volume Trend</h2>
          <p className="mt-1 text-sm text-slate-400">{series.source}</p>
        </div>
        <StatusPill tone="green">{formatDelta(analyzer.summary.comparison.volumeDeltaPercent)}</StatusPill>
      </div>
      {series.hasVolume ? (
        <>
          <MiniTrendBars values={series.values} labels={series.labels} className="h-40" />
          <div className="mt-3 grid grid-cols-7 gap-1 text-center font-mono text-[0.62rem] text-slate-500">
            {series.values.map((value, index) => <span key={`${series.labels[index]}-${index}`}>{shortVolume(value)}</span>)}
          </div>
        </>
      ) : (
        <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.035] p-5 text-center">
          <div>
            <BarChart3 className="mx-auto h-8 w-8 text-slate-500" />
            <div className="mt-3 text-sm font-black text-white">No volume in this range</div>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">Switch to a longer range or import a desktop seed with workout history.</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function InsightsCard({ analyzer, selectedInsight, onInsight }: { analyzer: MobileAnalyzerModel; selectedInsight: string; onInsight: (value: string) => void }) {
  return (
    <GlassCard className="p-5">
      <h2 className="text-xl font-black">Insights & Recommendations</h2>
      {insightRows(analyzer).map((insight) => (
        <InsightRow key={insight.title} {...insight} onOpen={() => onInsight(insight.detail)} />
      ))}
      <div className="mt-4 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-3 text-sm leading-relaxed text-slate-200">{selectedInsight}</div>
    </GlassCard>
  );
}

function IntelligenceSection({ analyzer }: { analyzer: MobileAnalyzerModel }) {
  const intelligence = analyzer.intelligence;
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <MetricChip icon={Brain} label="Readiness" value={`${intelligence.analyst.readinessScore}`} sub="training score" />
        <MetricChip icon={TrendingUp} label="Forecasts" value={formatNumber(intelligence.forecasts.length)} sub="statistical signals" />
      </div>
      <GlassCard className="p-4">
        <SectionTitle label="Analyst report" />
        <div className="space-y-2">
          <InsightRow icon={Brain} title="Focus" detail={intelligence.analyst.focus} tone="blue" onOpen={() => undefined} />
          <InsightRow icon={Star} title="Weak point" detail={intelligence.analyst.weakPoint} tone="yellow" onOpen={() => undefined} />
          <InsightRow icon={Trophy} title="Best improvement" detail={intelligence.analyst.bestImprovement} tone="green" onOpen={() => undefined} />
        </div>
      </GlassCard>
      <GlassCard className="p-4">
        <SectionTitle label="Forecasts" />
        <div className="space-y-2">
          {intelligence.forecasts.slice(0, 10).map((forecast) => (
            <div key={forecast.id} className="rounded-2xl bg-white/[0.045] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black">{forecast.targetName}</div>
                  <div className="mt-1 text-xs capitalize text-slate-400">{forecast.type.replace(/_/g, " ")}</div>
                </div>
                <StatusPill tone="blue">{forecast.confidence}/100</StatusPill>
              </div>
              <div className="mt-2 font-mono text-lg font-black text-blue-300">{formatNumber(forecast.value)} {forecast.unit}</div>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{forecast.detail}</p>
            </div>
          ))}
          {!intelligence.forecasts.length && <p className="text-sm text-slate-400">No forecasts yet. Import or log more sessions.</p>}
        </div>
      </GlassCard>
      <GlassCard className="p-4">
        <SectionTitle label="Recommendations" />
        <div className="space-y-2">
          {intelligence.recommendations.map((item) => (
            <div key={item.id} className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3">
              <div className="text-base font-black">{item.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{item.detail}</p>
              <p className="mt-2 text-sm font-bold text-blue-300">{item.suggestedAction}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function OverviewSection({ topLifts, muscles, onSection, onInsight }: { topLifts: MobileAnalyzerModel["strengthRows"]; muscles: ReturnType<typeof muscleSummary>; onSection: (section: AnalyticsSection) => void; onInsight: (value: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <MuscleBalanceCard muscles={muscles} compact onViewAll={() => onSection("Balance")} />
      <TopLiftsCard lifts={topLifts} title="Top lifts" action="View all" onViewAll={() => onSection("Strength")} onInsight={onInsight} />
    </div>
  );
}

function StrengthSection({ analyzer, topLifts, onInsight }: { analyzer: MobileAnalyzerModel; topLifts: MobileAnalyzerModel["strengthRows"]; onInsight: (value: string) => void }) {
  return (
    <div className="grid gap-3">
      <TopLiftsCard lifts={topLifts} title="All top lifts" onInsight={onInsight} />
      <GlassCard className="p-4">
        <SectionTitle label="Recent PRs" />
        <div className="space-y-2">
          {analyzer.recentPrs.slice(0, 12).map((record) => (
            <div key={record.id} className="flex min-h-[48px] items-center justify-between gap-3 rounded-2xl bg-white/[0.045] px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-black">{record.type.replace(/_/g, " ")}</div>
                <div className="text-xs text-slate-400">{new Date(record.achievedAt).toLocaleDateString()}</div>
              </div>
              <div className="font-mono text-sm font-black text-blue-300">{formatNumber(record.value)} {record.unit}</div>
            </div>
          ))}
          {!analyzer.recentPrs.length && <p className="text-sm text-slate-400">No non-baseline PRs in this range.</p>}
        </div>
      </GlassCard>
    </div>
  );
}

function VolumeSection({ analyzer }: { analyzer: MobileAnalyzerModel }) {
  return (
    <div className="grid gap-3">
      <GlassCard className="p-4">
        <SectionTitle label="Weekly volume" />
        <div className="space-y-2">
          {analyzer.weeklyRows.slice(0, 10).map((row) => <ProgressRow key={row.label} label={row.label} value={row.value} meta={row.meta} max={Math.max(...analyzer.weeklyRows.map((item) => item.value), 1)} />)}
        </div>
      </GlassCard>
      <GlassCard className="p-4">
        <SectionTitle label="Exercise volume" />
        <div className="space-y-2">
          {analyzer.topExerciseVolumeRows.slice(0, 12).map((row) => <ProgressRow key={row.label} label={row.label} value={row.value} meta={row.meta} max={Math.max(...analyzer.topExerciseVolumeRows.map((item) => item.value), 1)} />)}
        </div>
      </GlassCard>
    </div>
  );
}

function BalanceSection({ analyzer, muscles }: { analyzer: MobileAnalyzerModel; muscles: ReturnType<typeof muscleSummary> }) {
  return (
    <div className="grid gap-3">
      <MuscleBalanceCard muscles={muscles} />
      <GlassCard className="p-4">
        <SectionTitle label="All muscles" />
        <div className="space-y-2">
          {analyzer.muscleRows.slice(0, 20).map((row) => <ProgressRow key={row.label} label={row.label} value={row.value} meta={row.meta} max={Math.max(...analyzer.muscleRows.map((item) => item.value), 1)} />)}
        </div>
      </GlassCard>
    </div>
  );
}

function MuscleBalanceCard({ muscles, compact = false, onViewAll }: { muscles: ReturnType<typeof muscleSummary>; compact?: boolean; onViewAll?: () => void }) {
  return (
    <GlassCard className="p-4">
      <SectionTitle label="Muscle balance" action={onViewAll ? "View all" : undefined} onAction={onViewAll} />
      <div className={`grid items-center gap-3 ${compact ? "grid-cols-[minmax(7.5rem,9rem)_minmax(0,1fr)]" : "grid-cols-1"}`}>
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
      <p className="mt-3 rounded-2xl bg-white/[0.045] p-3 text-sm leading-relaxed text-slate-400">Muscle volume is distributed from exercise contribution estimates. Diagram: OpenStax Anatomy & Physiology, CC BY 4.0.</p>
    </GlassCard>
  );
}

function TopLiftsCard({ lifts, title, action, onViewAll, onInsight }: { lifts: MobileAnalyzerModel["strengthRows"]; title: string; action?: string; onViewAll?: () => void; onInsight: (value: string) => void }) {
  return (
    <GlassCard className="p-4">
      <SectionTitle label={title} action={action} onAction={onViewAll} />
      <div className="space-y-3">
        {lifts.length ? lifts.map((lift, index) => (
          <button key={lift.exerciseId} onClick={() => onInsight(`${lift.exerciseName}: best set ${lift.bestSet}, estimated 1RM ${formatNumber(lift.estimatedOneRm)} lb.`)} className="grid min-h-[56px] w-full grid-cols-[1rem_2.55rem_minmax(0,1fr)_3rem] items-center gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">
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
  );
}

function ProgressRow({ label, value, meta, max }: { label: string; value: number; meta?: string; max: number }) {
  return (
    <div className="rounded-2xl bg-white/[0.045] p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-black">{label}</span>
        <span className="font-mono text-sm text-blue-300">{formatNumber(value)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(3, Math.min(100, (value / max) * 100))}%` }} />
      </div>
      {meta && <div className="mt-1 text-xs text-slate-500">{meta}</div>}
    </div>
  );
}

function PageHeader({ range, setRange }: { range: RangeLabel; setRange: (range: RangeLabel) => void }) {
  return (
    <header className="space-y-4">
      <MobileHeader title="Analytics" subtitle="Understand your training. Improve every week." />
      <div className="grid grid-cols-4 rounded-2xl border border-white/10 bg-white/[0.045] p-1">
        {ranges.map((item) => (
          <button key={item} aria-label={`Range ${item}`} onClick={() => setRange(item)} className={`min-h-[44px] rounded-xl text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 ${range === item ? "bg-blue-500 text-white" : "text-slate-300"}`}>{item}</button>
        ))}
      </div>
    </header>
  );
}

function toRangePreset(range: RangeLabel): MobileRangePreset {
  if (range === "7D") return "7d";
  if (range === "90D") return "90d";
  if (range === "All") return "all";
  return "30d";
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
    <figure className="overflow-hidden rounded-2xl border border-blue-400/20 bg-white shadow-[0_0_28px_rgba(59,130,246,0.18)]">
      <img
        src={`${import.meta.env.BASE_URL}assets/openstax-muscles-front-back.jpg`}
        alt="Anterior and posterior muscle diagram"
        className="h-52 w-full object-cover object-top"
        loading="lazy"
      />
    </figure>
  );
}

function volumeTrendSeries(analyzer: MobileAnalyzerModel, snapshot: MobileSnapshot): TrendSeries {
  const dailyRows = newestRowsChronological(analyzer.dailyRows);
  if (dailyRows.some((row) => row.value > 0)) {
    return padTrendRows(dailyRows, "Daily volume from imported workout sets.");
  }

  const weeklyRows = newestRowsChronological(analyzer.weeklyRows);
  if (weeklyRows.some((row) => row.value > 0)) {
    return padTrendRows(weeklyRows, "Weekly volume shown because this range has no daily volume bars.");
  }

  const rawRows = rawSetVolumeRows(snapshot);
  if (rawRows.some((row) => row.value > 0)) {
    return padTrendRows(rawRows, "Raw set volume shown while imported workout links are being repaired.");
  }

  return {
    values: [0, 0, 0, 0, 0, 0, 0],
    labels: ["", "", "", "", "", "", ""],
    hasVolume: false,
    source: "No imported set volume was found for this range."
  };
}

function rawSetVolumeRows(snapshot: MobileSnapshot): MobileAnalyzerModel["dailyRows"] {
  const days = new Map<string, number>();
  for (const set of snapshot.setLogs.filter((row) => !row.deletedAt && row.isCompleted)) {
    const day = new Date(set.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    days.set(day, (days.get(day) ?? 0) + set.weight * set.reps);
  }
  return [...days.entries()].map(([label, value]) => ({ label, value })).slice(-7);
}

function newestRowsChronological(rows: MobileAnalyzerModel["dailyRows"]): MobileAnalyzerModel["dailyRows"] {
  return rows
    .filter((row) => Number.isFinite(row.value))
    .slice(0, 7)
    .reverse();
}

function padTrendRows(rows: MobileAnalyzerModel["dailyRows"], source: string): TrendSeries {
  const missing = Math.max(0, 7 - rows.length);
  return {
    values: [...Array(missing).fill(0), ...rows.map((row) => row.value)],
    labels: [...Array(missing).fill(""), ...rows.map((row) => compactTrendLabel(row.label))],
    hasVolume: true,
    source
  };
}

function compactTrendLabel(label: string): string {
  return label.replace(/^Week\s+/i, "").replace(/\s+/g, " ");
}

function muscleSummary(analyzer: MobileAnalyzerModel) {
  const groups = [
    { label: "Chest", terms: ["chest", "pectoral"] },
    { label: "Back", terms: ["back", "lat", "rhomboid", "trap", "teres", "erector"] },
    { label: "Shoulders", terms: ["shoulder", "deltoid", "rotator cuff", "supraspinatus"] },
    { label: "Arms", terms: ["biceps", "triceps", "brachialis", "forearm", "brachioradialis"] },
    { label: "Legs", terms: ["quad", "hamstring", "glute", "calf", "soleus", "adductor", "vastus"] },
    { label: "Core", terms: ["core", "abs", "abdominis", "oblique"] }
  ];
  const grouped = groups.map((group) => ({
    label: group.label,
    value: analyzer.muscleRows
      .filter((row) => group.terms.some((term) => row.label.toLowerCase().includes(term)))
      .reduce((sum, row) => sum + row.value, 0)
  }));
  const max = Math.max(...grouped.map((row) => row.value), 1);
  return grouped.map((group) => {
    const ratio = group.value / max;
    const status = ratio < 0.35 ? "Low" : ratio > 0.9 ? "High" : "Good";
    return { label: group.label, status, tone: status === "Low" ? "yellow" as const : status === "High" ? "blue" as const : "green" as const };
  });
}

function insightRows(analyzer: MobileAnalyzerModel) {
  const recommendation = analyzer.intelligence.recommendations[0];
  const forecast = analyzer.intelligence.forecasts[0];
  return [
    { icon: Brain, title: "Training intelligence", detail: recommendation ? recommendation.suggestedAction : analyzer.intelligence.analyst.focus, tone: "blue" as const },
    { icon: TrendingUp, title: "Top forecast", detail: forecast ? forecast.detail : analyzer.topInsight, tone: "blue" as const },
    { icon: Star, title: "Weak point", detail: analyzer.intelligence.analyst.weakPoint, tone: "yellow" as const },
    { icon: Trophy, title: "Best recent lift", detail: analyzer.bestRecentLift, tone: "green" as const }
  ];
}

function sectionCopy(section: AnalyticsSection, range: RangeLabel) {
  if (section === "Strength") return `Strength view for ${range}: best sets, estimated 1RM, and meaningful PR direction.`;
  if (section === "Volume") return `Volume view for ${range}: workload trend, daily bars, and period-over-period movement.`;
  if (section === "Balance") return `Balance view for ${range}: distributed muscle volume and weak point signals.`;
  if (section === "Intel") return `Intelligence view for ${range}: readiness, forecasts, PR likelihood, plateau risk, and ranked recommendations.`;
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
