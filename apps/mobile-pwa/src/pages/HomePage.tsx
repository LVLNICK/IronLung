import { Bell, ChevronRight, Dumbbell, ShieldCheck, Target, Zap } from "lucide-react";
import type { MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel } from "../features/analytics/mobileAnalytics";
import type { MobileTab } from "../types";
import { CircularScore, GlassCard, IconTile, MiniTrendBars, MobileGhostButton, MobilePage, MobilePrimaryButton, SectionTitle, StatusPill } from "../components/MobilePrimitives";
import { formatNumber } from "./AnalyzerShared";

export function HomePage({ snapshot, analyzer, onOpenSync, onNavigate }: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel; onOpenSync: () => void; onNavigate: (tab: MobileTab) => void }) {
  const homeTrend = homeTrendSeries(analyzer, snapshot);
  const intelligence = analyzer.intelligence;
  const volume = analyzer.summary.totals.volume || homeTrend.values.reduce((sum, value) => sum + value, 0);
  const readableVolume = formatNumber(volume);
  const readiness = intelligence.analyst.readinessScore;
  const bestPr = analyzer.recentPrs[0];
  const bestPrExerciseName = bestPr
    ? analyzer.strengthRows.find((row) => row.exerciseId === bestPr.exerciseId)?.exerciseName
      ?? snapshot.exercises.find((exercise) => exercise.id === bestPr.exerciseId)?.name
      ?? "Exercise"
    : null;
  const topRecommendation = intelligence.recommendations[0];
  const focus = topRecommendation ? { title: topRecommendation.title, detail: topRecommendation.suggestedAction } : splitInsight(analyzer.weakPoint);
  const topForecast = intelligence.forecasts.find((forecast) => forecast.type === "pr_likelihood") ?? intelligence.forecasts[0];
  const hasFatigue = analyzer.summary.fatigueFlags.length > 0;

  return (
    <MobilePage>
      <BrandHeader />

      <section className="pt-1">
        <h1 className="text-[1.9rem] font-black leading-tight tracking-tight">Good morning.</h1>
        <p className="mt-1 text-base leading-relaxed text-slate-400">You're on track. Let's get better today.</p>
      </section>

      <GlassCard className="p-5">
        <div className="grid gap-4 min-[390px]:grid-cols-[minmax(0,1fr)_6.5rem] min-[400px]:grid-cols-[minmax(0,1fr)_7.75rem] min-[390px]:items-center">
          <div className="min-w-0">
            <SectionTitle label="Today's readiness" />
            <h2 className="text-[1.45rem] font-black leading-tight">{readiness >= 70 ? "Ready to train" : "Train with caution"}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{intelligence.analyst.focus}</p>
          </div>
          <CircularScore value={readiness} label="ready" size="normal" />
        </div>
        <div className="mt-5 grid grid-cols-[1.25fr_1fr] gap-3">
          <MobilePrimaryButton onClick={() => onNavigate("train")} className="flex items-center justify-center gap-2 text-base">Train Today <ChevronRight className="h-5 w-5" /></MobilePrimaryButton>
          <MobileGhostButton onClick={onOpenSync} className="text-base">Sync/Data</MobileGhostButton>
        </div>
      </GlassCard>

      <button onClick={() => onNavigate("analytics")} className="block w-full text-left">
        <GlassCard className="grid grid-cols-[3.5rem_minmax(0,1fr)_1.25rem] items-center gap-3 p-4 transition hover:border-blue-500/45">
          <IconTile icon={Target} size="large" />
          <div className="min-w-0">
            <SectionTitle label="What to focus on" />
            <div className="text-lg font-black leading-tight">{focus.title || "Add rear delt + row work"}</div>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{focus.detail || "Back exposure is lower than pressing volume in this cache."}</p>
          </div>
          <ChevronRight className="h-6 w-6 text-white" />
        </GlassCard>
      </button>

      <GlassCard className="p-4">
        <div className="grid gap-4 min-[390px]:grid-cols-[minmax(0,1fr)_9rem] min-[390px]:items-end">
          <div>
            <SectionTitle label="Weekly load trend" />
            <div className="font-mono text-[2.05rem] font-black leading-none">{readableVolume} lb</div>
            <p className="mt-2 text-sm text-slate-400">{homeTrend.source}</p>
          </div>
          <MiniTrendBars values={homeTrend.values} labels={homeTrend.labels} />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
        <GlassCard className="p-4">
          <SectionTitle label="Recent PR" />
          <div className="flex items-center gap-3">
            <IconTile icon={Dumbbell} />
            <div className="min-w-0">
              <div className="truncate text-base font-black">{bestPrExerciseName ?? "No PR yet"}</div>
              <div className="mt-1 font-mono text-xl font-black text-blue-400">{bestPr ? `${formatNumber(bestPr.value)} ${bestPr.unit}` : "Import data"}</div>
            </div>
          </div>
          <button onClick={() => onNavigate("analytics")} className="mt-4 flex w-full items-center justify-between border-t border-white/10 pt-3 text-left text-sm text-slate-400">
            <span>{bestPr ? "View PR details" : "Open analytics"}</span><ChevronRight className="h-5 w-5" />
          </button>
        </GlassCard>

        <GlassCard className="p-4">
          <SectionTitle label="Recovery check" />
          <RecoveryRow label="Fatigue" value={hasFatigue ? "Flag" : "Stable"} tone={hasFatigue ? "yellow" : "green"} />
          <RecoveryRow label="Sleep" value="Good" tone="green" sub="local note" />
          <RecoveryRow label="Soreness" value={hasFatigue ? "Watch" : "Low"} tone={hasFatigue ? "yellow" : "green"} />
          <button onClick={() => onNavigate("analytics")} className="mt-3 flex w-full items-center justify-between border-t border-white/10 pt-3 text-left text-sm text-blue-400">View details <ChevronRight className="h-5 w-5" /></button>
        </GlassCard>
      </div>

      <GlassCard className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 p-4">
        <IconTile icon={Target} size="large" />
        <div className="min-w-0">
          <SectionTitle label="Training intelligence" />
          <div className="text-lg font-black leading-tight">{topForecast?.targetName ?? "No forecast yet"}</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            {topForecast ? `${topForecast.type.replace(/_/g, " ")}: ${formatNumber(topForecast.value)} ${topForecast.unit} with ${topForecast.confidence}/100 confidence.` : "Import more workout history to unlock forecasts."}
          </p>
        </div>
      </GlassCard>

      <GlassCard className="grid grid-cols-[3.5rem_minmax(0,1fr)_5.5rem] items-center gap-3 p-4">
        <IconTile icon={Zap} size="large" />
        <div className="min-w-0">
          <div className="text-lg font-black leading-tight">Momentum is building.</div>
          <p className="mt-1 text-sm text-slate-400">{analyzer.currentBlockName === "No current block" ? "No current block selected." : analyzer.currentBlockName}</p>
        </div>
        <div className="grid h-20 w-20 place-items-center rounded-full border-[8px] border-blue-500/90 border-b-slate-700">
          <div className="text-center">
            <div className="font-mono text-2xl font-black">{formatNumber(Math.max(1, analyzer.summary.totals.sessions || 0))}</div>
            <div className="text-[0.65rem] text-slate-400">sessions</div>
          </div>
        </div>
      </GlassCard>
    </MobilePage>
  );
}

