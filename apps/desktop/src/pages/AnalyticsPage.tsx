import { useState } from "react";
import { BarChart3, Brain, CalendarDays, Flame, Gauge, Layers, LineChart as LineIcon, Target, Trophy } from "lucide-react";
import { type DateRangePreset } from "@ironlung/core";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, MetricCard, SectionHeader } from "../components/cards/Card";
import { ScreenShell } from "../components/layout/ScreenShell";
import { AnalyticsTable, StatRows } from "../components/tables/AnalyticsTable";
import { chartColors, tooltipStyle } from "../components/charts/ChartPrimitives";
import { compactNumber, countNumber, shortDate, wholeNumber } from "../lib/format";
import { useTrainingAnalytics } from "../features/analytics/useTrainingAnalytics";
import { useIronLungStore } from "../lib/store";
import { prLabel } from "@ironlung/core";

type AnalyticsTab = "Overview" | "Strength" | "Volume" | "Muscle Balance" | "PRs" | "Consistency" | "Intensity & Recovery" | "Insights";

export function AnalyticsPage() {
  const [range, setRange] = useState<DateRangePreset>("30d");
  const [tab, setTab] = useState<AnalyticsTab>("Overview");
  const analytics = useTrainingAnalytics(range);

  return (
    <ScreenShell title="Analytics" subtitle="Strength, volume, muscle balance, PRs, consistency, intensity, recovery, and rule-based insights." action={<RangeSelector value={range} onChange={setRange} />}>
      <div className="inline-flex flex-wrap gap-2">
        {(["Overview", "Strength", "Volume", "Muscle Balance", "PRs", "Consistency", "Intensity & Recovery", "Insights"] as AnalyticsTab[]).map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === item ? "bg-electric text-white" : "border border-obsidian-strong bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.08)]"}`}>{item}</button>
        ))}
      </div>
      {tab === "Overview" && <Overview analytics={analytics} />}
      {tab === "Strength" && <Strength analytics={analytics} />}
      {tab === "Volume" && <Volume analytics={analytics} />}
      {tab === "Muscle Balance" && <MuscleBalance analytics={analytics} />}
      {tab === "PRs" && <PRs analytics={analytics} />}
      {tab === "Consistency" && <Consistency analytics={analytics} />}
      {tab === "Intensity & Recovery" && <IntensityRecovery analytics={analytics} />}
      {tab === "Insights" && <Insights analytics={analytics} />}
    </ScreenShell>
  );
}

function RangeSelector({ value, onChange }: { value: DateRangePreset; onChange: (value: DateRangePreset) => void }) {
  const options: Array<[DateRangePreset, string]> = [["7d", "7D"], ["30d", "30D"], ["90d", "90D"], ["1y", "1Y"], ["all", "All time"]];
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-obsidian-strong bg-obsidian-700 p-1">
      {options.map(([nextValue, label]) => (
        <button
          key={nextValue}
          type="button"
          onClick={() => onChange(nextValue)}
          className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${value === nextValue ? "bg-electric text-white" : "text-[rgba(255,255,255,0.55)] hover:text-white"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Overview({ analytics }: { analytics: ReturnType<typeof useTrainingAnalytics> }) {
  const { core } = analytics;
  const most = core.muscleVolume[0];
  const least = [...core.muscleVolume].reverse()[0];
  const best = [...core.exerciseMetrics].sort((a, b) => b.strengthTrend - a.strengthTrend)[0];
  const neglected = [...core.exerciseMetrics].sort((a, b) => String(a.lastTrained ?? "").localeCompare(String(b.lastTrained ?? "")))[0];
  return (
    <>
      <div className="grid grid-cols-6 gap-4">
        <MetricCard label="Volume" value={compactNumber(core.totals.volume)} hint={`${core.comparison.volumeDeltaPercent}% vs previous`} />
        <MetricCard label="Sets" value={countNumber(core.totals.sets)} hint="completed" />
        <MetricCard label="Sessions" value={countNumber(core.totals.sessions)} hint={`${countNumber(core.totals.activeDays)} active days`} />
        <MetricCard label="PRs" value={countNumber(core.totals.prs)} hint="by type" />
        <MetricCard label="Balance" value={`${core.balance.overall}/100`} hint="muscle score" />
        <MetricCard label="Readiness" value={`${analytics.intelligence.analyst.readinessScore}/100`} hint="forecast layer" tone={analytics.intelligence.analyst.readinessScore >= 70 ? "good" : "warn"} />
      </div>
      <div className="grid grid-cols-[1fr_.8fr_.8fr] gap-5">
        <TrendChart title="Weekly trend" data={core.weeklyVolume} x="weekStart" bars={["volume", "sessions"]} />
        <Card>
          <SectionHeader title="Smart Summary" icon={Gauge} />
          <StatRows rows={[
            ["Most trained muscle", most?.muscle ?? "--"],
            ["Least trained muscle", least?.muscle ?? "--"],
            ["Best progressing exercise", best?.name ?? "--"],
            ["Most neglected exercise", neglected?.name ?? "--"],
            ["Push/pull score", `${core.balance.pushPull}/100`],
            ["Upper/lower score", `${core.balance.upperLower}/100`],
            ["Training goal", goalLabel(core.trainingGoal)],
            ["Current block", core.currentBlock?.name ?? "--"]
          ]} />
        </Card>
        <Card>
          <SectionHeader title="Forecast Snapshot" icon={Brain} />
          <StatRows rows={analytics.intelligence.forecasts.slice(0, 6).map((forecast) => [
            forecast.targetName,
            `${forecast.type.replace(/_/g, " ")}: ${compactNumber(forecast.value)} ${forecast.unit} (${forecast.confidence}/100)`
          ])} />
        </Card>
      </div>
      <Insights analytics={analytics} compact />
    </>
  );
}

function Strength({ analytics }: { analytics: ReturnType<typeof useTrainingAnalytics> }) {
  const topSets = analytics.core.exerciseMetrics.slice(0, 20);
  return (
    <>
      <div className="grid grid-cols-3 gap-5">
        <TrendChart title="Top estimated 1RM" data={topSets.slice(0, 12)} x="name" bars={["estimatedOneRepMax"]} layout="vertical" />
        <TrendChart title="Max weight leaderboard" data={[...topSets].sort((a, b) => b.maxWeight - a.maxWeight).slice(0, 12)} x="name" bars={["maxWeight"]} layout="vertical" />
        <Card>
          <SectionHeader title="Plateau Detection" icon={Target} />
          <StatRows rows={analytics.core.exerciseMetrics.filter((row) => row.plateau).slice(0, 8).map((row) => [row.name, `${countNumber(row.sessionsSincePr ?? 0)} sessions since PR`])} />
        </Card>
      </div>
      <Card><SectionHeader title="Best Sets Leaderboard" icon={Trophy} /><AnalyticsTable headers={["Exercise", "Best e1RM", "Max Weight", "Best Set Volume", "Strength Trend", "PRs"]} rows={topSets.map((row) => [row.name, row.estimatedOneRepMax, row.maxWeight, row.bestSetVolume, row.strengthTrend, row.prs])} /></Card>
      <Card><SectionHeader title="Strength Forecasts" icon={Brain} /><AnalyticsTable headers={["Lift", "Type", "Forecast", "Range", "Confidence", "Sample"]} rows={analytics.intelligence.forecasts.filter((forecast) => forecast.type === "next_e1rm" || forecast.type === "pr_likelihood" || forecast.type === "plateau_risk").slice(0, 20).map((forecast) => [forecast.targetName, forecast.type.replace(/_/g, " "), `${compactNumber(forecast.value)} ${forecast.unit}`, forecast.lowerBound !== undefined && forecast.upperBound !== undefined ? `${compactNumber(forecast.lowerBound)}-${compactNumber(forecast.upperBound)}` : "--", `${forecast.confidence}/100`, countNumber(forecast.sampleSize)])} /></Card>
    </>
  );
}

function Volume({ analytics }: { analytics: ReturnType<typeof useTrainingAnalytics> }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-5"><TrendChart title="Daily volume" data={analytics.core.dailyVolume} x="date" bars={["volume", "sets"]} /><TrendChart title="Weekly volume" data={analytics.core.weeklyVolume} x="weekStart" bars={["volume"]} /></div>
      <div className="grid grid-cols-3 gap-5">
        <TrendChart title="Volume by muscle" data={analytics.core.muscleVolume.slice(0, 10)} x="muscle" bars={["volume"]} layout="vertical" />
        <TrendChart title="Volume by equipment" data={analytics.core.equipmentVolume.slice(0, 10)} x="equipment" bars={["volume"]} layout="vertical" />
        <TrendChart title="Volume by movement" data={analytics.core.movementPatternVolume.slice(0, 10)} x="movementPattern" bars={["volume"]} layout="vertical" />
      </div>
    </>
  );
}

function MuscleBalance({ analytics }: { analytics: ReturnType<typeof useTrainingAnalytics> }) {
  return (
    <>
      <div className="grid grid-cols-5 gap-4">
        <MetricCard label="Overall" value={`${analytics.core.balance.overall}/100`} hint="balance" />
        <MetricCard label="Push/pull" value={`${analytics.core.balance.pushPull}/100`} hint="ratio" />
        <MetricCard label="Upper/lower" value={`${analytics.core.balance.upperLower}/100`} hint="ratio" />
        <MetricCard label="Chest/back" value={`${analytics.core.balance.chestBack}/100`} hint="ratio" />
        <MetricCard label="Quad/hamstring" value={`${analytics.core.balance.quadHamstring}/100`} hint="ratio" />
      </div>
      <div className="grid grid-cols-[.9fr_1.1fr] gap-5"><BodyHeatMap muscles={analytics.desktop.muscleHeatStats} /><Card><SectionHeader title="Muscle Drilldown" icon={Layers} /><AnalyticsTable headers={["Muscle", "Volume", "Sets", "Exercises", "PRs", "Last trained"]} rows={analytics.core.muscleVolume.map((row) => [row.muscle, compactNumber(row.volume), countNumber(row.sets), countNumber(row.exercises), countNumber(row.prs), row.lastTrained ? shortDate(row.lastTrained) : "--"])} /></Card></div>
    </>
  );
}

function PRs({ analytics }: { analytics: ReturnType<typeof useTrainingAnalytics> }) {
  const state = useIronLungStore();
  const records = [...state.personalRecords].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt));
  const importance = ["major", "medium", "small", "baseline"].map((level) => ({
    level,
    count: records.filter((record) => (record.importance ?? "medium") === level).length
  }));
  return (
    <div className="grid grid-cols-[.8fr_1.2fr] gap-5">
      <div className="space-y-5">
        <Card><SectionHeader title="PR Breakdown" icon={Trophy} /><StatRows rows={analytics.core.prGroups.map((row) => [prLabel(row.type), `${countNumber(row.count)} - ${row.lastAchievedAt ? shortDate(row.lastAchievedAt) : "--"}`])} /></Card>
        <Card><SectionHeader title="PR Importance" icon={Trophy} /><StatRows rows={importance.map((row) => [row.level, countNumber(row.count)])} /></Card>
      </div>
      <Card><SectionHeader title="Trophy Room" icon={Trophy} /><AnalyticsTable headers={["Date", "Exercise", "Type", "Importance", "Value"]} rows={records.map((record) => [shortDate(record.achievedAt), state.exercises.find((exercise) => exercise.id === record.exerciseId)?.name ?? "Exercise", prLabel(record.type), record.importance ?? "legacy", `${record.value} ${record.unit}`])} /></Card>
    </div>
  );
}

function Consistency({ analytics }: { analytics: ReturnType<typeof useTrainingAnalytics> }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-5"><TrendChart title="Active days / week" data={analytics.core.weeklyVolume} x="weekStart" bars={["sessions"]} /><TrendChart title="Daily sessions" data={analytics.core.dailyVolume} x="date" bars={["sessions", "prs"]} /><TrendChart title="Daily sets" data={analytics.core.dailyVolume} x="date" bars={["sets"]} /></div>
      <Card><SectionHeader title="Not-trained-in-X-days warnings" icon={CalendarDays} /><AnalyticsTable headers={["Exercise", "Last trained", "Sessions", "Volume"]} rows={[...analytics.core.exerciseMetrics].sort((a, b) => String(a.lastTrained ?? "").localeCompare(String(b.lastTrained ?? ""))).slice(0, 20).map((row) => [row.name, row.lastTrained ? shortDate(row.lastTrained) : "--", countNumber(row.sessions), compactNumber(row.volume)])} /></Card>
    </>
  );
}

function IntensityRecovery({ analytics }: { analytics: ReturnType<typeof useTrainingAnalytics> }) {
  return (
    <div className="grid grid-cols-[.9fr_1.1fr] gap-5">
      <Card><SectionHeader title="Recovery Flags" icon={Flame} /><StatRows rows={analytics.core.fatigueFlags.map((flag) => [flag.muscle, `${flag.severity} - ${countNumber(flag.recentSets)} sets - ${countNumber(flag.recentHardSets)} hard`])} /></Card>
      <Card><SectionHeader title="Hard Set Estimate" icon={Gauge} /><p className="text-sm leading-relaxed text-obsidian-muted">Hard sets are estimated from AMRAP/failure sets and sets with RPE 9+. This is a workload signal, not medical advice.</p><AnalyticsTable headers={["Muscle", "Detail"]} rows={analytics.core.fatigueFlags.map((flag) => [flag.muscle, flag.detail])} /></Card>
    </div>
  );
}

function Insights({ analytics, compact = false }: { analytics: ReturnType<typeof useTrainingAnalytics>; compact?: boolean }) {
  const items = compact ? analytics.core.insights.slice(0, 6) : analytics.core.insights;
  return (
    <div className="grid grid-cols-2 gap-5">
      <Card><SectionHeader title="Rule-Based Analyst" icon={Target} /><div className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-xl border border-obsidian-strong bg-obsidian-700 p-3"><div className="font-medium text-white">{item.title}</div><div className="mt-1 text-sm leading-relaxed text-obsidian-muted">{item.detail}</div>{item.metric && <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-obsidian-subtle">{item.metric}</div>}</div>)}</div></Card>
      <Card><SectionHeader title="Training Intelligence Recommendations" icon={Brain} /><div className="space-y-3">{analytics.intelligence.recommendations.map((item) => <div key={item.id} className="rounded-xl border border-electric bg-electric-muted p-3"><div className="font-medium text-white">{item.title}</div><div className="mt-1 text-sm leading-relaxed text-obsidian-muted">{item.detail}</div><div className="mt-2 text-sm font-semibold text-electric">{item.suggestedAction}</div></div>)}</div></Card>
    </div>
  );
}

function goalLabel(goal: ReturnType<typeof useTrainingAnalytics>["core"]["trainingGoal"]) {
  const labels = {
    strength: "Strength",
    hypertrophy: "Hypertrophy",
    lean_bulk: "Lean bulk",
    cutting: "Cutting",
    powerbuilding: "Powerbuilding",
    general_fitness: "General fitness"
  };
  return labels[goal];
}

function TrendChart({ title, data, x, bars, layout }: { title: string; data: any[]; x: string; bars: string[]; layout?: "vertical" }) {
  const displayData = data.map((row) => {
    const next = { ...row };
    for (const bar of bars) {
      if (countKeys.has(bar) && typeof next[bar] === "number") next[bar] = wholeNumber(next[bar]);
    }
    return next;
  });
  return (
    <Card>
      <SectionHeader title={title} icon={BarChart3} />
      <ResponsiveContainer width="100%" height={290}>
        <BarChart data={displayData} layout={layout} margin={layout ? { left: 80 } : undefined}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          {layout ? <XAxis type="number" stroke="rgba(255,255,255,0.35)" fontSize={12} tickLine={false} axisLine={false} /> : <XAxis dataKey={x} stroke="rgba(255,255,255,0.35)" fontSize={12} tickLine={false} axisLine={false} minTickGap={20} />}
          {layout ? <YAxis type="category" dataKey={x} width={120} stroke="rgba(255,255,255,0.35)" fontSize={12} tickLine={false} axisLine={false} /> : <YAxis stroke="rgba(255,255,255,0.35)" fontSize={12} tickLine={false} axisLine={false} />}
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
          {bars.map((bar, index) => <Bar key={bar} dataKey={bar} fill={index === 0 ? "#3b82f6" : "rgba(96,165,250,0.4)"} radius={layout ? [0, 4, 4, 0] : [4, 4, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

const countKeys = new Set(["sets", "sessions", "prs", "exercises", "reps", "workouts", "activeDays"]);

function BodyHeatMap({ muscles }: { muscles: ReturnType<typeof useTrainingAnalytics>["desktop"]["muscleHeatStats"] }) {
  const [hovered, setHovered] = useState("Pectoralis major");
  const selected = muscles.find((row) => row.muscle === hovered) ?? muscles[0];
  const max = Math.max(1, ...muscles.map((row) => row.totalExposure));
  const heat = (name: string) => {
    const value = muscles.find((row) => row.muscle === name)?.totalExposure ?? 0;
    const ratio = value / max;
    return ratio ? `rgba(255,${Math.round(96 - ratio * 70)},${Math.round(76 - ratio * 55)},${0.25 + ratio * 0.7})` : "rgba(255,255,255,0.06)";
  };
  const region = (name: string, d: string) => <path d={d} fill={heat(name)} stroke={hovered === name ? "#fff" : "rgba(255,255,255,.22)"} strokeWidth={hovered === name ? 2 : 1} onMouseEnter={() => setHovered(name)} className="cursor-pointer transition hover:brightness-125"><title>{name}</title></path>;
  return (
    <Card>
      <SectionHeader title="Interactive Body Heat Map" icon={Flame} />
      <div className="grid grid-cols-[1fr_210px] gap-4">
        <svg viewBox="0 0 560 520" className="h-[500px] w-full rounded-xl border border-obsidian bg-obsidian-700">
          <text x="140" y="28" textAnchor="middle" fill="rgba(255,255,255,.55)" fontSize="13">Front</text><text x="420" y="28" textAnchor="middle" fill="rgba(255,255,255,.55)" fontSize="13">Back</text>
          <circle cx="140" cy="58" r="24" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.2)" /><circle cx="420" cy="58" r="24" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.2)" />
          {region("Pectoralis major", "M82 120 C108 96 137 111 138 153 L138 196 C110 193 88 175 75 146 Z M146 153 C147 111 176 96 202 120 L211 146 C198 175 176 193 146 196 Z")}
          {region("Anterior deltoids", "M54 132 C66 105 90 103 107 121 L76 174 C58 169 47 153 54 132 Z M173 121 C190 103 214 105 226 132 C233 153 222 169 204 174 Z")}
          {region("Biceps brachii", "M48 176 C66 166 82 176 85 207 L70 282 C53 270 43 244 46 212 Z M232 176 C214 166 198 176 195 207 L210 282 C227 270 237 244 234 212 Z")}
          {region("Triceps brachii", "M82 178 C94 192 96 220 88 252 L73 284 C77 240 77 205 82 178 Z M198 178 C186 192 184 220 192 252 L207 284 C203 240 203 205 198 178 Z")}
          {region("Forearms", "M68 284 L52 367 C48 394 68 407 84 379 L99 304 Z M212 284 L228 367 C232 394 212 407 196 379 L181 304 Z")}
          {region("Core/abs", "M96 198 C120 209 160 209 184 198 L190 306 C164 323 116 323 90 306 Z")}
          {region("Serratus anterior", "M75 161 L105 202 L101 286 C83 256 70 214 75 161 Z M205 161 L175 202 L179 286 C197 256 210 214 205 161 Z")}
          {region("Quads", "M80 382 C105 371 133 385 133 424 L124 504 C96 498 75 462 76 423 Z M147 424 C147 385 175 371 200 382 C205 423 184 498 156 504 Z")}
          {region("Hamstrings", "M62 386 C78 377 92 387 87 426 L75 505 C52 486 46 429 62 386 Z M218 386 C202 377 188 387 193 426 L205 505 C228 486 234 429 218 386 Z")}
          {region("Glutes", "M91 308 C116 294 138 307 139 342 L134 381 C104 375 83 350 91 308 Z M146 342 C147 307 169 294 194 308 C202 350 181 375 151 381 Z")}
          {region("Gastrocnemius", "M77 505 C94 490 119 500 120 538 L66 538 Z M160 538 C161 500 186 490 203 505 L214 538 Z")}
          {region("Traps", "M371 93 C386 78 454 78 469 93 L493 127 L467 140 C449 119 391 119 373 140 L347 127 Z")}
          {region("Rhomboids", "M374 133 C395 121 445 121 466 133 L449 190 C426 178 413 178 390 190 Z")}
          {region("Rear delts", "M322 132 C337 105 363 106 378 128 L345 177 C326 171 314 153 322 132 Z M462 128 C477 106 503 105 518 132 C526 153 514 171 495 177 Z")}
          {region("Latissimus dorsi", "M348 153 C381 188 390 236 384 309 C354 281 330 224 336 170 Z M492 153 C459 188 450 236 456 309 C486 281 510 224 504 170 Z")}
          {region("Erector spinae", "M400 193 C410 216 412 282 404 338 L386 315 C392 268 392 224 400 193 Z M440 193 C430 216 428 282 436 338 L454 315 C448 268 448 224 440 193 Z")}
          {region("Glutes", "M366 311 C392 294 417 307 418 344 L411 384 C380 377 357 352 366 311 Z M424 344 C425 307 450 294 476 311 C485 352 462 377 431 384 Z")}
          {region("Hamstrings", "M348 386 C374 373 403 386 398 426 L386 510 C356 499 337 455 338 421 Z M442 426 C437 386 466 373 492 386 C503 421 484 499 454 510 Z")}
        </svg>
        <div className="rounded-xl border border-obsidian bg-obsidian-700 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-obsidian-subtle">Selected</div>
          <div className="mt-1 text-xl font-semibold">{selected?.muscle ?? hovered}</div>
          <StatRows rows={[["Heat", selected ? `${Math.round(selected.heat * 100)}%` : "0%"], ["Exposure", selected ? compactNumber(selected.totalExposure) : "0"], ["Primary", selected ? compactNumber(selected.primaryVolume) : "0"], ["Secondary", selected ? compactNumber(selected.secondaryVolume) : "0"], ["Sets", selected ? countNumber(selected.sets) : "0"], ["Last trained", selected?.lastTrained ? shortDate(selected.lastTrained) : "--"]]} />
        </div>
      </div>
    </Card>
  );
}
