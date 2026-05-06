import {
  Activity,
  BarChart3,
  Camera,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Dumbbell,
  Flame,
  FolderDown,
  FolderUp,
  Gauge,
  Home,
  Layers,
  LineChart,
  ListFilter,
  Moon,
  Plus,
  Settings,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  BoostcampCsvImporter,
  BoostcampJsonImporter,
  buildImportPreview,
  createDefaultExerciseMappings,
  exerciseSessionVolume,
  muscleGroupVolume,
  prLabel,
  setVolume,
  weeklyVolume,
  workoutFrequencyStreaks,
  workoutSessionVolume,
  type Exercise,
  type ExerciseMapping,
  type ImportCommitSummary,
  type ImportPreview,
  type ImportUnitPreference,
  type NormalizedWorkoutImport,
  type PersonalRecord,
  type ProgressPhoto,
  type SetType,
  type WorkoutSession
} from "@ironlung/core";
import { clsx } from "clsx";
import { compactNumber, dateTime, shortDate, todayIso } from "./lib/format";
import { buildAnalyticsSnapshot } from "./lib/analytics";
import { createExport, validateImportPayload } from "./lib/importExport";
import { oneRmForSet, selectOpenSession, useIronLungStore } from "./lib/store";

type Screen =
  | "Overview"
  | "Daily Log"
  | "Strength"
  | "Volume"
  | "Exercises"
  | "Weak Points"
  | "PRs"
  | "Consistency"
  | "Intensity"
  | "Muscles"
  | "Photos"
  | "Data"
  | "Settings";

const nav: Array<{ screen: Screen; icon: typeof Home }> = [
  { screen: "Overview", icon: Home },
  { screen: "Daily Log", icon: CalendarDays },
  { screen: "Strength", icon: TrendingUp },
  { screen: "Volume", icon: BarChart3 },
  { screen: "Exercises", icon: Dumbbell },
  { screen: "Weak Points", icon: Target },
  { screen: "PRs", icon: Trophy },
  { screen: "Consistency", icon: Flame },
  { screen: "Intensity", icon: Gauge },
  { screen: "Muscles", icon: Layers },
  { screen: "Photos", icon: Camera },
  { screen: "Data", icon: Database },
  { screen: "Settings", icon: Settings }
];

const chartColors = ["#64d2ff", "#7ee7bf", "#b9a7ff", "#ffd166", "#ff6b7a", "#8bd3ff"];

export function App() {
  const [screen, setScreen] = useState<Screen>("Overview");
  const theme = useIronLungStore((state) => state.theme);

  return (
    <main className={clsx("min-h-screen text-white", theme === "light" && "light bg-slate-100 text-slate-950")}>
      <div className="grid min-h-screen grid-cols-[260px_1fr]">
        <aside className="border-r border-line bg-ink/80 px-5 py-6 shadow-soft backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-accent/30 bg-accent/15">
              <Dumbbell className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">IronLung Desktop</div>
              <div className="text-xs text-white/45">Analytics command center</div>
            </div>
          </div>
          <nav className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.screen}
                  onClick={() => setScreen(item.screen)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                    screen === item.screen
                      ? "bg-white text-ink shadow-soft"
                      : "text-white/62 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.screen}
                </button>
              );
            })}
          </nav>
          <div className="mt-8 rounded-xl border border-line bg-panel/80 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Moon className="h-4 w-4 text-accent" />
              Analytics-first
            </div>
            <p className="text-xs leading-5 text-white/50">
              Local workout history, PRs, photos, and obscure training stats without cloud tracking.
            </p>
          </div>
        </aside>
        <section className="min-w-0 px-8 py-6">
          {screen === "Overview" && <AnalyticsOverview />}
          {screen === "Daily Log" && <DailyAnalytics />}
          {screen === "Strength" && <StrengthAnalytics />}
          {screen === "Volume" && <VolumeAnalytics />}
          {screen === "Exercises" && <ExerciseAnalytics />}
          {screen === "Weak Points" && <WeakPointAnalytics />}
          {screen === "PRs" && <PRAnalytics />}
          {screen === "Consistency" && <ConsistencyAnalytics />}
          {screen === "Intensity" && <IntensityAnalytics />}
          {screen === "Muscles" && <MuscleAnalytics />}
          {screen === "Photos" && <PhotoAnalytics />}
          {screen === "Data" && <DataAnalytics />}
          {screen === "Settings" && <SettingsScreen />}
        </section>
      </div>
    </main>
  );
}