export function BrandHeader() {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.45)]" style={{ clipPath: "polygon(25% 0,75% 0,100% 25%,100% 75%,75% 100%,25% 100%,0 75%,0 25%)" }}>
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="text-[1.45rem] font-black leading-none">IronLung</div>
          <div className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">Local-first fitness</div>
        </div>
      </div>
      <div className="relative grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04]" aria-label="Local-first privacy status">
        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-blue-500" />
        <Bell className="h-6 w-6 text-white" />
      </div>
    </div>
  );
}

function RecoveryRow({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: "green" | "yellow" }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-bold">{label}</div>
        <div className="text-xs text-slate-500">{sub ?? "from cache"}</div>
      </div>
      <StatusPill tone={tone}>{value}</StatusPill>
    </div>
  );
}

function splitInsight(value: string) {
  const [title, ...detail] = value.split(":");
  return { title: title?.trim(), detail: detail.join(":").trim() };
}

function homeTrendSeries(analyzer: MobileAnalyzerModel, snapshot: MobileSnapshot) {
  const dailyRows = newestRowsChronological(analyzer.dailyRows);
  if (dailyRows.some((row) => row.value > 0)) {
    return padTrendRows(dailyRows, "Daily volume from imported workout sets.");
  }
  const weeklyRows = newestRowsChronological(analyzer.weeklyRows);
  if (weeklyRows.some((row) => row.value > 0)) {
    return padTrendRows(weeklyRows, "Weekly volume from imported workouts.");
  }
  const rawRows = rawSetVolumeRows(snapshot);
  if (rawRows.some((row) => row.value > 0)) {
    return padTrendRows(rawRows, "Raw set volume from local cache.");
  }
  return {
    values: [0, 0, 0, 0, 0, 0, 0],
    labels: ["", "", "", "", "", "", ""],
    source: "No workout volume found yet."
  };
}

function newestRowsChronological(rows: MobileAnalyzerModel["dailyRows"]) {
  return rows.filter((row) => Number.isFinite(row.value)).slice(0, 7).reverse();
}

function padTrendRows(rows: MobileAnalyzerModel["dailyRows"], source: string) {
  const missing = Math.max(0, 7 - rows.length);
  return {
    values: [...Array(missing).fill(0), ...rows.map((row) => row.value)],
    labels: [...Array(missing).fill(""), ...rows.map((row) => row.label.replace(/^Week\s+/i, ""))],
    source
  };
}

function rawSetVolumeRows(snapshot: MobileSnapshot): MobileAnalyzerModel["dailyRows"] {
  const days = new Map<string, number>();
  for (const set of snapshot.setLogs.filter((row) => !row.deletedAt && row.isCompleted)) {
    const label = new Date(set.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    days.set(label, (days.get(label) ?? 0) + set.weight * set.reps);
  }
  return [...days.entries()].map(([label, value]) => ({ label, value })).slice(-7);
}
