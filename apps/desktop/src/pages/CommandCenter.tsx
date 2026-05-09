import { Activity, Brain, Camera, CheckCircle2, Dumbbell, Flame, Plus, Target, Trophy, TrendingUp } from "lucide-react";
import { isMeaningfulPr, prLabel, type DateRangePreset } from "@ironlung/core";
import { useState } from "react";
import { Card, MetricCard, SectionHeader } from "../components/cards/Card";
import { Button } from "../components/forms/controls";
import { ScreenShell } from "../components/layout/ScreenShell";
import { StatRows } from "../components/tables/AnalyticsTable";
import { EmptyState } from "../components/empty-states/EmptyState";
import { compactNumber, countNumber, shortDate } from "../lib/format";
import { selectOpenSession, useIronLungStore } from "../lib/store";
import { useTrainingAnalytics } from "../features/analytics/useTrainingAnalytics";
import type { AppScreen } from "../app/navigation";

export function CommandCenter({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  const [range, setRange] = useState<DateRangePreset>("30d");
  const state = useIronLungStore();
  const { core, desktop, intelligence } = useTrainingAnalytics(range);
  const openSession = selectOpenSession(state);
  const latestPhoto = [...state.photos].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
  const latestAnalysis = [...state.analyses].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const meaningfulPrs = state.personalRecords.filter(isMeaningfulPr);
  const recentPrs = [...meaningfulPrs].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt)).slice(0, 6);
  const recentTemplates = [...state.templates].slice(-3).reverse();
  const lastMuscles = desktop.muscleHeatStats.slice(0, 5).map((row) => row.muscle).join(", ") || "No training yet";
  const mostImproved = [...core.exerciseMetrics].sort((a, b) => b.strengthTrend - a.strengthTrend)[0];
  const mostNeglected = [...core.exerciseMetrics].filter((exercise) => exercise.lastTrained).sort((a, b) => String(a.lastTrained).localeCompare(String(b.lastTrained)))[0];
  const bestRecentPr = recentPrs[0];
  const lastSession = [...state.sessions].filter((session) => session.finishedAt).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const lastSessionRows = lastSession ? state.sessionExercises.filter((row) => row.workoutSessionId === lastSession.id) : [];
  const lastSessionSets = lastSessionRows.flatMap((row) => state.setLogs.filter((set) => set.workoutSessionExerciseId === row.id));
  const recoveryConcern = core.fatigueFlags[0];
  const coreFocus = core.recommendations[0] ?? core.insights.find((item) => item.severity !== "positive");
  const nextFocus = intelligence.recommendations[0]
    ? { title: intelligence.recommendations[0].title, detail: intelligence.recommendations[0].suggestedAction }
    : coreFocus
      ? { title: coreFocus.title, detail: coreFocus.recommendation ?? coreFocus.detail }
      : null;
  const topForecast = intelligence.forecasts.find((forecast) => forecast.type === "pr_likelihood") ?? intelligence.forecasts[0];

  return (
    <ScreenShell
      title="Command Center"
      subtitle="Your training status, weak points, PRs, and next actions."
      action={<RangeSelector value={range} onChange={setRange} />}
    >
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Muscle balance" value={`${core.balance.overall}/100`} hint="overall score" tone={core.balance.overall >= 75 ? "good" : "warn"} />
        <MetricCard label="Readiness" value={`${intelligence.analyst.readinessScore}/100`} hint="training intelligence" tone={intelligence.analyst.readinessScore >= 70 ? "good" : "warn"} />
        <MetricCard label="Meaningful PRs" value={countNumber(meaningfulPrs.length)} hint="major/medium only" />
        <MetricCard label="Fatigue flags" value={countNumber(core.fatigueFlags.length)} hint="rule-based" tone={core.fatigueFlags.length ? "warn" : "good"} />
      </div>

      <div className="grid grid-cols-4 gap-5">
        <Card>
          <SectionHeader title="What To Focus On Next" icon={Target} />
          {nextFocus ? (
            <div className="rounded-xl border border-electric bg-electric-muted p-4">
              <div className="font-semibold">{nextFocus.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-obsidian-muted">{nextFocus.detail}</p>
              {core.currentBlock && <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-obsidian-subtle">Current block: {core.currentBlock.name}</p>}
            </div>
          ) : <EmptyState icon={Target} title="No focus signal yet" body="Log or import enough sessions for IronLung to compare trends." />}
        </Card>
        <Card>
          <SectionHeader title="Most Improved This Period" icon={CheckCircle2} />
          {mostImproved ? <StatRows rows={[["Exercise", mostImproved.name], ["Estimated 1RM", compactNumber(mostImproved.estimatedOneRepMax)], ["Trend", `${mostImproved.strengthTrend}`], ["Last trained", mostImproved.lastTrained ? shortDate(mostImproved.lastTrained) : "--"]]} /> : <EmptyState icon={CheckCircle2} title="No improvement signal" body="Strength trends appear after multiple sets or sessions." />}
        </Card>
        <Card>
          <SectionHeader title="Top Forecast" icon={TrendingUp} />
          {topForecast ? <StatRows rows={[
            ["Signal", topForecast.targetName],
            ["Type", topForecast.type.replace(/_/g, " ")],
            ["Forecast", `${compactNumber(topForecast.value)} ${topForecast.unit}`],
            ["Confidence", `${topForecast.confidence}/100`],
            ["Sample", countNumber(topForecast.sampleSize)]
          ]} /> : <EmptyState icon={TrendingUp} title="No forecast yet" body="Forecasts need multiple logged sets or sessions." />}
        </Card>
        <Card>
          <SectionHeader title="Potential Recovery Concern" icon={Flame} />
          {recoveryConcern ? <StatRows rows={[["Muscle", recoveryConcern.muscle], ["Severity", recoveryConcern.severity], ["Recent sets", countNumber(recoveryConcern.recentSets)], ["Hard sets", countNumber(recoveryConcern.recentHardSets)]]} /> : <EmptyState icon={Flame} title="No recovery concern" body="No high recent distributed volume or hard-set flag is active." />}
        </Card>
      </div>

      <div className="grid grid-cols-[1.05fr_.95fr] gap-5">
        <Card>
          <SectionHeader title="Train Today" icon={Dumbbell} />
          <div className="space-y-3">
            {openSession ? (
              <div className="rounded-xl border border-electric bg-electric-muted p-4">
                <div className="font-semibold">{openSession.name}</div>
                <div className="text-sm text-obsidian-muted">Active workout ready to resume.</div>
                <Button className="mt-3" onClick={() => onNavigate("Train")} icon={Flame}>Resume workout</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => { state.startWorkout(); onNavigate("Train"); }} icon={Plus}>Start empty workout</Button>
                <Button variant="ghost" onClick={() => onNavigate("Train")} icon={Dumbbell}>Open Train</Button>
              </div>
            )}
            {!!recentTemplates.length && (
              <div className="grid gap-2">
                {recentTemplates.map((template) => (
                  <button key={template.id} onClick={() => { state.startWorkout(template.id); onNavigate("Train"); }} className="group flex w-full flex-col items-start rounded-lg border border-obsidian-strong bg-obsidian-700 p-3 text-left transition-colors hover:border-electric hover:bg-obsidian-600">
                    <div className="text-sm font-semibold text-white transition-colors group-hover:text-electric">{template.name}</div>
                    <div className="mt-0.5 text-xs text-[rgba(255,255,255,0.5)]">Start user-created template</div>
                  </button>
                ))}
              </div>
            )}
            <div className="rounded-xl border border-obsidian bg-obsidian-700 p-3 text-sm leading-relaxed text-obsidian-muted">Recently loaded muscles: {lastMuscles}</div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Weekly Momentum" icon={Activity} />
          <StatRows rows={[
            ["Sessions", countNumber(core.totals.sessions)],
            ["Sets completed", countNumber(core.totals.sets)],
            ["Total volume", compactNumber(core.totals.volume)],
            ["PRs", countNumber(core.totals.prs)],
            ["Volume vs previous", `${core.comparison.volumeDeltaPercent}%`]
          ]} />
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card>
          <SectionHeader title="Muscle Balance Score" icon={Target} />
          <div className="mb-4 text-5xl font-semibold">{core.balance.overall}</div>
          <StatRows rows={[
            ["Push / pull", `${core.balance.pushPull}/100`],
            ["Upper / lower", `${core.balance.upperLower}/100`],
            ["Chest / back", `${core.balance.chestBack}/100`],
            ["Quad / hamstring", `${core.balance.quadHamstring}/100`],
            ["Shoulder balance", `${core.balance.shoulder}/100`]
          ]} />
        </Card>

        <Card>
          <SectionHeader title="Training Intelligence" icon={Brain} />
          <div className="space-y-3">
            {[
              { id: "readiness", title: "Readiness", detail: `${intelligence.analyst.readinessScore}/100 - ${intelligence.analyst.focus}` },
              { id: "weak", title: "Weak point", detail: intelligence.analyst.weakPoint },
              { id: "recovery", title: "Recovery concern", detail: intelligence.analyst.recoveryConcern },
              ...core.insights.slice(0, 3)
            ].map((item) => (
              <div key={item.id} className="rounded-xl border border-obsidian-strong bg-obsidian-700 p-3">
                <div className="font-medium text-white">{item.title}</div>
                <div className="mt-1 text-sm leading-relaxed text-obsidian-muted">{item.detail}</div>
              </div>
            ))}
            {!core.insights.length && <EmptyState icon={CheckCircle2} title="No insights yet" body="Import or log workouts to generate rule-based training insights." />}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Recovery/Fatigue Flags" icon={Flame} />
          <div className="space-y-3">
            {core.fatigueFlags.slice(0, 5).map((flag) => (
              <div key={flag.muscle} className="rounded-xl border border-warn bg-warn-muted p-3">
                <div className="font-medium text-white">{flag.muscle}</div>
                <div className="text-sm text-obsidian-muted">{flag.detail}</div>
              </div>
            ))}
            {!core.fatigueFlags.length && <EmptyState icon={Flame} title="No fatigue flags" body="No high recent volume/RPE spikes detected for this range." />}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[1fr_.75fr] gap-5">
        <Card>
          <SectionHeader title="Recent Meaningful PRs" icon={Trophy} />
          <div className="grid grid-cols-2 gap-3">
            {recentPrs.map((record) => {
              const exercise = state.exercises.find((item) => item.id === record.exerciseId);
              return (
                <div key={record.id} className="min-w-[155px] rounded-xl border border-electric bg-[rgba(59,130,246,0.07)] p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.55)]">{exercise?.name ?? "Exercise"}</div>
                  <div className="text-sm font-semibold text-electric">{prLabel(record.type)} - {shortDate(record.achievedAt)}</div>
                  <div className="mt-2 font-mono text-xl font-bold tracking-tight text-white">{record.value} {record.unit}</div>
                </div>
              );
            })}
            {!recentPrs.length && <EmptyState icon={Trophy} title="No PRs yet" body="PRs appear after imported or logged sets create new records." />}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Progress Photo Snapshot" icon={Camera} />
          {latestPhoto ? (
            <div className="space-y-3">
              <img src={latestPhoto.imagePath} alt="Latest progress" className="h-52 w-full rounded-xl border border-obsidian object-cover" />
              <StatRows rows={[
                ["Progress Photo Index", latestAnalysis ? String(Math.round(latestAnalysis.score)) : "--"],
                ["Confidence", latestAnalysis ? String(latestAnalysis.confidence) : "--"],
                ["Captured", shortDate(latestPhoto.capturedAt)]
              ]} />
              <p className="text-xs leading-relaxed text-obsidian-subtle">This is an experimental progress metric. It is not a medical diagnosis, body-fat measurement, or attractiveness rating.</p>
            </div>
          ) : (
            <EmptyState icon={Camera} title="No progress photos" body="Photos stay local and analysis requires explicit consent." action={<Button variant="ghost" onClick={() => onNavigate("Photos")}>Open Photos</Button>} />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card>
          <SectionHeader title="Most Neglected This Period" icon={Activity} />
          {mostNeglected ? <StatRows rows={[["Exercise", mostNeglected.name], ["Last trained", mostNeglected.lastTrained ? shortDate(mostNeglected.lastTrained) : "--"], ["Sessions", countNumber(mostNeglected.sessions)], ["Volume", `${compactNumber(mostNeglected.volume)} ${state.unitPreference}`]]} /> : <EmptyState icon={Activity} title="No neglected lift yet" body="Neglect signals need at least one logged exercise history." />}
        </Card>
        <Card>
          <SectionHeader title="Best Recent PR" icon={Trophy} />
          {bestRecentPr ? <StatRows rows={[["Exercise", state.exercises.find((item) => item.id === bestRecentPr.exerciseId)?.name ?? "Exercise"], ["Type", prLabel(bestRecentPr.type)], ["Value", `${bestRecentPr.value} ${bestRecentPr.unit}`], ["Importance", bestRecentPr.importance ?? "legacy"]]} /> : <EmptyState icon={Trophy} title="No meaningful recent PR" body="Baseline and tiny PRs are kept in history but filtered from the cockpit." />}
        </Card>
        <Card>
          <SectionHeader title="Last Workout Summary" icon={Dumbbell} />
          {lastSession ? <StatRows rows={[["Workout", lastSession.name], ["Date", shortDate(lastSession.startedAt)], ["Exercises", countNumber(lastSessionRows.length)], ["Sets", countNumber(lastSessionSets.length)], ["Volume", `${compactNumber(lastSessionSets.reduce((total, set) => total + set.weight * set.reps, 0))} ${state.unitPreference}`]]} /> : <EmptyState icon={Dumbbell} title="No finished workout" body="Finish a workout to see the last-session summary here." />}
        </Card>
      </div>
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