function AnalyticsOverview() {
  const analytics = useAnalyticsData();

  return (
    <ScreenShell title="Analytics Overview" subtitle="A dense readout of your entire local training history.">
      <div className="grid grid-cols-5 gap-4">
        <MetricCard label="Total volume" value={compactNumber(analytics.totals.volume)} hint="lifetime" />
        <MetricCard label="Workouts" value={String(analytics.totals.workouts)} hint={`${analytics.totals.activeDays} active days`} />
        <MetricCard label="Sets logged" value={compactNumber(analytics.totals.sets)} hint={`${compactNumber(analytics.totals.reps)} reps`} />
        <MetricCard label="PRs" value={String(analytics.totals.prs)} hint="all types" />
        <MetricCard label="Density" value={`${analytics.totals.trainingDensity}%`} hint="days trained" />
      </div>
      <div className="grid grid-cols-[1.35fr_.85fr] gap-5">
        <ChartCard title="Every day trained">
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={analytics.daily}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sessions" fill="#64d2ff" radius={[6, 6, 0, 0]} />
              <Bar dataKey="prs" fill="#ffd166" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card>
          <SectionHeader title="Current readout" icon={Gauge} />
          <StatRows rows={[
            ["Average session volume", compactNumber(analytics.totals.avgSessionVolume)],
            ["Average sets per workout", String(analytics.totals.avgSetsPerWorkout)],
            ["Average active-day volume", compactNumber(analytics.totals.avgVolumePerActiveDay)],
            ["Average RPE", analytics.totals.avgRpe === null ? "--" : String(analytics.totals.avgRpe)],
            ["Longest streak", `${analytics.streaks.longestStreakDays} days`],
            ["Longest gap", `${analytics.streaks.longestGapDays} days`]
          ]} />
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <ChartCard title="Weekly volume and workouts">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.weekly}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="period" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="volume" fill="#7ee7bf" radius={[7, 7, 2, 2]} />
              <Bar dataKey="workouts" fill="#b9a7ff" radius={[7, 7, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card>
          <SectionHeader title="Recent sessions" icon={Clock} />
          <div className="space-y-2">
            {[...analytics.sessionSummaries].reverse().slice(0, 8).map((session) => (
              <StatRow key={session.id} label={`${shortDate(session.startedAt)} · ${session.name}`} value={`${compactNumber(session.volume)} vol · ${session.sets} sets`} />
            ))}
            {!analytics.sessionSummaries.length && <EmptyState icon={Dumbbell} title="No sessions yet" body="Import or log workouts to populate analytics." />}
          </div>
        </Card>
      </div>
    </ScreenShell>
  );
}

function DailyAnalytics() {
  const analytics = useAnalyticsData();
  const maxVolume = Math.max(1, ...analytics.daily.map((day) => day.volume));

  return (
    <ScreenShell title="Every-Day Training Log" subtitle="Every calendar day in your history, including rest days, sessions, volume, sets, reps, and PRs.">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Calendar span" value={String(analytics.totals.calendarDays)} hint="days shown" />
        <MetricCard label="Active days" value={String(analytics.totals.activeDays)} hint="trained" />
        <MetricCard label="Rest days" value={String(Math.max(0, analytics.totals.calendarDays - analytics.totals.activeDays))} hint="no session" />
        <MetricCard label="Training density" value={`${analytics.totals.trainingDensity}%`} hint="active / span" />
      </div>
      <ChartCard title="Daily volume, sets, and PRs">
        <ResponsiveContainer width="100%" height={330}>
          <BarChart data={analytics.daily}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="label" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} minTickGap={18} />
            <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="volume" fill="#64d2ff" radius={[5, 5, 0, 0]} />
            <Bar dataKey="sets" fill="#7ee7bf" radius={[5, 5, 0, 0]} />
            <Bar dataKey="prs" fill="#ffd166" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <Card>
        <SectionHeader title="Calendar heatmap" icon={CalendarDays} />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(28px,1fr))] gap-1">
          {analytics.daily.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.sessions} workouts, ${day.sets} sets, ${compactNumber(day.volume)} volume`}
              className="h-7 rounded-md border border-white/8"
              style={{
                backgroundColor: day.active ? `rgba(100,210,255,${0.18 + 0.72 * (day.volume / maxVolume)})` : "rgba(255,255,255,0.025)"
              }}
            />
          ))}
        </div>
      </Card>
      <Card>
        <SectionHeader title="All days" icon={ListFilter} />
        <div className="max-h-[520px] overflow-auto rounded-xl border border-line">
          <AnalyticsTable
            headers={["Date", "Workouts", "Exercises", "Sets", "Reps", "Volume", "PRs", "Best e1RM", "Avg RPE"]}
            rows={[...analytics.daily].reverse().map((day) => [
              day.date,
              String(day.sessions),
              String(day.exercises),
              String(day.sets),
              compactNumber(day.reps),
              compactNumber(day.volume),
              String(day.prs),
              compactNumber(day.bestOneRm),
              day.avgRpe === null ? "--" : String(day.avgRpe)
            ])}
          />
        </div>
      </Card>
    </ScreenShell>
  );
}

function StrengthAnalytics() {
  const analytics = useAnalyticsData();
  const state = useIronLungStore();
  const sessionExerciseById = new Map(state.sessionExercises.map((row) => [row.id, row]));
  const exerciseById = new Map(state.exercises.map((exercise) => [exercise.id, exercise]));
  const topSets = [...state.setLogs]
    .filter((set) => set.isCompleted)
    .map((set) => {
      const row = sessionExerciseById.get(set.workoutSessionExerciseId);
      const exercise = row ? exerciseById.get(row.exerciseId) : undefined;
      return { ...set, exerciseName: exercise?.name ?? "Exercise", e1rm: oneRmForSet(set) };
    })
    .sort((a, b) => b.e1rm - a.e1rm)
    .slice(0, 30);

  return (
    <ScreenShell title="Strength Analytics" subtitle="Estimated 1RM, max weight, top sets, and strength leaderboards.">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Best e1RM" value={compactNumber(Math.max(0, ...analytics.topExercises.map((exercise) => exercise.bestOneRm)))} hint={state.unitPreference} />
        <MetricCard label="Heaviest load" value={compactNumber(Math.max(0, ...analytics.topExercises.map((exercise) => exercise.maxWeight)))} hint={state.unitPreference} />
        <MetricCard label="Tracked lifts" value={String(analytics.totals.trainedExercises)} hint="with sets" />
        <MetricCard label="Strength PRs" value={String(analytics.prByType.filter((row) => row.name === "estimated_1rm" || row.name === "max_weight").reduce((total, row) => total + row.count, 0))} hint="e1RM + load" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <ChartCard title="Top exercises by estimated 1RM">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={analytics.topExercises.slice(0, 12)} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
              <XAxis type="number" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={120} stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="bestOneRm" fill="#64d2ff" radius={[0, 7, 7, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Daily best estimated 1RM">
          <ResponsiveContainer width="100%" height={320}>
            <ReLineChart data={analytics.daily}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} minTickGap={22} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey="bestOneRm" stroke="#64d2ff" strokeWidth={2} dot={false} />
              <Line dataKey="maxWeight" stroke="#ffd166" strokeWidth={2} dot={false} />
            </ReLineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <Card>
        <SectionHeader title="Top set leaderboard" icon={Target} />
        <AnalyticsTable
          headers={["Exercise", "Weight", "Reps", "Estimated 1RM", "RPE", "Date"]}
          rows={topSets.map((set) => [set.exerciseName, String(set.weight), String(set.reps), String(set.e1rm), set.rpe === null || set.rpe === undefined ? "--" : String(set.rpe), shortDate(set.createdAt)])}
        />
      </Card>
    </ScreenShell>
  );
}

function VolumeAnalytics() {
  const analytics = useAnalyticsData();

  return (
    <ScreenShell title="Volume Analytics" subtitle="Daily, weekly, monthly, session, exercise, and rep-volume breakdowns.">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Lifetime volume" value={compactNumber(analytics.totals.volume)} hint="all sessions" />
        <MetricCard label="Avg workout volume" value={compactNumber(analytics.totals.avgSessionVolume)} hint="per session" />
        <MetricCard label="Avg active day" value={compactNumber(analytics.totals.avgVolumePerActiveDay)} hint="per trained day" />
        <MetricCard label="Total reps" value={compactNumber(analytics.totals.reps)} hint="all sets" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <ChartCard title="Monthly volume">
          <ResponsiveContainer width="100%" height={310}>
            <AreaChart data={analytics.monthly}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="period" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area dataKey="volume" stroke="#7ee7bf" fill="#7ee7bf33" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Top exercise volume">
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={analytics.exerciseVolumeSeries} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={120} stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="volume" fill="#b9a7ff" radius={[0, 7, 7, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <Card>
        <SectionHeader title="Highest volume sessions" icon={BarChart3} />
        <AnalyticsTable
          headers={["Date", "Workout", "Volume", "Exercises", "Sets", "Reps", "Avg RPE", "PRs"]}
          rows={[...analytics.sessionSummaries].sort((a, b) => b.volume - a.volume).slice(0, 40).map((session) => [
            shortDate(session.startedAt),
            session.name,
            compactNumber(session.volume),
            String(session.exercises),
            String(session.sets),
            compactNumber(session.reps),
            session.avgRpe === null ? "--" : String(session.avgRpe),
            String(session.prs)
          ])}
        />
      </Card>
    </ScreenShell>
  );
}

function ExerciseAnalytics() {
  const analytics = useAnalyticsData();
  const [selectedExerciseId, setSelectedExerciseId] = useState(analytics.exerciseDetails[0]?.exerciseId ?? "");
  const selectedExercise = analytics.exerciseDetails.find((exercise) => exercise.exerciseId === selectedExerciseId) ?? analytics.exerciseDetails[0];

  return (
    <ScreenShell title="Exercise Analytics" subtitle="Exercise frequency, volume, PRs, load, estimated strength, and recency.">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Exercises created" value={String(analytics.totals.exercises)} hint="library" />
        <MetricCard label="Exercises trained" value={String(analytics.totals.trainedExercises)} hint="with sets" />
        <MetricCard label="Most frequent" value={analytics.topExercises[0]?.name ?? "--"} hint={`${analytics.topExercises[0]?.sessions ?? 0} sessions`} />
        <MetricCard label="Most volume" value={analytics.topExercises[0]?.name ?? "--"} hint={compactNumber(analytics.topExercises[0]?.volume ?? 0)} />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <ChartCard title="Exercise sessions">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={[...analytics.topExercises].sort((a, b) => b.sessions - a.sessions).slice(0, 12)} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={120} stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sessions" fill="#64d2ff" radius={[0, 7, 7, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Exercise PR count">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={[...analytics.topExercises].sort((a, b) => b.prs - a.prs).slice(0, 12)} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={120} stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="prs" fill="#ffd166" radius={[0, 7, 7, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <Card>
        <SectionHeader title="Exercise stat table" icon={Dumbbell} />
        <AnalyticsTable
          headers={["Exercise", "Primary", "Secondary targets", "Sessions", "Sets", "Reps", "Volume", "Max", "Best e1RM", "Avg RPE", "PRs", "Last trained"]}
          rows={analytics.topExercises.map((exercise) => [
            exercise.name,
            exercise.primaryMuscle,
            exercise.secondaryMuscles.map((muscle) => muscle.split(" - ")[0]).slice(0, 8).join(", "),
            String(exercise.sessions),
            String(exercise.sets),
            compactNumber(exercise.reps),
            compactNumber(exercise.volume),
            String(exercise.maxWeight),
            String(exercise.bestOneRm),
            exercise.avgRpe === null ? "--" : String(exercise.avgRpe),
            String(exercise.prs),
            exercise.lastTrained ? shortDate(exercise.lastTrained) : "--"
          ])}
        />
      </Card>
      <div className="rounded-2xl border border-line bg-panel/60 p-5">
        <SectionHeader title="Exercise detail page" icon={LineChart} />
        <div className="mb-4 grid grid-cols-[360px_1fr] gap-4">
          <Select value={selectedExercise?.exerciseId ?? ""} onChange={setSelectedExerciseId}>
            {analytics.exerciseDetails.map((exercise) => (
              <option key={exercise.exerciseId} value={exercise.exerciseId}>{exercise.name}</option>
            ))}
          </Select>
          {selectedExercise && (
            <div className="rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-white/55">
              {selectedExercise.primaryMuscle} primary · {selectedExercise.secondaryMuscles.map((muscle) => muscle.split(" - ")[0]).slice(0, 10).join(", ")}
            </div>
          )}
        </div>
        {selectedExercise ? <ExerciseDetailAnalytics exercise={selectedExercise} /> : <EmptyState icon={Dumbbell} title="No exercise data" body="Import or log workouts to drill into an exercise." />}
      </div>
    </ScreenShell>
  );
}

function ExerciseDetailAnalytics({ exercise }: { exercise: ReturnType<typeof useAnalyticsData>["exerciseDetails"][number] }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-6 gap-3">
        <MetricCard label="Sessions" value={String(exercise.sessions)} hint="trained" />
        <MetricCard label="Volume" value={compactNumber(exercise.volume)} hint="lifetime" />
        <MetricCard label="Best e1RM" value={compactNumber(exercise.bestOneRm)} hint="estimated" />
        <MetricCard label="Max load" value={compactNumber(exercise.maxWeight)} hint="heaviest" />
        <MetricCard label="PR rate" value={String(exercise.prRate)} hint="PRs/session" />
        <MetricCard label="Since PR" value={exercise.sessionsSincePr === null ? "--" : String(exercise.sessionsSincePr)} hint="sessions" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <ChartCard title="Strength trend">
          <ResponsiveContainer width="100%" height={280}>
            <ReLineChart data={exercise.trend}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey="bestOneRm" stroke="#64d2ff" strokeWidth={2} dot={false} />
              <Line dataKey="maxWeight" stroke="#ffd166" strokeWidth={2} dot={false} />
            </ReLineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Volume and sets trend">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={exercise.trend}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="volume" fill="#7ee7bf" radius={[6, 6, 0, 0]} />
              <Bar dataKey="sets" fill="#b9a7ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid grid-cols-[1fr_.8fr] gap-5">
        <Card>
          <SectionHeader title="Session history" icon={CalendarDays} />
          <AnalyticsTable
            headers={["Date", "Workout", "Sets", "Reps", "Volume", "Max", "Best e1RM", "Avg RPE"]}
            rows={[...exercise.trend].reverse().map((row) => [
              row.date,
              row.workout,
              String(row.sets),
              compactNumber(row.reps),
              compactNumber(row.volume),
              compactNumber(row.maxWeight),
              compactNumber(row.bestOneRm),
              row.avgRpe === null ? "--" : String(row.avgRpe)
            ])}
          />
        </Card>
        <Card>
          <SectionHeader title="PR timeline" icon={Trophy} />
          <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
            {exercise.records.slice(0, 16).map((record) => (
              <div key={record.id} className="flex items-center justify-between rounded-xl border border-line bg-white/[0.03] p-3">
                <div>
                  <div className="font-medium">{prLabel(record.type)}</div>
                  <div className="text-sm text-white/42">{shortDate(record.achievedAt)}</div>
                </div>
                <div className="rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-sm text-mint">{record.value} {record.unit}</div>
              </div>
            ))}
            {!exercise.records.length && <EmptyState icon={Trophy} title="No PRs" body="This exercise has no stored PR events." />}
          </div>
        </Card>
      </div>
    </div>
  );
}

function WeakPointAnalytics() {
  const analytics = useAnalyticsData();

  return (
    <ScreenShell title="Weak Point Detection" subtitle="Heuristic flags for undertrained muscles, stale exercises, movement imbalance, and possible plateaus.">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="High priority" value={String(analytics.weakPointFindings.filter((item) => item.severity === "high").length)} hint="flags" />
        <MetricCard label="Medium" value={String(analytics.weakPointFindings.filter((item) => item.severity === "medium").length)} hint="flags" />
        <MetricCard label="Low" value={String(analytics.weakPointFindings.filter((item) => item.severity === "low").length)} hint="flags" />
        <MetricCard label="Exercises checked" value={String(analytics.exerciseDetails.length)} hint="trained" />
      </div>
      <div className="grid grid-cols-[1fr_.9fr] gap-5">
        <Card>
          <SectionHeader title="Detected issues" icon={Target} />
          <div className="space-y-3">
            {analytics.weakPointFindings.map((finding) => (
              <div key={`${finding.title}-${finding.metric}`} className="rounded-xl border border-line bg-white/[0.035] p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="font-semibold">{finding.title}</div>
                  <span className={clsx("rounded-full px-3 py-1 text-xs font-medium uppercase", finding.severity === "high" ? "bg-red-400/15 text-red-200" : finding.severity === "medium" ? "bg-amber-300/15 text-amber-100" : "bg-white/10 text-white/60")}>{finding.severity}</span>
                </div>
                <div className="text-sm leading-6 text-white/55">{finding.detail}</div>
                <div className="mt-2 text-xs uppercase tracking-wide text-white/35">{finding.metric}</div>
              </div>
            ))}
            {!analytics.weakPointFindings.length && <EmptyState icon={CheckCircle2} title="No obvious weak points" body="The current imported data does not trigger any imbalance or plateau flags." />}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Most stale or stalled exercises" icon={Clock} />
          <AnalyticsTable
            headers={["Exercise", "Sessions", "Since PR", "Strength trend", "Volume trend", "Last trained"]}
            rows={[...analytics.exerciseDetails]
              .sort((a, b) => (b.sessionsSincePr ?? -1) - (a.sessionsSincePr ?? -1))
              .slice(0, 18)
              .map((exercise) => [
                exercise.name,
                String(exercise.sessions),
                exercise.sessionsSincePr === null ? "--" : String(exercise.sessionsSincePr),
                String(exercise.strengthTrend),
                String(exercise.volumeTrend),
                exercise.lastTrained ? shortDate(exercise.lastTrained) : "--"
              ])}
          />
        </Card>
      </div>
    </ScreenShell>
  );
}

function PRAnalytics() {
  const analytics = useAnalyticsData();
  const state = useIronLungStore();

  return (
    <ScreenShell title="PR Analytics" subtitle="PR types, rate over time, recent records, and exercise-level PR density.">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total PRs" value={String(analytics.totals.prs)} hint="stored" />
        <MetricCard label="PR days" value={String(analytics.daily.filter((day) => day.prs > 0).length)} hint="calendar days" />
        <MetricCard label="Best PR day" value={analytics.daily.reduce((best, day) => day.prs > best.prs ? day : best, analytics.daily[0] ?? { label: "--", prs: 0 }).label} hint={`${Math.max(0, ...analytics.daily.map((day) => day.prs))} PRs`} />
        <MetricCard label="PR exercises" value={String(new Set(state.personalRecords.map((record) => record.exerciseId)).size)} hint="unique" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <ChartCard title="PRs by month">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.prByMonth}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="period" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#ffd166" radius={[7, 7, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="PRs by type">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={analytics.prByType} dataKey="count" nameKey="name" innerRadius={62} outerRadius={105}>
                {analytics.prByType.map((_entry, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <Card>
        <SectionHeader title="Recent PR stream" icon={Trophy} />
        <div className="grid grid-cols-2 gap-3">
          {analytics.recentPrs.slice(0, 20).map((record) => <PRRow key={record.id} record={record} exercises={state.exercises} />)}
          {!analytics.recentPrs.length && <EmptyState icon={Trophy} title="No PR history" body="Import or log sets to populate PR analytics." />}
        </div>
      </Card>
    </ScreenShell>
  );
}

function ConsistencyAnalytics() {
  const analytics = useAnalyticsData();

  return (
    <ScreenShell title="Consistency Analytics" subtitle="Streaks, gaps, day-of-week patterns, training time, and workout cadence.">
      <div className="grid grid-cols-5 gap-4">
        <MetricCard label="Current streak" value={String(analytics.streaks.currentStreakDays)} hint="days" />
        <MetricCard label="Longest streak" value={String(analytics.streaks.longestStreakDays)} hint="days" />
        <MetricCard label="Longest gap" value={String(analytics.streaks.longestGapDays)} hint="rest days" />
        <MetricCard label="Avg gap" value={String(analytics.streaks.avgGapDays)} hint="rest days" />
        <MetricCard label="Days since last" value={analytics.streaks.daysSinceLastWorkout === null ? "--" : String(analytics.streaks.daysSinceLastWorkout)} hint="calendar" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <ChartCard title="Workout day-of-week bias">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.dayOfWeek}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="workouts" fill="#64d2ff" radius={[7, 7, 2, 2]} />
              <Bar dataKey="avgVolume" fill="#7ee7bf" radius={[7, 7, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Workout start hour">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.hourOfDay}>
              <XAxis dataKey="hour" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="workouts" fill="#b9a7ff" radius={[7, 7, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <Card>
        <SectionHeader title="Weekly cadence table" icon={CalendarDays} />
        <AnalyticsTable
          headers={["Week", "Active days", "Workouts", "Sets", "Reps", "Volume", "PRs"]}
          rows={[...analytics.weekly].reverse().map((week) => [
            week.period,
            String(week.activeDays),
            String(week.workouts),
            String(week.sets),
            compactNumber(week.reps),
            compactNumber(week.volume),
            String(week.prs)
          ])}
        />
      </Card>
    </ScreenShell>
  );
}

function IntensityAnalytics() {
  const analytics = useAnalyticsData();

  return (
    <ScreenShell title="Intensity Analytics" subtitle="RPE coverage, set type distribution, rep ranges, weight buckets, and hard-set proxies.">
      <div className="grid grid-cols-5 gap-4">
        <MetricCard label="Avg RPE" value={analytics.totals.avgRpe === null ? "--" : String(analytics.totals.avgRpe)} hint="logged sets" />
        <MetricCard label="RPE coverage" value={`${analytics.intensity.rpeCoverage}%`} hint="sets with RPE" />
        <MetricCard label="Failure-like" value={String(analytics.intensity.failureLikeSets)} hint="AMRAP/failure/RPE 9.5+" />
        <MetricCard label="Missing RPE" value={String(analytics.intensity.missingRpeSets)} hint="sets" />
        <MetricCard label="Zero-load sets" value={String(analytics.intensity.zeroWeightSets)} hint="bodyweight/unknown" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <ChartCard title="RPE distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.intensity.rpeDistribution}>
              <XAxis dataKey="rpe" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sets" fill="#ff6b7a" radius={[7, 7, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Set types">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={analytics.intensity.setTypeDistribution} dataKey="count" nameKey="name" innerRadius={62} outerRadius={105}>
                {analytics.intensity.setTypeDistribution.map((_entry, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Rep buckets">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.intensity.repBuckets}>
              <XAxis dataKey="bucket" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sets" fill="#7ee7bf" radius={[7, 7, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Weight buckets">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.intensity.weightBuckets}>
              <XAxis dataKey="bucket" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sets" fill="#64d2ff" radius={[7, 7, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </ScreenShell>
  );
}

function MuscleAnalytics() {
  const analytics = useAnalyticsData();

  return (
    <ScreenShell title="Muscle & Movement Analytics" subtitle="Muscle group, equipment, and movement-pattern balance from your exercise library.">
      <div className="grid grid-cols-[.95fr_1fr] gap-5">
        <BodyHeatMap muscles={analytics.muscleHeatStats} />
        <Card>
          <SectionHeader title="Hottest muscles" icon={Flame} />
          <AnalyticsTable
            headers={["Muscle", "Heat", "Total exposure", "Primary", "Secondary", "Sets", "Last trained"]}
            rows={analytics.muscleHeatStats.slice(0, 14).map((row) => [
              row.muscle,
              `${Math.round(row.heat * 100)}%`,
              compactNumber(row.totalExposure),
              compactNumber(row.primaryVolume),
              compactNumber(row.secondaryVolume),
              String(row.sets),
              row.lastTrained ? shortDate(row.lastTrained) : "--"
            ])}
          />
        </Card>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <ChartCard title="Muscle volume">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={analytics.muscleStats} dataKey="volume" nameKey="muscle" innerRadius={62} outerRadius={105}>
                {analytics.muscleStats.map((_entry, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Equipment volume">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.equipmentStats.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="equipment" width={120} stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="volume" fill="#b9a7ff" radius={[0, 7, 7, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Movement volume">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.movementStats.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="movement" width={120} stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="volume" fill="#7ee7bf" radius={[0, 7, 7, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <Card>
        <SectionHeader title="Muscle detail table" icon={Layers} />
        <AnalyticsTable
          headers={["Muscle", "Volume", "Sets", "Exercises", "PRs"]}
          rows={analytics.muscleStats.map((row) => [row.muscle, compactNumber(row.volume), String(row.sets), String(row.exercises), String(row.prs)])}
        />
      </Card>
      <Card>
        <SectionHeader title="Secondary/stabilizer exposure" icon={Target} />
        <AnalyticsTable
          headers={["Muscle", "Exposure volume", "Related sets", "Exercises", "Related PRs"]}
          rows={analytics.secondaryMuscleStats.map((row) => [
            row.muscle,
            compactNumber(row.exposureVolume),
            String(row.sets),
            String(row.exercises),
            String(row.prs)
          ])}
        />
      </Card>
    </ScreenShell>
  );
}

function BodyHeatMap({ muscles }: { muscles: ReturnType<typeof useAnalyticsData>["muscleHeatStats"] }) {
  const [hovered, setHovered] = useState("Pectoralis major");
  const muscleByName = new Map(muscles.map((row) => [row.muscle, row]));
  const selected = aggregateMuscleStats(muscles, heatAliases[hovered] ?? [hovered]) ?? muscles[0];

  function heatColor(muscle: string) {
    const stats = aggregateMuscleStats(muscles, heatAliases[muscle] ?? [muscle]);
    const heat = stats?.heat ?? 0;
    if (heat <= 0) return "rgba(255,255,255,0.06)";
    return `rgba(255, ${Math.round(96 - heat * 70)}, ${Math.round(76 - heat * 55)}, ${0.24 + heat * 0.74})`;
  }

  function region(muscle: string, d: string, title?: string) {
    return (
      <path
        key={`${muscle}-${d.slice(0, 12)}`}
        d={d}
        fill={heatColor(muscle)}
        stroke={hovered === muscle ? "#ffffff" : "rgba(255,255,255,0.22)"}
        strokeWidth={hovered === muscle ? 2 : 1}
        className="cursor-pointer transition duration-150 hover:brightness-125"
        onMouseEnter={() => setHovered(muscle)}
      >
        <title>{title ?? muscle}</title>
      </path>
    );
  }

  return (
    <Card>
      <SectionHeader title="Body heat map" icon={Flame} />
      <div className="grid grid-cols-[1fr_220px] gap-4">
        <div className="rounded-xl border border-line bg-black/18 p-3">
          <svg viewBox="0 0 760 560" className="h-[560px] w-full" role="img" aria-label="Interactive front and back muscle heat map">
            <rect x="0" y="0" width="760" height="560" rx="22" fill="rgba(255,255,255,0.018)" />
            <text x="172" y="26" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="13" fontWeight="600">Front</text>
            <text x="588" y="26" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="13" fontWeight="600">Back</text>
            <text x="18" y="28" fill="rgba(255,255,255,0.38)" fontSize="12">Hover a muscle</text>

            <g opacity="0.88" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="172" cy="58" r="25" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.22)" />
              <path d="M150 88 C160 98 184 98 194 88" fill="none" stroke="rgba(255,255,255,0.22)" />
              {region("Traps", "M139 94 C151 78 193 78 205 94 L224 122 L205 134 C195 119 149 119 139 134 L120 122 Z", "Upper traps")}
              {region("Pectoralis major", "M109 128 C130 103 166 113 168 151 L168 198 C136 194 112 175 99 145 Z", "Left pectoralis major")}
              {region("Pectoralis major", "M176 151 C178 113 214 103 235 128 L245 145 C232 175 208 194 176 198 Z", "Right pectoralis major")}
              {region("Anterior deltoids", "M78 135 C90 105 114 103 132 122 L100 174 C82 170 70 156 78 135 Z")}
              {region("Anterior deltoids", "M212 122 C230 103 254 105 266 135 C274 156 262 170 244 174 Z")}
              {region("Biceps brachii", "M72 174 C90 166 106 176 110 207 L95 285 C78 274 68 249 70 214 Z")}
              {region("Biceps brachii", "M272 174 C254 166 238 176 234 207 L249 285 C266 274 276 249 274 214 Z")}
              {region("Triceps brachii", "M107 178 C119 191 121 219 112 253 L98 283 C101 241 101 205 107 178 Z")}
              {region("Triceps brachii", "M237 178 C225 191 223 219 232 253 L246 283 C243 241 243 205 237 178 Z")}
              {region("Forearms", "M93 285 L76 371 C72 397 92 410 107 381 L123 305 Z")}
              {region("Forearms", "M251 285 L268 371 C272 397 252 410 237 381 L221 305 Z")}
              {region("Serratus anterior", "M97 162 L128 202 L124 286 C105 258 91 213 97 162 Z")}
              {region("Serratus anterior", "M247 162 L216 202 L220 286 C239 258 253 213 247 162 Z")}
              {region("Core/abs", "M128 199 C152 210 192 210 216 199 L222 306 C196 324 148 324 122 306 Z")}
              {region("Core/abs", "M143 214 L166 214 L164 247 L138 247 Z", "Upper abs")}
              {region("Core/abs", "M178 214 L201 214 L206 247 L180 247 Z", "Upper abs")}
              {region("Core/abs", "M139 255 L164 255 L160 293 L132 293 Z", "Lower abs")}
              {region("Core/abs", "M180 255 L205 255 L212 293 L184 293 Z", "Lower abs")}
              {region("Lats", "M89 165 C111 194 120 237 118 304 C94 282 76 223 80 174 Z")}
              {region("Lats", "M255 165 C233 194 224 237 226 304 C250 282 268 223 264 174 Z")}
              {region("Glutes", "M122 308 C146 295 168 307 169 343 L164 380 C134 374 114 350 122 308 Z")}
              {region("Glutes", "M176 343 C176 307 198 295 222 308 C230 350 210 374 180 380 Z")}
              {region("Quads", "M111 384 C135 372 165 384 166 424 L157 514 C126 507 106 467 106 424 Z", "Left quadriceps")}
              {region("Quads", "M178 424 C179 384 209 372 233 384 C238 424 218 507 187 514 Z", "Right quadriceps")}
              {region("Adductors", "M160 383 C171 400 174 438 169 492 C153 462 142 420 148 392 Z")}
              {region("Adductors", "M184 383 C173 400 170 438 175 492 C191 462 202 420 196 392 Z")}
              {region("Hamstrings", "M92 385 C108 377 122 386 116 426 L104 505 C80 487 75 430 92 385 Z")}
              {region("Hamstrings", "M252 385 C236 377 222 386 228 426 L240 505 C264 487 269 430 252 385 Z")}
              {region("Gastrocnemius", "M107 506 C122 492 150 502 150 536 L99 536 Z")}
              {region("Gastrocnemius", "M194 506 C194 502 222 492 237 506 L245 536 L194 536 Z")}
              {region("Soleus", "M151 489 C162 506 163 524 158 539 L140 539 C144 520 144 505 151 489 Z")}
              {region("Soleus", "M193 489 C182 506 181 524 186 539 L204 539 C200 520 200 505 193 489 Z")}

              <circle cx="588" cy="58" r="25" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.22)" />
              <path d="M563 88 C574 100 602 100 613 88" fill="none" stroke="rgba(255,255,255,0.22)" />
              {region("Traps", "M542 93 C558 78 618 78 634 93 L657 126 L632 140 C617 120 563 120 548 140 L519 126 Z", "Traps posterior")}
              {region("Rear delts", "M494 132 C509 106 536 106 551 128 L518 177 C499 172 486 154 494 132 Z")}
              {region("Rear delts", "M625 128 C640 106 667 106 682 132 C690 154 677 172 658 177 Z")}
              {region("Rhomboids", "M548 132 C570 121 606 121 628 132 L614 188 C593 178 583 178 562 188 Z")}
              {region("Traps", "M556 134 L620 134 L603 246 L573 246 Z", "Middle/lower traps")}
              {region("Lats", "M520 153 C553 189 562 236 556 309 C526 282 501 224 507 170 Z")}
              {region("Lats", "M656 153 C623 189 614 236 620 309 C650 282 675 224 669 170 Z")}
              {region("Rotator cuff", "M523 143 C540 132 556 139 561 159 C546 171 531 172 518 160 Z")}
              {region("Rotator cuff", "M615 159 C620 139 636 132 653 143 L658 160 C645 172 630 171 615 159 Z")}
              {region("Triceps brachii", "M489 174 C508 164 525 176 529 208 L514 286 C496 274 486 249 488 214 Z")}
              {region("Triceps brachii", "M687 174 C668 164 651 176 647 208 L662 286 C680 274 690 249 688 214 Z")}
              {region("Biceps brachii", "M525 176 C537 190 539 222 530 257 L516 284 C519 242 519 205 525 176 Z")}
              {region("Biceps brachii", "M651 176 C639 190 637 222 646 257 L660 284 C657 242 657 205 651 176 Z")}
              {region("Forearms", "M512 286 L494 374 C490 400 510 412 526 383 L541 306 Z")}
              {region("Forearms", "M664 286 L682 374 C686 400 666 412 650 383 L635 306 Z")}
              {region("Erector spinae", "M571 196 C581 216 583 282 576 337 L556 314 C562 269 562 224 571 196 Z")}
              {region("Erector spinae", "M605 196 C595 216 593 282 600 337 L620 314 C614 269 614 224 605 196 Z")}
              {region("Glutes", "M536 311 C561 294 584 307 585 343 L580 383 C548 378 526 352 536 311 Z")}
              {region("Glutes", "M591 343 C592 307 615 294 640 311 C650 352 628 378 596 383 Z")}
              {region("Hamstrings", "M517 386 C540 374 568 384 565 424 L553 512 C523 500 505 454 508 421 Z")}
              {region("Hamstrings", "M611 424 C608 384 636 374 659 386 C668 421 653 500 623 512 Z")}
              {region("Adductors", "M566 386 C581 411 584 447 578 501 C559 464 548 421 554 392 Z")}
              {region("Adductors", "M610 386 C595 411 592 447 598 501 C617 464 628 421 622 392 Z")}
              {region("Gastrocnemius", "M523 506 C540 489 566 499 568 537 L513 537 Z")}
              {region("Gastrocnemius", "M608 537 C610 499 636 489 653 506 L663 537 Z")}
              {region("Soleus", "M570 490 C581 508 582 526 576 540 L558 540 C562 520 563 505 570 490 Z")}
              {region("Soleus", "M606 490 C595 508 594 526 600 540 L618 540 C614 520 613 505 606 490 Z")}
            </g>
          </svg>
        </div>
        <div className="rounded-xl border border-line bg-black/18 p-4">
          <div className="text-xs uppercase tracking-wide text-white/35">Selected muscle</div>
          <div className="mt-1 text-xl font-semibold">{selected?.muscle ?? hovered}</div>
          <div className="mt-4 space-y-3">
            <StatRow label="Heat" value={selected ? `${Math.round(selected.heat * 100)}%` : "0%"} />
            <StatRow label="Total exposure" value={selected ? compactNumber(selected.totalExposure) : "0"} />
            <StatRow label="Primary volume" value={selected ? compactNumber(selected.primaryVolume) : "0"} />
            <StatRow label="Secondary exposure" value={selected ? compactNumber(selected.secondaryVolume) : "0"} />
            <StatRow label="Related sets" value={selected ? String(selected.sets) : "0"} />
            <StatRow label="Related PRs" value={selected ? String(selected.prs) : "0"} />
            <StatRow label="Last trained" value={selected?.lastTrained ? shortDate(selected.lastTrained) : "--"} />
          </div>
          <div className="mt-5 h-3 rounded-full bg-gradient-to-r from-white/10 via-orange-300/60 to-red-500" />
          <div className="mt-2 flex justify-between text-xs text-white/35"><span>less</span><span>more</span></div>
        </div>
      </div>
    </Card>
  );
}

function aggregateMuscleStats(muscles: ReturnType<typeof useAnalyticsData>["muscleHeatStats"], aliases: string[]) {
  const rows = aliases
    .map((alias) => muscles.find((row) => row.muscle === alias))
    .filter((row): row is ReturnType<typeof useAnalyticsData>["muscleHeatStats"][number] => Boolean(row));
  if (!rows.length) return null;
  return {
    muscle: aliases[0],
    primaryVolume: rows.reduce((total, row) => total + row.primaryVolume, 0),
    secondaryVolume: rows.reduce((total, row) => total + row.secondaryVolume, 0),
    totalExposure: rows.reduce((total, row) => total + row.totalExposure, 0),
    sets: rows.reduce((total, row) => total + row.sets, 0),
    exercises: rows.reduce((total, row) => total + row.exercises, 0),
    prs: rows.reduce((total, row) => total + row.prs, 0),
    lastTrained: rows.map((row) => row.lastTrained).filter(Boolean).sort().at(-1) ?? null,
    heat: Math.max(...rows.map((row) => row.heat))
  };
}

const heatAliases: Record<string, string[]> = {
  "Pectoralis major": ["Pectoralis major", "Upper pectoralis major"],
  "Anterior deltoids": ["Anterior deltoids", "Deltoids"],
  "Rear delts": ["Rear delts", "Deltoids"],
  "Traps": ["Traps", "Upper traps"],
  "Lats": ["Lats", "Latissimus dorsi"],
  "Core/abs": ["Core/abs"],
  "Glutes": ["Glutes"],
  "Quads": ["Quads"],
  "Hamstrings": ["Hamstrings"],
  "Gastrocnemius": ["Gastrocnemius"],
  "Soleus": ["Soleus"],
  "Biceps brachii": ["Biceps brachii", "Brachialis", "Brachioradialis"],
  "Triceps brachii": ["Triceps brachii"],
  "Forearms": ["Forearms"],
  "Serratus anterior": ["Serratus anterior"],
  "Rotator cuff": ["Rotator cuff"],
  "Rhomboids": ["Rhomboids"],
  "Erector spinae": ["Erector spinae"],
  "Adductors": ["Adductors"]
};

function PhotoAnalytics() {
  const analytics = useAnalyticsData();
  const state = useIronLungStore();

  return (
    <ScreenShell title="Photo Analytics" subtitle="Progress-photo score trend, metadata coverage, pose mix, and analysis confidence.">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Photos" value={String(analytics.totals.photos)} hint="local" />
        <MetricCard label="Analyses" value={String(analytics.totals.analyses)} hint="stub/local" />
        <MetricCard label="Latest score" value={analytics.photoScoreTrend.at(-1)?.score ? String(Math.round(analytics.photoScoreTrend.at(-1)?.score ?? 0)) : "--"} hint="experimental" />
        <MetricCard label="Bodyweight entries" value={String(analytics.totals.bodyweightEntries)} hint="sessions + photos" />
      </div>
      <ChartCard title="Body Progress Score trend">
        <ResponsiveContainer width="100%" height={310}>
          <ReLineChart data={analytics.photoScoreTrend}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line dataKey="score" stroke="#64d2ff" strokeWidth={2} dot />
            <Line dataKey="confidence" stroke="#ffd166" strokeWidth={2} dot />
          </ReLineChart>
        </ResponsiveContainer>
      </ChartCard>
      <Card>
        <SectionHeader title="Photo metadata" icon={Camera} />
        <AnalyticsTable
          headers={["Captured", "Pose", "Bodyweight", "Lighting", "Pump", "Analyzed"]}
          rows={[...state.photos].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)).map((photo) => [
            shortDate(photo.capturedAt),
            photo.poseType,
            photo.bodyweight ? String(photo.bodyweight) : "--",
            photo.lightingTag || "--",
            photo.pumpTag || "--",
            state.analyses.some((analysis) => analysis.progressPhotoId === photo.id) ? "yes" : "no"
          ])}
        />
      </Card>
    </ScreenShell>
  );
}

function DataAnalytics() {
  const analytics = useAnalyticsData();

  return (
    <ScreenShell title="Data Quality Analytics" subtitle="Import coverage, missing fields, zero-load sets, notes coverage, and source breakdown.">
      <div className="grid grid-cols-5 gap-4">
        <MetricCard label="Imported sets" value={String(analytics.dataQuality.importedSets)} hint="external source" />
        <MetricCard label="Manual sets" value={String(analytics.dataQuality.manualSets)} hint="created inside app" />
        <MetricCard label="Duplicate hashes" value={String(analytics.dataQuality.duplicateImportHashes)} hint="should be 0" />
        <MetricCard label="Missing RPE" value={String(analytics.dataQuality.missingRpeSets)} hint="sets" />
        <MetricCard label="Zero-load" value={String(analytics.dataQuality.zeroWeightSets)} hint="sets" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <SectionHeader title="Coverage" icon={Database} />
          <StatRows rows={[
            ["First workout", analytics.dataQuality.firstWorkout ? dateTime(analytics.dataQuality.firstWorkout) : "--"],
            ["Last workout", analytics.dataQuality.lastWorkout ? dateTime(analytics.dataQuality.lastWorkout) : "--"],
            ["Sessions with notes", String(analytics.dataQuality.sessionsWithNotes)],
            ["Sets with notes", String(analytics.dataQuality.setsWithNotes)],
            ["Bodyweight entries", String(analytics.dataQuality.bodyweightEntries)],
            ["RPE coverage", `${analytics.intensity.rpeCoverage}%`]
          ]} />
        </Card>
        <ChartCard title="Missing-data shape">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[
              { name: "Missing RPE", count: analytics.dataQuality.missingRpeSets },
              { name: "Zero-load", count: analytics.dataQuality.zeroWeightSets },
              { name: "Duplicate hashes", count: analytics.dataQuality.duplicateImportHashes },
              { name: "Session notes", count: analytics.dataQuality.sessionsWithNotes },
              { name: "Set notes", count: analytics.dataQuality.setsWithNotes }
            ]}>
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.34)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#64d2ff" radius={[7, 7, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </ScreenShell>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const state = useIronLungStore();
  const openSession = selectOpenSession(state);
  const recentSessions = [...state.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 5);
  const recentPRs = [...state.personalRecords].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt)).slice(0, 5);
  const weekly = useWeeklyVolumeData();
  const latestScore = [...state.analyses].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const sessionSets = buildSessionSetGroups(state);
  const totalVolume = state.sessions.reduce((total, session) => total + workoutSessionVolume(sessionSets[session.id] ?? []), 0);

  return (
    <ScreenShell
      title="Dashboard"
      subtitle="Your custom training cockpit. No premade plans, just the workouts you build and log."
      action={
        <Button onClick={() => onNavigate("Workouts")} icon={Plus}>
          Create Workout
        </Button>
      }
    >
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Lifetime volume" value={compactNumber(totalVolume)} hint={state.unitPreference} />
        <MetricCard label="Logged workouts" value={String(state.sessions.filter((item) => item.finishedAt).length)} hint="finished" />
        <MetricCard label="Total PRs" value={String(state.personalRecords.length)} hint="auto-detected" />
        <MetricCard label="Body score" value={latestScore ? String(Math.round(latestScore.score)) : "--"} hint="local ML" />
      </div>
      <div className="grid grid-cols-[1.3fr_.9fr] gap-5">
        <Card className="min-h-[320px]">
          <SectionHeader title={openSession ? "Active workout" : "Today's quick start"} icon={Dumbbell} />
          {openSession ? (
            <div className="flex items-center justify-between rounded-xl border border-accent/25 bg-accent/10 p-4">
              <div>
                <div className="font-semibold">{openSession.name}</div>
                <div className="text-sm text-white/55">Started {dateTime(openSession.startedAt)}</div>
              </div>
              <Button onClick={() => onNavigate("Workouts")} icon={ChevronRight}>Resume</Button>
            </div>
          ) : state.templates.length ? (
            <div className="grid gap-3">
              {state.templates.slice(0, 3).map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    state.startWorkout(template.id);
                    onNavigate("Workouts");
                  }}
                  className="flex items-center justify-between rounded-xl border border-line bg-white/[0.03] p-4 text-left transition hover:border-accent/50"
                >
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-white/45">
                      {state.templateExercises.filter((item) => item.workoutTemplateId === template.id).length} exercises
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/40" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Plus}
              title="Build your first workout"
              body="Create a custom template from your own exercise library, then start logging sets."
              action={<Button onClick={() => onNavigate("Workouts")} icon={Plus}>Create Workout</Button>}
            />
          )}
          <div className="mt-5 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="weeklyVolume" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#64d2ff" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#64d2ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="weekStart" stroke="rgba(255,255,255,0.36)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.36)" tickLine={false} axisLine={false} width={48} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="volume" stroke="#64d2ff" fill="url(#weeklyVolume)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <SectionHeader title="Recent PRs" icon={Trophy} />
          {recentPRs.length ? (
            <div className="space-y-3">
              {recentPRs.map((record) => (
                <PRRow key={record.id} record={record} exercises={state.exercises} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Trophy} title="No PRs yet" body="PR badges appear automatically after you log qualifying sets." />
          )}
        </Card>
      </div>
      <Card>
        <SectionHeader title="Recent workouts" icon={LineChart} />
        {recentSessions.length ? (
          <div className="grid grid-cols-5 gap-3">
            {recentSessions.map((session) => (
              <SessionTile key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Dumbbell} title="No sessions logged" body="Start a custom workout to build your training history." />
        )}
      </Card>
    </ScreenShell>
  );
}

function Workouts() {
  const state = useIronLungStore();
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(state.templates[0]?.id ?? "");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const openSession = selectOpenSession(state);
  const selectedTemplate = state.templates.find((template) => template.id === selectedTemplateId) ?? state.templates[0];

  function createTemplate(event: FormEvent) {
    event.preventDefault();
    if (!templateName.trim()) return;
    const template = state.createTemplate(templateName.trim());
    setSelectedTemplateId(template.id);
    setTemplateName("");
  }

  return (
    <ScreenShell title="Workouts" subtitle="Create your own templates and log active sessions. No premade workouts exist in the app.">
      {openSession ? (
        <ActiveLogger session={openSession} />
      ) : (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <SectionHeader title="Workout builder" icon={Plus} />
            {selectedTemplate && <Button onClick={() => state.startWorkout(selectedTemplate.id)} icon={Flame}>Start workout</Button>}
          </div>
          <form className="mb-5 grid grid-cols-[1fr_auto] gap-3" onSubmit={createTemplate}>
            <Input placeholder="New workout name, e.g. Upper Strength" value={templateName} onChange={setTemplateName} />
            <Button type="submit" icon={Plus}>Save template</Button>
          </form>
          <div className="grid grid-cols-[320px_1fr] gap-5">
            <div className="space-y-2">
              {state.templates.length ? (
                state.templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={clsx(
                      "w-full rounded-xl border p-4 text-left transition",
                      selectedTemplate?.id === template.id ? "border-accent/60 bg-accent/10" : "border-line bg-white/[0.03] hover:border-white/20"
                    )}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="mt-1 text-sm text-white/45">
                      {state.templateExercises.filter((item) => item.workoutTemplateId === template.id).length} exercises
                    </div>
                  </button>
                ))
              ) : (
                <EmptyState icon={Plus} title="Create a template" body="Name a workout, then add exercises from your library." />
              )}
            </div>
            <div className="rounded-xl border border-line bg-black/15 p-4">
              {selectedTemplate ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-semibold">{selectedTemplate.name}</div>
                      <div className="text-sm text-white/45">Drag-ready structure with target sets, reps, and rest.</div>
                    </div>
                    <div className="flex gap-2">
                      <Select value={selectedExerciseId} onChange={setSelectedExerciseId}>
                        <option value="">Add exercise</option>
                        {state.exercises.map((exercise) => (
                          <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                        ))}
                      </Select>
                      <Button
                        onClick={() => {
                          if (!selectedExerciseId) return;
                          state.addTemplateExercise(selectedTemplate.id, selectedExerciseId, {});
                          setSelectedExerciseId("");
                        }}
                        icon={Plus}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  <TemplateExerciseList templateId={selectedTemplate.id} />
                </>
              ) : (
                <EmptyState icon={Dumbbell} title="No workout selected" body="Create a template to start building." />
              )}
            </div>
          </div>
        </Card>
      )}
    </ScreenShell>
  );
}

function ActiveLogger({ session }: { session: WorkoutSession }) {
  const state = useIronLungStore();
  const [exerciseId, setExerciseId] = useState("");
  const [finishNotes, setFinishNotes] = useState("");
  const sessionExercises = state.sessionExercises
    .filter((item) => item.workoutSessionId === session.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">{session.name}</div>
            <div className="text-sm text-white/45">Started {dateTime(session.startedAt)}</div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={exerciseId} onChange={setExerciseId}>
              <option value="">Add exercise</option>
              {state.exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
              ))}
            </Select>
            <Button onClick={() => exerciseId && state.addExerciseToSession(session.id, exerciseId)} icon={Plus}>Add</Button>
          </div>
        </div>
      </Card>
      {sessionExercises.length ? (
        sessionExercises.map((row) => {
          const exercise = state.exercises.find((item) => item.id === row.exerciseId);
          if (!exercise) return null;
          return <LoggerExercise key={row.id} sessionExerciseId={row.id} session={session} exercise={exercise} />;
        })
      ) : (
        <Card>
          <EmptyState icon={Plus} title="Add an exercise to begin" body="You can add or remove exercises during the workout." />
        </Card>
      )}
      <Card>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Input placeholder="Session notes" value={finishNotes} onChange={setFinishNotes} />
          <Button onClick={() => state.finishWorkout(session.id, finishNotes)} icon={CheckCircle2}>Finish workout</Button>
        </div>
      </Card>
    </div>
  );
}

function LoggerExercise({ sessionExerciseId, session, exercise }: { sessionExerciseId: string; session: WorkoutSession; exercise: Exercise }) {
  const state = useIronLungStore();
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [setType, setSetType] = useState<SetType>("working");
  const [notes, setNotes] = useState("");
  const [lastRecords, setLastRecords] = useState<PersonalRecord[]>([]);
  const repsRef = useRef<HTMLInputElement | null>(null);
  const weightRef = useRef<HTMLInputElement | null>(null);
  const sets = state.setLogs.filter((setLog) => setLog.workoutSessionExerciseId === sessionExerciseId);
  const prior = findPreviousPerformance(exercise.id, session.id, state);

  function submit() {
    if (!weight || !reps) return;
    const records = state.logSet({
      workoutSessionExerciseId: sessionExerciseId,
      exerciseId: exercise.id,
      workoutSessionId: session.id,
      weight: Number(weight),
      reps: Number(reps),
      rpe: rpe ? Number(rpe) : null,
      setType,
      notes
    });
    setLastRecords(records);
    setReps("");
    setNotes("");
    weightRef.current?.focus();
  }

  function duplicatePrevious() {
    const previous = sets[sets.length - 1];
    if (!previous) return;
    setWeight(String(previous.weight));
    setReps(String(previous.reps));
    setRpe(previous.rpe ? String(previous.rpe) : "");
    setSetType(previous.setType);
    setNotes(previous.notes ?? "");
    repsRef.current?.focus();
  }

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="text-xl font-semibold">{exercise.name}</div>
          <div className="text-sm text-white/45">
            {exercise.primaryMuscle} · {exercise.equipment} · last: {prior || "no prior sets"}
          </div>
        </div>
        <div className="rounded-lg border border-line px-3 py-2 text-sm text-white/55">Rest 2:00</div>
      </div>
      <div className="mb-3 grid grid-cols-[80px_1fr_1fr_1fr_1.2fr_1fr_auto] gap-2 text-xs uppercase tracking-wide text-white/35">
        <span>Set</span><span>Weight</span><span>Reps</span><span>RPE</span><span>Type</span><span>Volume</span><span />
      </div>
      {sets.map((setLog) => (
        <div key={setLog.id} className="mb-2 grid grid-cols-[80px_1fr_1fr_1fr_1.2fr_1fr_auto] items-center gap-2 rounded-lg bg-white/[0.035] p-2">
          <span className="text-sm text-white/55">#{setLog.setNumber}</span>
          <span>{setLog.weight}</span>
          <span>{setLog.reps}</span>
          <span>{setLog.rpe ?? "--"}</span>
          <span className="capitalize text-white/70">{setLog.setType}</span>
          <span>{setVolume(setLog.weight, setLog.reps)}</span>
          <span className="text-xs text-accent">1RM {oneRmForSet(setLog)}</span>
        </div>
      ))}
      <div className="grid grid-cols-[80px_1fr_1fr_1fr_1.2fr_1fr_auto] items-center gap-2">
        <span className="text-sm text-white/45">Next</span>
        <input
          ref={weightRef}
          className={fieldClass}
          inputMode="decimal"
          placeholder="225"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && repsRef.current?.focus()}
        />
        <input
          ref={repsRef}
          className={fieldClass}
          inputMode="numeric"
          placeholder="5"
          value={reps}
          onChange={(event) => setReps(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
        />
        <input className={fieldClass} inputMode="decimal" placeholder="8" value={rpe} onChange={(event) => setRpe(event.target.value)} />
        <select className={fieldClass} value={setType} onChange={(event) => setSetType(event.target.value as SetType)}>
          <option value="working">Working</option>
          <option value="warmup">Warmup</option>
          <option value="drop">Drop set</option>
          <option value="failure">Failure</option>
          <option value="amrap">AMRAP</option>
        </select>
        <input className={fieldClass} placeholder="Note" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <div className="flex gap-2">
          <IconButton label="Duplicate previous set" onClick={duplicatePrevious} icon={FolderDown} />
          <IconButton label="Log set" onClick={submit} icon={CheckCircle2} />
        </div>
      </div>
      {lastRecords.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {lastRecords.map((record) => (
            <span key={record.id} className="rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-sm text-mint">
              PR · {prLabel(record.type)} {record.value}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function Exercises() {
  const state = useIronLungStore();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(state.exercises[0]?.id ?? "");
  const filtered = state.exercises.filter((exercise) => exercise.name.toLowerCase().includes(query.toLowerCase()));
  const selected = state.exercises.find((exercise) => exercise.id === selectedId) ?? filtered[0];

  return (
    <ScreenShell title="Exercise Library" subtitle="Create custom movements with muscle, equipment, and movement metadata.">
      <div className="grid grid-cols-[400px_1fr] gap-5">
        <Card>
          <ExerciseForm onCreated={(exercise) => setSelectedId(exercise.id)} />
          <div className="my-4">
            <Input placeholder="Search exercises" value={query} onChange={setQuery} />
          </div>
          <div className="space-y-2">
            {filtered.length ? filtered.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => setSelectedId(exercise.id)}
                className={clsx("w-full rounded-xl border p-3 text-left", selected?.id === exercise.id ? "border-accent/60 bg-accent/10" : "border-line bg-white/[0.03]")}
              >
                <div className="font-medium">{exercise.name}</div>
                <div className="text-sm text-white/45">{exercise.primaryMuscle} · {exercise.equipment}</div>
              </button>
            )) : <EmptyState icon={Activity} title="No exercises" body="Create custom exercises to start building workouts." />}
          </div>
        </Card>
        <Card>
          {selected ? <ExerciseDetail exercise={selected} /> : <EmptyState icon={Activity} title="Select an exercise" body="Charts appear after you log sets." />}
        </Card>
      </div>
      <BoostcampImportPanel />
    </ScreenShell>
  );
}

function BoostcampImportPanel() {
  const state = useIronLungStore();
  const [unit, setUnit] = useState<ImportUnitPreference>("auto");
  const [normalized, setNormalized] = useState<NormalizedWorkoutImport | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mappings, setMappings] = useState<ExerciseMapping[]>([]);
  const [summary, setSummary] = useState<ImportCommitSummary | null>(null);
  const [status, setStatus] = useState("");

  async function handleFile(file?: File) {
    if (!file) return;
    try {
      setStatus("Parsing locally...");
      setSummary(null);
      const text = await file.text();
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      const importer = isCsv ? new BoostcampCsvImporter() : new BoostcampJsonImporter();
      const parsed = importer.parse(text, { unit });
      const existingHashes = state.setLogs.map((setLog) => setLog.importHash).filter((hash): hash is string => Boolean(hash));
      const nextPreview = buildImportPreview(parsed, state.exercises, existingHashes);
      const importedNames = [...new Set(parsed.workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.exerciseName)))];
      setNormalized(parsed);
      setPreview(nextPreview);
      setMappings(createDefaultExerciseMappings(importedNames, state.exercises));
      setStatus("Dry run complete. Review mappings before importing.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not parse Boostcamp file.");
      setNormalized(null);
      setPreview(null);
      setMappings([]);
    }
  }

  function updateMapping(importedName: string, patch: Partial<ExerciseMapping>) {
    setMappings((current) => current.map((mapping) => {
      if (mapping.importedName !== importedName) return mapping;
      const next = { ...mapping, ...patch };
      if (patch.exerciseId) {
        const exercise = state.exercises.find((item) => item.id === patch.exerciseId);
        next.exerciseName = exercise?.name ?? next.exerciseName;
        next.action = "map";
      }
      return next;
    }));
  }

  function commitImport() {
    if (!normalized) return;
    const result = state.importNormalizedWorkouts(normalized, mappings, unit);
    setSummary(result);
    setStatus("Import finished.");
    const existingHashes = useIronLungStore.getState().setLogs.map((setLog) => setLog.importHash).filter((hash): hash is string => Boolean(hash));
    setPreview(buildImportPreview(normalized, useIronLungStore.getState().exercises, existingHashes));
  }

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <SectionHeader title="Boostcamp Import" icon={FolderUp} />
          <p className="max-w-3xl text-sm leading-6 text-white/50">
            Import CSV or JSON files you provide manually. IronLung does not scrape Boostcamp, request Boostcamp credentials, or upload imported data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={unit} onChange={(value) => setUnit(value as ImportUnitPreference)}>
            <option value="auto">Auto unit</option>
            <option value="lbs">lbs</option>
            <option value="kg">kg</option>
          </Select>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink">
            <FolderUp className="h-4 w-4" />
            Upload CSV/JSON
            <input className="hidden" type="file" accept=".csv,.json,.txt,application/json,text/csv,text/plain" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
        </div>
      </div>

      {status && <div className="mb-4 rounded-xl border border-line bg-black/20 p-3 text-sm text-white/55">{status}</div>}

      {preview && (
        <div className="grid grid-cols-6 gap-3">
          <ImportStat label="Workouts found" value={String(preview.totalWorkouts)} hint="dry run" />
          <ImportStat label="Exercises found" value={String(preview.totalExercises)} hint="names" />
          <ImportStat label="Sets found" value={String(preview.totalSets)} hint="rows" />
          <ImportStat label="Duplicate sets" value={String(preview.duplicateSetHashes.length)} hint="hashes" />
          <ImportStat label="Skipped rows" value={String(preview.skippedRows.length)} hint="parse" />
          <ImportStat label="Unknown fields" value={String(preview.unknownFields.length)} hint="preserved" />
        </div>
      )}

      {preview && (
        <div className="mt-5 grid grid-cols-[1fr_360px] gap-5">
          <div className="rounded-xl border border-line bg-black/15 p-4">
            <div className="mb-3 font-medium">Exercise mapping</div>
            <div className="max-h-80 space-y-2 overflow-auto pr-1">
              {mappings.map((mapping) => (
                <div key={mapping.importedName} className="grid grid-cols-[1fr_150px_1.2fr] items-center gap-2 rounded-lg border border-line bg-white/[0.03] p-2">
                  <div>
                    <div className="text-sm font-medium">{mapping.importedName}</div>
                    <div className="text-xs text-white/38">Imported name</div>
                  </div>
                  <Select value={mapping.action} onChange={(value) => updateMapping(mapping.importedName, { action: value as ExerciseMapping["action"] })}>
                    <option value="create">Create new</option>
                    <option value="map">Map existing</option>
                    <option value="skip">Skip</option>
                  </Select>
                  {mapping.action === "map" ? (
                    <Select value={mapping.exerciseId ?? ""} onChange={(value) => updateMapping(mapping.importedName, { exerciseId: value })}>
                      <option value="">Choose exercise</option>
                      {state.exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
                    </Select>
                  ) : (
                    <Input value={mapping.exerciseName} onChange={(value) => updateMapping(mapping.importedName, { exerciseName: value })} placeholder="Exercise name" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-line bg-black/15 p-4">
              <div className="mb-2 font-medium">Date range</div>
              <div className="text-sm text-white/50">
                {preview.dateRange.start ? `${shortDate(preview.dateRange.start)} to ${shortDate(preview.dateRange.end ?? preview.dateRange.start)}` : "No dates found"}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-black/15 p-4">
              <div className="mb-2 font-medium">Unknown fields</div>
              <div className="max-h-24 overflow-auto text-sm text-white/50">
                {preview.unknownFields.length ? preview.unknownFields.slice(0, 18).join(", ") : "None"}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-black/15 p-4">
              <div className="mb-2 font-medium">Possible duplicate exercises</div>
              <div className="space-y-1 text-sm text-white/50">
                {preview.possibleDuplicateExercises.length
                  ? preview.possibleDuplicateExercises.slice(0, 5).map((item) => <div key={`${item.importedName}-${item.existingName}`}>{item.importedName} -&gt; {item.existingName}</div>)
                  : "No close matches found"}
              </div>
            </div>
            <Button onClick={commitImport} disabled={!normalized} icon={CheckCircle2}>Import reviewed data</Button>
          </div>
        </div>
      )}

      {normalized && (
        <div className="mt-5 rounded-xl border border-line bg-black/15 p-4">
          <div className="mb-3 font-medium">Workout session preview</div>
          <div className="max-h-56 space-y-2 overflow-auto pr-1">
            {normalized.workouts.slice(0, 20).map((workout) => (
              <div key={`${workout.startedAt}-${workout.name}`} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                <span>{workout.name}</span>
                <span className="text-white/42">{shortDate(workout.startedAt)} · {workout.exercises.length} exercises</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary && (
        <div className="mt-5 grid grid-cols-6 gap-3">
          <ImportStat label="Imported" value={String(summary.workoutsImported)} hint="workouts" />
          <ImportStat label="Created" value={String(summary.exercisesCreated)} hint="exercises" />
          <ImportStat label="Sets" value={String(summary.setsImported)} hint="imported" />
          <ImportStat label="PRs" value={String(summary.prsDetected)} hint="detected" />
          <ImportStat label="Skipped" value={String(summary.skippedRows)} hint="rows" />
          <ImportStat label="Warnings" value={String(summary.warnings.length)} hint="review" />
        </div>
      )}
    </Card>
  );
}

function ImportStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-line bg-black/15 p-4">
      <div className="text-xs text-white/42">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-white/30">{hint}</div>
    </div>
  );
}

function ExerciseForm({ onCreated }: { onCreated: (exercise: Exercise) => void }) {
  const createExercise = useIronLungStore((state) => state.createExercise);
  const [name, setName] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [movementPattern, setMovementPattern] = useState("");
  const [notes, setNotes] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !primaryMuscle.trim()) return;
    const exercise = createExercise({
      name: name.trim(),
      primaryMuscle: primaryMuscle.trim(),
      secondaryMuscles: [],
      equipment: equipment.trim() || "Unspecified",
      movementPattern: movementPattern.trim() || "General",
      isUnilateral: false,
      notes
    });
    onCreated(exercise);
    setName("");
    setPrimaryMuscle("");
    setEquipment("");
    setMovementPattern("");
    setNotes("");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <SectionHeader title="Create exercise" icon={Plus} />
      <Input placeholder="Name" value={name} onChange={setName} />
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Primary muscle" value={primaryMuscle} onChange={setPrimaryMuscle} />
        <Input placeholder="Equipment" value={equipment} onChange={setEquipment} />
      </div>
      <Input placeholder="Movement pattern" value={movementPattern} onChange={setMovementPattern} />
      <Input placeholder="Notes" value={notes} onChange={setNotes} />
      <Button type="submit" icon={Plus}>Create exercise</Button>
    </form>
  );
}

function Analytics() {
  const state = useIronLungStore();
  const weekly = useWeeklyVolumeData();
  const muscle = useMemo(() => {
    const byExercise: Record<string, ReturnType<typeof state.setLogs.slice>> = {};
    for (const sessionExercise of state.sessionExercises) {
      byExercise[sessionExercise.exerciseId] ??= [];
      byExercise[sessionExercise.exerciseId].push(...state.setLogs.filter((set) => set.workoutSessionExerciseId === sessionExercise.id));
    }
    return muscleGroupVolume(state.exercises, byExercise);
  }, [state.exercises, state.sessionExercises, state.setLogs]);
  const exerciseTrend = useExerciseTrend();
  const streak = workoutFrequencyStreaks(state.sessions);

  return (
    <ScreenShell title="Progress Analytics" subtitle="Strength trends, PR history, weekly volume, muscle distribution, and frequency.">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Current streak" value={String(streak.currentStreakDays)} hint="days" />
        <MetricCard label="Longest streak" value={String(streak.longestStreakDays)} hint="days" />
        <MetricCard label="PR events" value={String(state.personalRecords.length)} hint="stored" />
        <MetricCard label="Exercises tracked" value={String(state.exercises.length)} hint="custom" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <ChartCard title="Estimated 1RM over time">
          <ResponsiveContainer width="100%" height={260}>
            <ReLineChart data={exerciseTrend}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.36)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.36)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey="estimated1RM" stroke="#64d2ff" strokeWidth={2} dot={false} />
            </ReLineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Weekly volume">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weekly}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="weekStart" stroke="rgba(255,255,255,0.36)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.36)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="volume" fill="#7ee7bf" radius={[7, 7, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Muscle group volume">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={muscle} dataKey="volume" nameKey="muscle" innerRadius={55} outerRadius={95}>
                {muscle.map((_entry, index: number) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card>
          <SectionHeader title="PR history" icon={Trophy} />
          <div className="space-y-2">
            {[...state.personalRecords]
              .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt))
              .slice(0, 8)
              .map((record) => <PRRow key={record.id} record={record} exercises={state.exercises} />)}
            {!state.personalRecords.length && <EmptyState icon={Trophy} title="No PR history" body="Log sets to populate automatic PR history." />}
          </div>
        </Card>
      </div>
    </ScreenShell>
  );
}

function PhotosLegacy() {
  const state = useIronLungStore();
  const [poseType, setPoseType] = useState<ProgressPhoto["poseType"]>("front");
  const [lightingTag, setLightingTag] = useState("");
  const [pumpTag, setPumpTag] = useState("no pump");
  const [bodyweight, setBodyweight] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trend = state.analyses.map((analysis) => ({ date: shortDate(analysis.createdAt), score: analysis.score }));

  useEffect(() => {
    return () => stopCamera();
  }, []);

  function handleUpload(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.addPhoto({
        imagePath: String(reader.result),
        poseType,
        bodyweight: bodyweight ? Number(bodyweight) : null,
        lightingTag,
        pumpTag,
        capturedAt: todayIso()
      });
    };
    reader.readAsDataURL(file);
  }

  async function openCamera() {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      window.setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch {
      setCameraError("Camera access is unavailable or was denied.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    state.addPhoto({
      imagePath: canvas.toDataURL("image/jpeg", 0.9),
      poseType,
      bodyweight: bodyweight ? Number(bodyweight) : null,
      lightingTag,
      pumpTag,
      capturedAt: todayIso()
    });
    stopCamera();
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  return (
    <ScreenShell title="Body Progress Photos" subtitle="Local photo timeline with explicit opt-in analysis and non-medical progress scoring.">
      <Card>
        <div className="rounded-xl border border-violet/30 bg-violet/10 p-4 text-sm text-violet">
          This score is an experimental progress metric. It is not a medical diagnosis, body-fat measurement, or attractiveness rating.
        </div>
        <div className="mt-4 grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3">
          <Select value={poseType} onChange={(value) => setPoseType(value as ProgressPhoto["poseType"])}>
            <option value="front">Front</option>
            <option value="side">Side</option>
            <option value="back">Back</option>
            <option value="other">Other</option>
          </Select>
          <Input placeholder="Lighting tag" value={lightingTag} onChange={setLightingTag} />
          <Select value={pumpTag} onChange={setPumpTag}>
            <option value="no pump">No pump</option>
            <option value="pump">Pump</option>
            <option value="unknown">Unknown</option>
          </Select>
          <Input placeholder="Bodyweight" value={bodyweight} onChange={setBodyweight} />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink">
            <FolderUp className="h-4 w-4" />
            Upload
            <input className="hidden" type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files?.[0])} />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={openCamera} icon={Camera}>Open camera</Button>
          {cameraError && <span className="text-sm text-danger">{cameraError}</span>}
        </div>
        {cameraOpen && (
          <div className="mt-4 overflow-hidden rounded-xl border border-line bg-black/30">
            <video ref={videoRef} autoPlay playsInline muted className="max-h-[360px] w-full bg-black object-contain" />
            <div className="flex items-center justify-end gap-2 p-3">
              <Button onClick={stopCamera}>Close</Button>
              <Button onClick={capturePhoto} icon={Camera}>Capture</Button>
            </div>
          </div>
        )}
      </Card>
      <div className="grid grid-cols-[1fr_420px] gap-5">
        <Card>
          <SectionHeader title="Photo timeline" icon={Camera} />
          {state.photos.length ? (
            <div className="grid grid-cols-3 gap-4">
              {state.photos.map((photo) => {
                const analysis = state.analyses.find((item) => item.progressPhotoId === photo.id);
                return (
                  <div key={photo.id} className="overflow-hidden rounded-xl border border-line bg-black/25">
                    <img src={photo.imagePath} alt={`${photo.poseType} progress`} className="h-48 w-full object-cover" />
                    <div className="space-y-2 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="capitalize text-white/70">{photo.poseType}</span>
                        <span className="text-white/40">{shortDate(photo.capturedAt)}</span>
                      </div>
                      {analysis ? <div className="text-mint">Score {Math.round(analysis.score)} · confidence {analysis.confidence}</div> : (
                        <Button onClick={() => state.analyzePhoto(photo.id, true)} icon={Sparkles}>Analyze with consent</Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Camera} title="No photos yet" body="Upload progress photos locally and opt in before any analysis runs." />
          )}
        </Card>
        <ChartCard title="Body Progress Score trend">
          <ResponsiveContainer width="100%" height={260}>
            <ReLineChart data={trend}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.36)" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.36)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey="score" stroke="#b9a7ff" strokeWidth={2} />
            </ReLineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </ScreenShell>
  );
}

function Photos() {
  const state = useIronLungStore();
  const [poseType, setPoseType] = useState<ProgressPhoto["poseType"]>("front");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [bodyweight, setBodyweight] = useState("");
  const [lightingTag, setLightingTag] = useState("same room");
  const [pumpTag, setPumpTag] = useState("no pump");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [analyzingPhotoId, setAnalyzingPhotoId] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const latestAnalysis = [...state.analyses].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const trend = state.analyses.map((analysis) => ({ date: shortDate(analysis.createdAt), score: analysis.score }));

  useEffect(() => {
    return () => stopCamera();
  }, []);

  function photoInput() {
    return {
      poseType,
      age: age ? Number(age) : null,
      height: height ? Number(height) : null,
      bodyweight: bodyweight ? Number(bodyweight) : null,
      lightingTag,
      pumpTag,
      capturedAt: todayIso()
    };
  }

  function handleUpload(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.addPhoto({ imagePath: String(reader.result), ...photoInput() });
      setAnalysisStatus("Photo added. Run local analysis when ready.");
    };
    reader.readAsDataURL(file);
  }

  async function openCamera() {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      window.setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch {
      setCameraError("Camera access is unavailable or was denied.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    state.addPhoto({ imagePath: canvas.toDataURL("image/jpeg", 0.9), ...photoInput() });
    setAnalysisStatus("Camera photo added. Run local analysis when ready.");
    stopCamera();
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  async function runAnalysis(photoId: string) {
    try {
      setAnalysisStatus("");
      setAnalyzingPhotoId(photoId);
      await state.analyzePhoto(photoId, true);
      setAnalysisStatus("Local approximate analysis complete.");
    } catch (error) {
      setAnalysisStatus(error instanceof Error ? error.message : "Photo analysis failed.");
    } finally {
      setAnalyzingPhotoId("");
    }
  }

  return (
    <ScreenShell title="Body Progress Photos" subtitle="Approximate local ML analysis using your photo, age, height, weight, pose, lighting, and pump context.">
      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[1fr_360px]">
          <div className="p-6">
            <div className="mb-4 inline-flex rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              Local vision model · approximate only
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Private progress analysis</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/52">
              IronLung scores photo quality, consistency, pose category, and capture context. Age, height, and weight improve context, but the result stays approximate and user-relative.
            </p>
            <div className="mt-5 rounded-xl border border-violet/30 bg-violet/10 p-4 text-sm leading-6 text-violet">
              Approximate only: not a medical diagnosis, not an exact body-fat percentage, not an attractiveness rating, and not a comparison against other users.
            </div>
          </div>
          <div className="border-l border-line bg-black/20 p-6">
            <div className="text-sm text-white/45">Latest score</div>
            <div className="mt-2 text-6xl font-semibold tracking-tight">{latestAnalysis ? Math.round(latestAnalysis.score) : "--"}</div>
            <div className="mt-2 text-sm text-white/45">
              {latestAnalysis ? `${Math.round(latestAnalysis.confidence * 100)}% confidence · ${latestAnalysis.modelVersion}` : "Upload a photo and run local analysis"}
            </div>
            {latestAnalysis && <AnalysisSignalGrid analysis={latestAnalysis} />}
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Capture context" icon={Camera} />
        <div className="grid grid-cols-[.8fr_.7fr_.8fr_.9fr_1fr_.9fr_auto] gap-3">
          <Select value={poseType} onChange={(value) => setPoseType(value as ProgressPhoto["poseType"])}>
            <option value="front">Front</option>
            <option value="side">Side</option>
            <option value="back">Back</option>
            <option value="other">Other</option>
          </Select>
          <Input placeholder="Age" value={age} onChange={setAge} />
          <Input placeholder="Height in" value={height} onChange={setHeight} />
          <Input placeholder={`Weight ${state.unitPreference}`} value={bodyweight} onChange={setBodyweight} />
          <Input placeholder="Lighting tag" value={lightingTag} onChange={setLightingTag} />
          <Select value={pumpTag} onChange={setPumpTag}>
            <option value="no pump">No pump</option>
            <option value="pump">Pump</option>
            <option value="unknown">Unknown</option>
          </Select>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink">
            <FolderUp className="h-4 w-4" />
            Upload
            <input className="hidden" type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files?.[0])} />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={openCamera} icon={Camera}>Open camera</Button>
          {cameraError && <span className="text-sm text-danger">{cameraError}</span>}
          {analysisStatus && <span className="text-sm text-mint">{analysisStatus}</span>}
        </div>
        {cameraOpen && (
          <div className="mt-4 overflow-hidden rounded-xl border border-line bg-black/30">
            <video ref={videoRef} autoPlay playsInline muted className="max-h-[360px] w-full bg-black object-contain" />
            <div className="flex items-center justify-end gap-2 p-3">
              <Button onClick={stopCamera}>Close</Button>
              <Button onClick={capturePhoto} icon={Camera}>Capture</Button>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-[1fr_420px] gap-5">
        <Card>
          <SectionHeader title="Photo timeline" icon={Camera} />
          {state.photos.length ? (
            <div className="grid grid-cols-3 gap-4">
              {state.photos.map((photo) => {
                const analysis = [...state.analyses].reverse().find((item) => item.progressPhotoId === photo.id);
                return (
                  <div key={photo.id} className="group overflow-hidden rounded-xl border border-line bg-black/25 transition hover:border-accent/45">
                    <div className="relative">
                      <img src={photo.imagePath} alt={`${photo.poseType} progress`} className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                      {analysis && (
                        <div className="absolute right-3 top-3 rounded-full border border-black/30 bg-white px-3 py-1 text-sm font-semibold text-ink shadow-soft">
                          {Math.round(analysis.score)}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="capitalize text-white/70">{photo.poseType}</span>
                        <span className="text-white/40">{shortDate(photo.capturedAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-white/45">
                        <span className="rounded-full border border-line px-2 py-1">{photo.age ? `${photo.age}y` : "age missing"}</span>
                        <span className="rounded-full border border-line px-2 py-1">{photo.height ? `${photo.height} in` : "height missing"}</span>
                        <span className="rounded-full border border-line px-2 py-1">{photo.bodyweight ? `${photo.bodyweight} ${state.unitPreference}` : "weight missing"}</span>
                        <span className="rounded-full border border-line px-2 py-1">{photo.lightingTag || "lighting missing"}</span>
                      </div>
                      {analysis ? (
                        <div>
                          <div className="text-mint">Approx score {Math.round(analysis.score)} · {Math.round(analysis.confidence * 100)}% confidence</div>
                          <div className="mt-2 text-xs leading-5 text-white/42">{compositionLabel(analysis)}</div>
                        </div>
                      ) : (
                        <Button disabled={analyzingPhotoId === photo.id} onClick={() => runAnalysis(photo.id)} icon={Sparkles}>
                          {analyzingPhotoId === photo.id ? "Analyzing..." : "Analyze locally"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Camera} title="No photos yet" body="Upload progress photos locally and opt in before analysis runs." />
          )}
        </Card>
        <ChartCard title="Body Progress Score trend">
          <ResponsiveContainer width="100%" height={260}>
            <ReLineChart data={trend}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.36)" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.36)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey="score" stroke="#b9a7ff" strokeWidth={2} />
            </ReLineChart>
          </ResponsiveContainer>
          {latestAnalysis && (
            <div className="mt-4 rounded-xl border border-line bg-black/20 p-4">
              <div className="mb-2 text-sm font-medium">Latest model notes</div>
              <div className="space-y-2 text-sm leading-5 text-white/50">
                {latestAnalysis.warningsJson.slice(0, 5).map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            </div>
          )}
        </ChartCard>
      </div>
    </ScreenShell>
  );
}

function AnalysisSignalGrid({ analysis }: { analysis: { measurementsJson: Record<string, unknown> } }) {
  const quality = (analysis.measurementsJson.photoQualitySignals ?? {}) as Record<string, number>;
  const items = [
    ["Exposure", quality.exposureBalance],
    ["Sharpness", quality.sharpness],
    ["Framing", quality.centerBalance],
    ["Contrast", quality.contrast]
  ];
  return (
    <div className="mt-5 grid grid-cols-2 gap-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-line bg-white/[0.03] p-3">
          <div className="text-xs text-white/38">{label}</div>
          <div className="mt-1 text-lg font-semibold">{typeof value === "number" ? Math.round(value) : "--"}</div>
        </div>
      ))}
    </div>
  );
}

function compositionLabel(analysis: { measurementsJson: Record<string, unknown> }): string {
  const composition = analysis.measurementsJson.approximateVisualComposition as Record<string, unknown> | undefined;
  if (!composition) return "Approximate visual progress band not available.";
  return `${composition.label}: ${String(composition.band).replaceAll("_", " ")}.`;
}

function SettingsScreen() {
  const state = useIronLungStore();
  const [importText, setImportText] = useState("");
  const [status, setStatus] = useState("");
  const exportData = JSON.stringify(createExport(pickStateData(state)), null, 2);

  function importData() {
    try {
      state.importData(validateImportPayload(importText));
      setStatus("Import complete.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Import failed.");
    }
  }

  async function importDataFile(file?: File) {
    if (!file) return;
    try {
      state.importData(validateImportPayload(await file.text()));
      setStatus("Import complete.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Import failed.");
    }
  }

  return (
    <ScreenShell title="Settings" subtitle="Units, theme, privacy controls, local backup, JSON import and export.">
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <SectionHeader title="Preferences" icon={Settings} />
          <div className="grid grid-cols-2 gap-3">
            <Select value={state.unitPreference} onChange={(value) => state.updateSettings({ unitPreference: value as "lbs" | "kg" })}>
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </Select>
            <Select value={state.theme} onChange={(value) => state.updateSettings({ theme: value as "dark" | "light" | "system" })}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </Select>
          </div>
          <div className="mt-5 space-y-3 rounded-xl border border-line bg-black/20 p-4 text-sm text-white/55">
            <p>Backup location is user-controlled. Cloud sync is intentionally not implemented in the MVP.</p>
            <p>Photos are local by default and can be deleted independently from workout logs.</p>
            <Button onClick={() => state.deleteAllPhotoData()} icon={Trash2}>Delete all local photo data</Button>
          </div>
        </Card>
        <Card>
          <SectionHeader title="Import / export" icon={FolderDown} />
          <textarea className={`${fieldClass} h-48 w-full resize-none`} value={exportData} readOnly />
          <textarea
            className={`${fieldClass} mt-3 h-28 w-full resize-none`}
            placeholder="Paste IronLung JSON export to import"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
          />
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={importData} icon={FolderUp}>Import JSON</Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink">
              <FolderUp className="h-4 w-4" />
              Import file
              <input className="hidden" type="file" accept=".json,application/json" onChange={(event) => importDataFile(event.target.files?.[0])} />
            </label>
            <Button onClick={() => state.clearAllData()} icon={Trash2}>Reset local data</Button>
            <span className="text-sm text-white/45">{status}</span>
          </div>
        </Card>
      </div>
    </ScreenShell>
  );
}

function TemplateExerciseList({ templateId }: { templateId: string }) {
  const state = useIronLungStore();
  const rows = state.templateExercises.filter((item) => item.workoutTemplateId === templateId).sort((a, b) => a.orderIndex - b.orderIndex);

  if (!rows.length) {
    return <EmptyState icon={Plus} title="No exercises added" body="Add custom exercises from your library. Templates remain entirely user-created." />;
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => {
        const exercise = state.exercises.find((item) => item.id === row.exerciseId);
        return (
          <div key={row.id} className="grid grid-cols-[48px_1fr_100px_100px_120px_auto] items-center gap-3 rounded-xl border border-line bg-white/[0.03] p-3">
            <div className="text-sm text-white/40">#{index + 1}</div>
            <div>
              <div className="font-medium">{exercise?.name ?? "Missing exercise"}</div>
              <div className="text-sm text-white/40">{exercise?.primaryMuscle}</div>
            </div>
            <span>{row.targetSets} sets</span>
            <span>{row.targetReps}</span>
            <span>{row.targetRestSeconds}s rest</span>
            <IconButton label="Remove exercise" icon={Trash2} onClick={() => state.removeTemplateExercise(row.id)} />
          </div>
        );
      })}
    </div>
  );
}

function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const trend = useExerciseTrend(exercise.id);
  const state = useIronLungStore();
  const records = state.personalRecords
    .filter((record) => record.exerciseId === exercise.id)
    .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt));

  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="text-2xl font-semibold">{exercise.name}</div>
          <div className="text-sm text-white/45">{exercise.primaryMuscle} · {exercise.equipment} · {exercise.movementPattern}</div>
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-sm text-white/45">{exercise.isUnilateral ? "Unilateral" : "Bilateral"}</span>
      </div>
      <div className="mb-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={trend}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.36)" tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.36)" tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line dataKey="maxWeight" stroke="#7ee7bf" strokeWidth={2} name="Max weight" />
            <Line dataKey="estimated1RM" stroke="#64d2ff" strokeWidth={2} name="Estimated 1RM" />
          </ReLineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {records.slice(0, 4).map((record) => <PRRow key={record.id} record={record} exercises={[exercise]} />)}
      </div>
    </div>
  );
}

function ScreenShell({ title, subtitle, action, children }: { title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1520px] space-y-5">
      <header className="flex items-start justify-between gap-6 rounded-2xl border border-line bg-white/[0.035] p-5 shadow-soft backdrop-blur">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">{subtitle}</p>
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={clsx("rounded-2xl border border-line bg-panel/88 p-5 shadow-soft backdrop-blur-xl ring-1 ring-white/[0.02]", className)}>{children}</section>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <SectionHeader title={title} icon={BarChart3} />
      {children}
    </Card>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: typeof Home }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-accent" />
      <h2 className="font-semibold">{title}</h2>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
      <div className="text-sm text-white/45">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-white/32">{hint}</div>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, body, action }: { icon: typeof Home; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-white/12 bg-white/[0.02] p-6 text-center">
      <div>
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl border border-line bg-white/[0.04]">
          <Icon className="h-5 w-5 text-white/45" />
        </div>
        <div className="font-medium">{title}</div>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-white/45">{body}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

function Button({ children, icon: Icon, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: typeof Home }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-accent disabled:opacity-40",
        props.className
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

function IconButton({ label, icon: Icon, onClick }: { label: string; icon: typeof Home; onClick: () => void }) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white/[0.04] text-white/70 transition hover:border-accent/50 hover:text-white"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <input className={fieldClass} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />;
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>;
}

function StatRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="divide-y divide-white/8 rounded-xl border border-line">
      {rows.map(([label, value]) => <StatRow key={label} label={label} value={value} />)}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="text-sm text-white/48">{label}</div>
      <div className="text-right text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function AnalyticsTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-auto rounded-xl border border-line">
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-ink text-white/52">
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b border-line px-3 py-2 text-left font-medium">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="odd:bg-white/[0.025]">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="whitespace-nowrap border-b border-white/6 px-3 py-2 text-white/72">{cell}</td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-8 text-center text-white/42">No data yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PRRow({ record, exercises }: { record: PersonalRecord; exercises: Exercise[] }) {
  const exercise = exercises.find((item) => item.id === record.exerciseId);
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-white/[0.03] p-3">
      <div>
        <div className="font-medium">{exercise?.name ?? "Exercise"} · {prLabel(record.type)}</div>
        <div className="text-sm text-white/42">{shortDate(record.achievedAt)}</div>
      </div>
      <div className="rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-sm text-mint">{record.value} {record.unit}</div>
    </div>
  );
}

function SessionTile({ session }: { session: WorkoutSession }) {
  const state = useIronLungStore();
  const rows = state.sessionExercises.filter((row) => row.workoutSessionId === session.id);
  const volume = workoutSessionVolume(rows.map((row) => state.setLogs.filter((set) => set.workoutSessionExerciseId === row.id)));
  return (
    <div className="rounded-xl border border-line bg-white/[0.03] p-4">
      <div className="font-medium">{session.name}</div>
      <div className="mt-1 text-sm text-white/40">{shortDate(session.startedAt)}</div>
      <div className="mt-4 text-xl font-semibold">{compactNumber(volume)}</div>
      <div className="text-xs uppercase tracking-wide text-white/32">volume</div>
    </div>
  );
}

function useAnalyticsData() {
  const state = useIronLungStore();
  return useMemo(
    () =>
      buildAnalyticsSnapshot({
        exercises: state.exercises,
        sessions: state.sessions,
        sessionExercises: state.sessionExercises,
        setLogs: state.setLogs,
        personalRecords: state.personalRecords,
        photos: state.photos,
        analyses: state.analyses
      }),
    [state.exercises, state.sessions, state.sessionExercises, state.setLogs, state.personalRecords, state.photos, state.analyses]
  );
}

function useWeeklyVolumeData() {
  const state = useIronLungStore();
  return useMemo(() => weeklyVolume(state.sessions, buildSessionSetGroups(state)), [state.sessions, state.sessionExercises, state.setLogs]);
}

function useExerciseTrend(exerciseId?: string) {
  const state = useIronLungStore();
  return useMemo(() => {
    const rows = state.sessionExercises.filter((row) => !exerciseId || row.exerciseId === exerciseId);
    return rows.flatMap((row) => {
      const session = state.sessions.find((item) => item.id === row.workoutSessionId);
      const sets = state.setLogs.filter((set) => set.workoutSessionExerciseId === row.id);
      if (!session || sets.length === 0) return [];
      return [{
        date: shortDate(session.startedAt),
        maxWeight: Math.max(...sets.map((set) => set.weight)),
        estimated1RM: Math.max(...sets.map(oneRmForSet)),
        volume: exerciseSessionVolume(sets)
      }];
    });
  }, [exerciseId, state.sessionExercises, state.sessions, state.setLogs]);
}

function buildSessionSetGroups(state: { sessions: WorkoutSession[]; sessionExercises: ReturnType<typeof useIronLungStore.getState>["sessionExercises"]; setLogs: ReturnType<typeof useIronLungStore.getState>["setLogs"] }) {
  const groups: Record<string, ReturnType<typeof state.setLogs.slice>[]> = {};
  for (const session of state.sessions) {
    groups[session.id] = state.sessionExercises
      .filter((row) => row.workoutSessionId === session.id)
      .map((row) => state.setLogs.filter((setLog) => setLog.workoutSessionExerciseId === row.id));
  }
  return groups;
}

function findPreviousPerformance(exerciseId: string, currentSessionId: string, state: ReturnType<typeof useIronLungStore.getState>) {
  const previousRow = [...state.sessionExercises]
    .reverse()
    .find((row) => row.exerciseId === exerciseId && row.workoutSessionId !== currentSessionId);
  if (!previousRow) return "";
  const sets = state.setLogs.filter((set) => set.workoutSessionExerciseId === previousRow.id);
  if (!sets.length) return "";
  return sets.map((set) => `${set.weight}x${set.reps}`).join(", ");
}

function pickStateData(state: ReturnType<typeof useIronLungStore.getState>) {
  return {
    unitPreference: state.unitPreference,
    theme: state.theme,
    exercises: state.exercises,
    templates: state.templates,
    templateExercises: state.templateExercises,
    sessions: state.sessions,
    sessionExercises: state.sessionExercises,
    setLogs: state.setLogs,
    personalRecords: state.personalRecords,
    photos: state.photos,
    analyses: state.analyses
  };
}

const fieldClass = "h-10 rounded-lg border border-line bg-black/24 px-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-accent/70";

const tooltipStyle = {
  background: "#11131a",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "10px",
  color: "#fff"
};
