import { Activity, Camera, CheckCircle2, Dumbbell, Flame, Plus, Target, Trophy } from "lucide-react";
import { isMeaningfulPr, prLabel, type DateRangePreset } from "@ironlung/core";
import { useState } from "react";
import { Card, MetricCard, SectionHeader } from "../components/cards/Card";
import { Button, Select } from "../components/forms/controls";
import { ScreenShell } from "../components/layout/ScreenShell";
import { StatRows } from "../components/tables/AnalyticsTable";
import { EmptyState } from "../components/empty-states/EmptyState";
import { compactNumber, shortDate } from "../lib/format";
import { selectOpenSession, useIronLungStore } from "../lib/store";
import { useTrainingAnalytics } from "../features/analytics/useTrainingAnalytics";
import type { AppScreen } from "../app/navigation";

export function CommandCenter({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  const [range, setRange] = useState<DateRangePreset>("30d");
  const state = useIronLungStore();
  const { core, desktop } = useTrainingAnalytics(range);
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
  const nextFocus = core.recommendations[0] ?? core.insights.find((item) => item.severity !== "positive");

  return (
    <ScreenShell
      title="Command Center"
      subtitle="Your training status, weak points, PRs, and next actions."
      action={
        <Select value={range} onChange={(value) => setRange(value as DateRangePreset)}>
          <option value="7d">7D</option>
          <option value="30d">30D</option>
          <option value="90d">90D</option>
          <option value="1y">1Y</option>
          <option value="all">All time</option>
        </Select>
      }
    >
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Muscle balance" value={`${core.balance.overall}/100`} hint="overall score" tone={core.balance.overall >= 75 ? "good" : "warn"} />
        <MetricCard label="Volume trend" value={`${core.comparison.volumeDeltaPercent}%`} hint="vs previous period" tone={core.comparison.volumeDeltaPercent >= 0 ? "good" : "warn"} />
        <MetricCard label="Meaningful PRs" value={String(meaningfulPrs.length)} hint="major/medium only" />
        <MetricCard label="Fatigue flags" value={String(core.fatigueFlags.length)} hint="rule-based" tone={core.fatigueFlags.length ? "warn" : "good"} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card>
          <SectionHeader title="What To Focus On Next" icon={Target} />
          {nextFocus ? (
            <div className="rounded-xl border border-accent/25 bg-accent/8 p-4">
              <div className="font-semibold">{nextFocus.title}</div>
              <p className="mt-2 text-sm leading-6 text-white/55">{nextFocus.recommendation ?? nextFocus.detail}</p>
              {core.currentBlock && <p className="mt-3 text-xs uppercase tracking-wide text-white/35">Current block: {core.currentBlock.name}</p>}
            </div>
          ) : <EmptyState icon={Target} title="No focus signal yet" body="Log or import enough sessions for IronLung to compare trends." />}
        </Card>
        <Card>
          <SectionHeader title="Most Improved This Period" icon={CheckCircle2} />
          {mostImproved ? <StatRows rows={[["Exercise", mostImproved.name], ["Estimated 1RM", compactNumber(mostImproved.estimatedOneRepMax)], ["Trend", `${mostImproved.strengthTrend}`], ["Last trained", mostImproved.lastTrained ? shortDate(mostImproved.lastTrained) : "--"]]} /> : <EmptyState icon={CheckCircle2} title="No improvement signal" body="Strength trends appear after multiple sets or sessions." />}
        </Card>
        <Card>
          <SectionHeader title="Potential Recovery Concern" icon={Flame} />
          {recoveryConcern ? <StatRows rows={[["Muscle", recoveryConcern.muscle], ["Severity", recoveryConcern.severity], ["Recent sets", String(recoveryConcern.recentSets)], ["Hard sets", String(recoveryConcern.recentHardSets)]]} /> : <EmptyState icon={Flame} title="No recovery concern" body="No high recent distributed volume or hard-set flag is active." />}
        </Card>
      </div>

      <div className="grid grid-cols-[1.05fr_.95fr] gap-5">
        <Card>
          <SectionHeader title="Train Today" icon={Dumbbell} />
          <div className="space-y-3">
            {openSession ? (
              <div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
                <div className="font-semibold">{openSession.name}</div>
                <div className="text-sm text-white/50">Active workout ready to resume.</div>
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
                  <button key={template.id} onClick={() => { state.startWorkout(template.id); onNavigate("Train"); }} className="rounded-xl border border-line bg-white/[0.035] p-3 text-left hover:border-accent/50">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-white/42">Start user-created template</div>
                  </button>
                ))}
              </div>
            )}
            <div className="rounded-xl border border-line bg-black/15 p-3 text-sm text-white/55">Recently loaded muscles: {lastMuscles}</div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Weekly Momentum" icon={Activity} />
          <StatRows rows={[
            ["Sessions", String(core.totals.sessions)],
            ["Sets completed", compactNumber(core.totals.sets)],
            ["Total volume", compactNumber(core.totals.volume)],
            ["PRs", String(core.totals.prs)],
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
          <SectionHeader title="Smart Insights" icon={CheckCircle2} />
          <div className="space-y-3">
            {core.insights.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-xl border border-line bg-white/[0.035] p-3">
                <div className="font-medium">{item.title}</div>
                <div className="mt-1 text-sm leading-5 text-white/50">{item.detail}</div>
              </div>
            ))}
            {!core.insights.length && <EmptyState icon={CheckCircle2} title="No insights yet" body="Import or log workouts to generate rule-based training insights." />}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Recovery/Fatigue Flags" icon={Flame} />
          <div className="space-y-3">
            {core.fatigueFlags.slice(0, 5).map((flag) => (
              <div key={flag.muscle} className="rounded-xl border border-amber-300/20 bg-amber-300/8 p-3">
                <div className="font-medium">{flag.muscle}</div>
                <div className="text-sm text-white/52">{flag.detail}</div>
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
                <div key={record.id} className="rounded-xl border border-line bg-white/[0.03] p-3">
                  <div className="font-medium">{exercise?.name ?? "Exercise"}</div>
                  <div className="text-sm text-white/45">{prLabel(record.type)} - {shortDate(record.achievedAt)}</div>
                  <div className="mt-2 text-lg font-semibold text-mint">{record.value} {record.unit}</div>
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
              <img src={latestPhoto.imagePath} alt="Latest progress" className="h-52 w-full rounded-xl border border-line object-cover" />
              <StatRows rows={[
                ["Progress Photo Index", latestAnalysis ? String(Math.round(latestAnalysis.score)) : "--"],
                ["Confidence", latestAnalysis ? String(latestAnalysis.confidence) : "--"],
                ["Captured", shortDate(latestPhoto.capturedAt)]
              ]} />
              <p className="text-xs leading-5 text-white/45">This is an experimental progress metric. It is not a medical diagnosis, body-fat measurement, or attractiveness rating.</p>
            </div>
          ) : (
            <EmptyState icon={Camera} title="No progress photos" body="Photos stay local and analysis requires explicit consent." action={<Button variant="ghost" onClick={() => onNavigate("Photos")}>Open Photos</Button>} />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card>
          <SectionHeader title="Most Neglected This Period" icon={Activity} />
          {mostNeglected ? <StatRows rows={[["Exercise", mostNeglected.name], ["Last trained", mostNeglected.lastTrained ? shortDate(mostNeglected.lastTrained) : "--"], ["Sessions", String(mostNeglected.sessions)], ["Volume", `${compactNumber(mostNeglected.volume)} ${state.unitPreference}`]]} /> : <EmptyState icon={Activity} title="No neglected lift yet" body="Neglect signals need at least one logged exercise history." />}
        </Card>
        <Card>
          <SectionHeader title="Best Recent PR" icon={Trophy} />
          {bestRecentPr ? <StatRows rows={[["Exercise", state.exercises.find((item) => item.id === bestRecentPr.exerciseId)?.name ?? "Exercise"], ["Type", prLabel(bestRecentPr.type)], ["Value", `${bestRecentPr.value} ${bestRecentPr.unit}`], ["Importance", bestRecentPr.importance ?? "legacy"]]} /> : <EmptyState icon={Trophy} title="No meaningful recent PR" body="Baseline and tiny PRs are kept in history but filtered from the cockpit." />}
        </Card>
        <Card>
          <SectionHeader title="Last Workout Summary" icon={Dumbbell} />
          {lastSession ? <StatRows rows={[["Workout", lastSession.name], ["Date", shortDate(lastSession.startedAt)], ["Exercises", String(lastSessionRows.length)], ["Sets", String(lastSessionSets.length)], ["Volume", `${compactNumber(lastSessionSets.reduce((total, set) => total + set.weight * set.reps, 0))} ${state.unitPreference}`]]} /> : <EmptyState icon={Dumbbell} title="No finished workout" body="Finish a workout to see the last-session summary here." />}
        </Card>
      </div>
    </ScreenShell>
  );
}
