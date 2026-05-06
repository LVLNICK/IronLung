import { Activity, Camera, CheckCircle2, Dumbbell, Flame, Plus, Target, Trophy } from "lucide-react";
import { prLabel, type DateRangePreset } from "@ironlung/core";
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
  const recentPrs = [...state.personalRecords].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt)).slice(0, 6);
  const recentTemplates = [...state.templates].slice(-3).reverse();
  const lastMuscles = desktop.muscleHeatStats.slice(0, 5).map((row) => row.muscle).join(", ") || "No training yet";

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
        <MetricCard label="PRs" value={String(core.totals.prs)} hint="meaningful events" />
        <MetricCard label="Fatigue flags" value={String(core.fatigueFlags.length)} hint="rule-based" tone={core.fatigueFlags.length ? "warn" : "good"} />
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
                ["Latest score", latestAnalysis ? String(Math.round(latestAnalysis.score)) : "--"],
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
    </ScreenShell>
  );
}
