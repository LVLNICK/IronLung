import { useMemo, useState } from "react";
import { BarChart3, CalendarCheck, ChevronRight, Dumbbell, Star, TrendingUp, Trophy } from "lucide-react";
import type { MobileSnapshot } from "../data/mobileRepository";
import { buildMobileAnalyzer, type MobileAnalyzerModel, type MobileRangePreset } from "../features/analytics/mobileAnalytics";
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

  const volumeValues = trendValues(activeAnalyzer.dailyRows);
  const topLifts = activeAnalyzer.strengthRows.slice(0, 5);
  const muscles = muscleSummary(activeAnalyzer);

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
        <MetricChip icon={Dumbbell} label="Total Volume" value={`${shortVolume(activeAnalyzer.summary.totals.volume)} lb`} sub={formatDelta(activeAnalyzer.summary.comparison.volumeDeltaPercent)} />
        <MetricChip icon={CalendarCheck} label="Sessions" value={formatNumber(activeAnalyzer.summary.totals.sessions)} sub={formatDelta(activeAnalyzer.summary.comparison.sessionsDeltaPercent)} />
        <MetricChip icon={Star} label="PRs" value={formatNumber(activeAnalyzer.recentPrs.length)} sub="non-baseline" />
        <MetricChip icon={Trophy} label="Balance" value={`${Math.round(activeAnalyzer.summary.balance.overall || 0)}`} sub="muscle score" />
      </div>

      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">Volume Trend</h2>
            <p className="mt-1 text-sm text-slate-400">Blue bars show daily workload.</p>
          </div>
          <StatusPill tone="green">{formatDelta(activeAnalyzer.summary.comparison.volumeDeltaPercent)}</StatusPill>
        </div>
        <MiniTrendBars values={volumeValues} labels={["M", "T", "W", "T", "F", "S", "S"]} className="h-40" />
      </GlassCard>

      <div className="grid grid-cols-1 gap-3">
        <GlassCard className="p-4">
          <SectionTitle label="Muscle balance" action="View all" onAction={() => setActiveSection("Balance")} />
          <div className="grid grid-cols-[minmax(7.5rem,9rem)_minmax(0,1fr)] items-center gap-3">
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
        {insightRows(activeAnalyzer).map((insight) => (
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

function trendValues(rows: MobileAnalyzerModel["dailyRows"]) {
  const values = rows.slice(0, 7).map((row) => row.value).reverse();
  return values.length ? [...Array(Math.max(0, 7 - values.length)).fill(0), ...values] : [18, 24, 32, 28, 42, 38, 55];
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
