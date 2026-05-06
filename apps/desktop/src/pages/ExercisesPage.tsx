import { useMemo, useState } from "react";
import { Activity, BarChart3, Dumbbell, Plus, Search, TrendingUp } from "lucide-react";
import { muscleContributionWarnings, prLabel, resolveMuscleContributions } from "@ironlung/core";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, MetricCard, SectionHeader } from "../components/cards/Card";
import { Button, Input, Select } from "../components/forms/controls";
import { ScreenShell } from "../components/layout/ScreenShell";
import { EmptyState } from "../components/empty-states/EmptyState";
import { AnalyticsTable, StatRows } from "../components/tables/AnalyticsTable";
import { tooltipStyle } from "../components/charts/ChartPrimitives";
import { compactNumber, shortDate } from "../lib/format";
import { useIronLungStore } from "../lib/store";
import { useTrainingAnalytics } from "../features/analytics/useTrainingAnalytics";

export function ExercisesPage() {
  const state = useIronLungStore();
  const { core, desktop } = useTrainingAnalytics("all");
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [pattern, setPattern] = useState("");
  const [sort, setSort] = useState("recently trained");
  const [selectedId, setSelectedId] = useState(core.exerciseMetrics[0]?.exerciseId ?? "");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const rows = [...core.exerciseMetrics].filter((exercise) =>
      exercise.name.toLowerCase().includes(query.toLowerCase()) &&
      (!muscle || exercise.primaryMuscle === muscle) &&
      (!equipment || exercise.equipment === equipment) &&
      (!pattern || exercise.movementPattern === pattern)
    );
    if (sort === "most volume") rows.sort((a, b) => b.volume - a.volume);
    if (sort === "most PRs") rows.sort((a, b) => b.prs - a.prs);
    if (sort === "neglected") rows.sort((a, b) => String(a.lastTrained ?? "").localeCompare(String(b.lastTrained ?? "")));
    if (sort === "alphabetical") rows.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "recently trained") rows.sort((a, b) => String(b.lastTrained ?? "").localeCompare(String(a.lastTrained ?? "")));
    return rows;
  }, [core.exerciseMetrics, query, muscle, equipment, pattern, sort]);
  const selectedInFilteredList = filtered.find((exercise) => exercise.exerciseId === selectedId);
  const selected = selectedInFilteredList ?? filtered[0] ?? null;
  const detail = desktop.exerciseDetails.find((exercise) => exercise.exerciseId === selected?.exerciseId);
  const muscles = [...new Set(core.exerciseMetrics.map((exercise) => exercise.primaryMuscle))].sort();
  const equipmentOptions = [...new Set(core.exerciseMetrics.map((exercise) => exercise.equipment))].sort();
  const patterns = [...new Set(core.exerciseMetrics.map((exercise) => exercise.movementPattern))].sort();

  return (
    <ScreenShell title="Exercises" subtitle="Professional exercise library, drilldowns, PRs, plateaus, and exercise intelligence.">
      <div className="grid grid-cols-[420px_1fr] gap-5">
        <Card>
          <SectionHeader title="Exercise Library" icon={Search} action={<Button icon={Plus} onClick={() => setCreateOpen(true)}>Create</Button>} />
          <div className="grid gap-2">
            <Input placeholder="Search exercises" value={query} onChange={setQuery} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={muscle} onChange={setMuscle}><option value="">All muscles</option>{muscles.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
              <Select value={equipment} onChange={setEquipment}><option value="">All equipment</option>{equipmentOptions.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
              <Select value={pattern} onChange={setPattern}><option value="">All patterns</option>{patterns.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
              <Select value={sort} onChange={setSort}><option>recently trained</option><option>most volume</option><option>most PRs</option><option>neglected</option><option>alphabetical</option></Select>
            </div>
          </div>
          <div className="mt-4 max-h-[680px] space-y-2 overflow-auto pr-1">
            {filtered.map((exercise) => (
              <button key={exercise.exerciseId} onClick={() => setSelectedId(exercise.exerciseId)} className={`w-full rounded-xl border p-3 text-left transition ${selected?.exerciseId === exercise.exerciseId ? "border-accent/60 bg-accent/10" : "border-line bg-white/[0.03] hover:border-white/20"}`}>
                <div className="font-medium">{exercise.name}</div>
                <div className="text-sm text-white/45">{exercise.primaryMuscle} - {exercise.sessions} sessions - {compactNumber(exercise.volume)} volume</div>
              </button>
            ))}
            {!filtered.length && (
              <EmptyState
                icon={Search}
                title="No exercises match"
                body="Try a different search term or clear the filters."
              />
            )}
          </div>
        </Card>

        {selected && detail ? <ExerciseDetail selected={selected} detail={detail} /> : selected ? <NeverTrainedExercise selected={selected} /> : <Card><EmptyState icon={Dumbbell} title="No exercise data" body="Create, import, or log workouts to populate exercise intelligence." /></Card>}
      </div>
      {createOpen && <CreateExerciseDrawer onClose={() => setCreateOpen(false)} />}
    </ScreenShell>
  );
}

function NeverTrainedExercise({ selected }: { selected: ReturnType<typeof useTrainingAnalytics>["core"]["exerciseMetrics"][number] }) {
  const warnings = [
    !selected.primaryMuscle || selected.primaryMuscle === "Full body" ? "Primary muscle needs review." : "",
    !selected.equipment || selected.equipment === "Unspecified" ? "Equipment is missing." : "",
    !selected.movementPattern || selected.movementPattern === "General strength" ? "Movement pattern is generic." : ""
  ].filter(Boolean);
  return (
    <div className="space-y-5">
      <Card>
        <div className="text-2xl font-semibold">{selected.name}</div>
        <div className="mt-1 text-sm text-white/45">{selected.primaryMuscle} - {selected.equipment} - {selected.movementPattern}</div>
      </Card>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Status" value="Never trained" hint="no sets logged" />
        <MetricCard label="Sessions" value="0" hint="total" />
        <MetricCard label="Volume" value="0" hint="no data" />
        <MetricCard label="PRs" value="0" hint="no records" />
      </div>
      <Card>
        <SectionHeader title="Exercise Quality Warnings" icon={Activity} />
        {warnings.length ? <div className="space-y-2">{warnings.map((warning) => <div key={warning} className="rounded-xl border border-amber-300/20 bg-amber-300/8 p-3 text-sm text-white/60">{warning}</div>)}</div> : <EmptyState icon={Activity} title="Metadata looks usable" body="Log this exercise to unlock trends, PRs, and plateau detection." />}
      </Card>
    </div>
  );
}

function ExerciseDetail({ selected, detail }: { selected: ReturnType<typeof useTrainingAnalytics>["core"]["exerciseMetrics"][number]; detail: ReturnType<typeof useTrainingAnalytics>["desktop"]["exerciseDetails"][number] }) {
  const state = useIronLungStore();
  const exercise = state.exercises.find((item) => item.id === selected.exerciseId);
  const prs = state.personalRecords.filter((record) => record.exerciseId === selected.exerciseId).sort((a, b) => b.achievedAt.localeCompare(a.achievedAt));
  const bestSet = detail.trend.sort((a, b) => b.bestOneRm - a.bestOneRm)[0];
  const contributions = exercise ? resolveMuscleContributions(exercise) : [];
  const contributionWarnings = exercise ? muscleContributionWarnings(exercise) : [];

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold">{selected.name}</div>
            <div className="mt-1 text-sm text-white/45">{selected.primaryMuscle} - {selected.equipment} - {selected.movementPattern}</div>
            <div className="mt-3 text-sm leading-6 text-white/55">{safeSecondaryMuscles(exercise?.secondaryMuscles).slice(0, 12).join(", ") || "No secondary muscles listed."}</div>
          </div>
          <div className="rounded-full border border-line bg-white/[0.04] px-3 py-1 text-sm">{selected.plateau ? "Possible plateau" : selected.strengthTrend > 0 ? "Improving" : "Stable"}</div>
        </div>
      </Card>
      <div className="grid grid-cols-5 gap-4">
        <MetricCard label="Sessions" value={String(selected.sessions)} hint="total" />
        <MetricCard label="Sets" value={String(selected.sets)} hint="total" />
        <MetricCard label="Volume" value={compactNumber(selected.volume)} hint="lifetime" />
        <MetricCard label="Best e1RM" value={compactNumber(selected.estimatedOneRepMax)} hint="estimated" />
        <MetricCard label="Max weight" value={compactNumber(selected.maxWeight)} hint="PR" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <SectionHeader title="Estimated 1RM / Max Weight" icon={TrendingUp} />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={detail.trend}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} minTickGap={18} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey="bestOneRm" stroke="#64d2ff" strokeWidth={2} dot={false} />
              <Line dataKey="maxWeight" stroke="#ffd166" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionHeader title="Volume" icon={BarChart3} />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={detail.trend}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} minTickGap={18} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="volume" fill="#7ee7bf" radius={[7, 7, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div className="grid grid-cols-[.8fr_1fr] gap-5">
        <Card>
          <SectionHeader title="Exercise Intelligence" icon={Activity} />
          <StatRows rows={[
            ["Status", selected.plateau ? "May be plateauing" : selected.strengthTrend > 0 ? "Improving" : "Stable"],
            ["Last trained", selected.lastTrained ? shortDate(selected.lastTrained) : "--"],
            ["Sessions since PR", selected.sessionsSincePr === null ? "--" : String(selected.sessionsSincePr)],
            ["Best set", bestSet ? `${compactNumber(bestSet.maxWeight)} x ${bestSet.reps}` : "--"],
            ["Most useful note", selected.plateau ? "Review load, reps, RPE, and recovery." : "Keep tracking trend quality."]
          ]} />
        </Card>
        <Card>
          <SectionHeader title="Muscle Contribution Model" icon={Activity} />
          <StatRows rows={contributions.slice(0, 8).map((item) => [item.muscle, `${Math.round(item.percent * 100)}% - ${item.role}`])} />
          {!!contributionWarnings.length && <div className="mt-3 space-y-2">{contributionWarnings.map((warning) => <div key={warning} className="rounded-xl border border-amber-300/20 bg-amber-300/8 p-3 text-sm text-white/60">{warning}</div>)}</div>}
        </Card>
      </div>
      <div className="grid grid-cols-[.8fr_1fr] gap-5">
        <Card>
          <SectionHeader title="Recent PRs" icon={Dumbbell} />
          <div className="space-y-2">
            {prs.slice(0, 8).map((record) => <div key={record.id} className="flex justify-between rounded-xl border border-line bg-white/[0.03] p-3"><span>{prLabel(record.type)} - {shortDate(record.achievedAt)}</span><span className="text-mint">{record.value} {record.unit}</span></div>)}
            {!prs.length && <EmptyState icon={Dumbbell} title="No PRs" body="This exercise does not have stored PR events yet." />}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Notes History" icon={Activity} />
          <div className="text-sm leading-6 text-white/52">{exercise?.notes || "No exercise notes yet."}</div>
        </Card>
      </div>
      <Card>
        <SectionHeader title="Last 10 Sessions" icon={BarChart3} />
        <AnalyticsTable headers={["Date", "Workout", "Sets", "Reps", "Volume", "Max", "Best e1RM", "Avg RPE"]} rows={[...detail.trend].reverse().slice(0, 10).map((row) => [row.date, row.workout, row.sets, row.reps, compactNumber(row.volume), compactNumber(row.maxWeight), compactNumber(row.bestOneRm), row.avgRpe ?? "--"])} />
      </Card>
    </div>
  );
}

function safeSecondaryMuscles(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function CreateExerciseDrawer({ onClose }: { onClose: () => void }) {
  const state = useIronLungStore();
  const [name, setName] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [movementPattern, setMovementPattern] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65">
      <div className="h-full w-[460px] border-l border-line bg-ink p-6 shadow-soft">
        <SectionHeader title="Create Exercise" icon={Plus} />
        <div className="grid gap-3">
          <Input placeholder="Name" value={name} onChange={setName} />
          <Input placeholder="Primary muscle" value={primaryMuscle} onChange={setPrimaryMuscle} />
          <Input placeholder="Equipment" value={equipment} onChange={setEquipment} />
          <Input placeholder="Movement pattern" value={movementPattern} onChange={setMovementPattern} />
          <Input placeholder="Notes" value={notes} onChange={setNotes} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => {
              if (!name.trim() || !primaryMuscle.trim()) return;
              state.createExercise({ name, primaryMuscle, equipment: equipment || "Unspecified", movementPattern: movementPattern || "General", secondaryMuscles: [], isUnilateral: false, notes });
              onClose();
            }}>Create</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
