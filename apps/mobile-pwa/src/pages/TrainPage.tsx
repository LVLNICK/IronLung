import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock, Copy, Dumbbell, List, MessageSquare, MoreHorizontal, Play, Plus, Trophy, Zap } from "lucide-react";
import { addSetToActiveMobileWorkout, ensureActiveMobileWorkout, finishActiveMobileWorkout, loadMobileSnapshot, setMobileSetCompleted, type MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel } from "../features/analytics/mobileAnalytics";
import type { MobileTab } from "../types";
import { EmptyMobileState, GlassCard, IconTile, MetricChip, MobileGhostButton, MobilePage, MobilePrimaryButton, SectionTitle, StatusPill } from "../components/MobilePrimitives";
import { formatNumber } from "./AnalyzerShared";

type LoggedSet = {
  id: string;
  set: number;
  weight: number;
  reps: number;
  rpe: number;
  e1rm: number;
  completed: boolean;
  pr?: boolean;
};

type WorkoutExercise = {
  id: string;
  name: string;
  muscles: string;
  targetSets: number;
  previousBest: string;
  lastTime: string;
  sets: LoggedSet[];
};

export function TrainPage({ snapshot, analyzer, onNavigate, onSnapshot }: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel; onNavigate: (tab: MobileTab) => void; onSnapshot: (snapshot: MobileSnapshot) => void }) {
  const [localSnapshot, setLocalSnapshot] = useState(snapshot);
  const [activeExerciseId, setActiveExerciseId] = useState("");
  const [nextWeight, setNextWeight] = useState(0);
  const [nextReps, setNextReps] = useState(8);
  const [nextRpe, setNextRpe] = useState(7);
  const [notice, setNotice] = useState("Phone-local workout ready");
  const [lastAddedPr, setLastAddedPr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [loggerOpen, setLoggerOpen] = useState(false);

  useEffect(() => {
    setLocalSnapshot(snapshot);
  }, [snapshot]);

  const exercises = useMemo(() => buildWorkoutExercises(localSnapshot, analyzer), [localSnapshot, analyzer]);
  const activeExercise = exercises.find((exercise) => exercise.id === activeExerciseId) ?? exercises[0];
  const visibleWorkout = useMemo(() => visibleMobileWorkoutSession(localSnapshot), [localSnapshot]);
  const hasActiveWorkout = Boolean(visibleWorkout && !visibleWorkout.finishedAt);
  const lastCompletedMobileWorkout = useMemo(() => latestCompletedMobileWorkout(localSnapshot), [localSnapshot]);

  useEffect(() => {
    if (!activeExerciseId && exercises[0]) setActiveExerciseId(exercises[0].id);
  }, [activeExerciseId, exercises]);

  useEffect(() => {
    if (!activeExercise) return;
    const last = activeExercise.sets.at(-1);
    if (last) {
      setNextWeight(last.weight);
      setNextReps(last.reps);
      setNextRpe(last.rpe);
    } else {
      const recent = analyzer.strengthRows.find((row) => row.exerciseId === activeExercise.id);
      setNextWeight(recent?.maxWeight ?? 0);
      setNextReps(8);
      setNextRpe(7);
    }
  }, [activeExercise?.id]);

  if (!exercises.length || !activeExercise) {
    return (
      <MobilePage>
        <header className="flex items-start justify-between pt-1">
          <button onClick={() => onNavigate("home")} aria-label="Back to Home" className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><ChevronLeft className="h-7 w-7 text-white" /></button>
          <div className="min-w-0 px-2 text-center">
            <div className="truncate text-2xl font-black leading-tight">Train</div>
            <div className="mt-1 text-sm text-slate-400">Start after importing exercises.</div>
          </div>
          <button onClick={() => onNavigate("settings")} aria-label="Open Data and Settings" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><MoreHorizontal className="h-5 w-5" /></button>
        </header>
        <GlassCard className="p-5">
          <div className="flex items-start gap-4">
            <IconTile icon={Dumbbell} size="large" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-400">Workout Launcher</div>
              <h1 className="mt-2 text-2xl font-black leading-tight text-white">Import exercises first</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                The Train page starts from a launcher, not an already-open workout. Import your desktop seed or Boostcamp history, then start a fresh phone-local workout here.
              </p>
            </div>
          </div>
          <MobilePrimaryButton onClick={() => onNavigate("settings")} className="mt-5 flex h-14 w-full items-center justify-center gap-3 text-base">
            <Plus className="h-5 w-5" />Open Import
          </MobilePrimaryButton>
        </GlassCard>
        <EmptyMobileState icon={Dumbbell} title="No exercises on this phone" body="Once your exercise library is imported, this page will show Start New Workout, Resume Active Workout, recent exercise choices, and workout context." />
      </MobilePage>
    );
  }

  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const completedSets = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0);
  const completedExercises = exercises.filter((exercise) => exercise.sets.filter((set) => set.completed).length >= exercise.targetSets).length;
  const volume = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).reduce((setSum, set) => setSum + set.weight * set.reps, 0), 0);
  const topE1rm = Math.max(0, ...exercises.flatMap((exercise) => exercise.sets.map((set) => set.e1rm)));
  const prCount = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.pr).length, 0);
  const progressPercent = Math.min(100, Math.round((completedExercises / exercises.length) * 100));

  const saveSnapshot = (next: MobileSnapshot) => {
    setLocalSnapshot(next);
    onSnapshot(next);
  };

  const openLogger = async () => {
    setSaving(true);
    try {
      await withSaveTimeout(ensureActiveMobileWorkout(localSnapshot.settings));
      const next = await withSaveTimeout(loadMobileSnapshot());
      saveSnapshot(next);
      setLoggerOpen(true);
      setFinished(false);
      setNotice("New phone-local workout started.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not start workout.");
    } finally {
      setSaving(false);
    }
  };

  const resumeLogger = () => {
    setLoggerOpen(true);
    setFinished(false);
    setNotice("Active phone-local workout resumed.");
  };

  if (!loggerOpen) {
    return (
      <TrainStartScreen
        analyzer={analyzer}
        exercises={exercises}
        hasActiveWorkout={hasActiveWorkout}
        lastWorkoutName={lastCompletedMobileWorkout?.name}
        onBack={() => onNavigate("home")}
        onImport={() => onNavigate("settings")}
        onResume={resumeLogger}
        onStart={() => void openLogger()}
        saving={saving}
        snapshot={localSnapshot}
      />
    );
  }

  const addSet = async (weight: number, reps: number, rpe: number, source: "add" | "repeat") => {
    setSaving(true);
    try {
      const result = await withSaveTimeout(addSetToActiveMobileWorkout(localSnapshot.settings, {
        exerciseId: activeExercise.id,
        weight: sanitizeWeight(weight),
        reps: sanitizeReps(reps),
        rpe: sanitizeRpe(rpe),
        setType: "working"
      }));
      saveSnapshot(result.snapshot);
      setNextWeight(result.setLog.weight);
      setNextReps(result.setLog.reps);
      setNextRpe(result.setLog.rpe ?? rpe);
      setLastAddedPr(result.personalRecords.some((record) => record.importance === "major" || record.importance === "medium"));
      setFinished(false);
      setNotice(result.personalRecords.length ? `Saved ${result.personalRecords.length} PR${result.personalRecords.length === 1 ? "" : "s"} locally.` : `${source === "repeat" ? "Repeated" : "Saved"} ${result.setLog.weight} lb x ${result.setLog.reps} locally.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save set locally.");
    } finally {
      setSaving(false);
    }
  };

  const copyLastSet = () => {
    const last = activeExercise.sets.at(-1);
    if (!last) {
      setNotice(`No previous ${activeExercise.name} set to copy.`);
      return;
    }
    setNextWeight(last.weight);
    setNextReps(last.reps);
    setNextRpe(last.rpe);
    setNotice(`Copied ${activeExercise.name} set ${last.set}.`);
  };

  const repeatLastSet = () => {
    const last = activeExercise.sets.at(-1);
    if (!last) {
      setNotice(`No previous ${activeExercise.name} set to repeat.`);
      return;
    }
    void addSet(last.weight, last.reps, last.rpe, "repeat");
  };

  const toggleSetCompletion = async (set: LoggedSet) => {
    setSaving(true);
    try {
      const next = await withSaveTimeout(setMobileSetCompleted(localSnapshot.settings, set.id, !set.completed));
      saveSnapshot(next);
      setNotice(`${activeExercise.name} set ${set.set} ${set.completed ? "unchecked" : "completed"} locally.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update set.");
    } finally {
      setSaving(false);
    }
  };

  const selectExercise = (exercise: WorkoutExercise) => {
    setActiveExerciseId(exercise.id);
    setLastAddedPr(false);
    setFinished(false);
    setExercisePickerOpen(false);
    setNotice(`${exercise.name} selected.`);
  };

  const finishWorkout = async () => {
    if (!hasActiveWorkout) {
      setFinished(true);
      setNotice("This workout is already finished. Add a set to start a new phone-local workout.");
      return;
    }
    setSaving(true);
    try {
      const next = await withSaveTimeout(finishActiveMobileWorkout(localSnapshot.settings));
      saveSnapshot(next);
      setFinished(true);
      setNotice(`Workout saved locally: ${completedSets} sets, ${formatNumber(volume)} lb volume, ${prCount} PR${prCount === 1 ? "" : "s"}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not finish workout.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobilePage>
      <header className="flex items-start justify-between pt-1">
        <button onClick={() => onNavigate("home")} aria-label="Back to Home" className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><ChevronLeft className="h-7 w-7 text-white" /></button>
        <div className="min-w-0 px-2 text-center">
          <div className="truncate text-xl font-black leading-tight min-[400px]:text-2xl">Mobile Workout</div>
          <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-400"><Clock className="h-4 w-4" />saved on phone</div>
        </div>
        <button onClick={() => setNotice("Workout actions are saved to phone-local storage.")} aria-label="Workout menu" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><MoreHorizontal className="h-5 w-5" /></button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusPill tone={finished || !hasActiveWorkout && totalSets > 0 ? "green" : "slate"}>{saving ? "Saving..." : notice}</StatusPill>
        {lastAddedPr && <StatusPill tone="green">New PR</StatusPill>}
      </div>

      <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-4">
        <TopMetric icon={Dumbbell} value={formatNumber(volume)} label="Volume" />
        <TopMetric icon={List} value={formatNumber(totalSets)} label="Sets" />
        <TopMetric icon={Trophy} value={formatNumber(prCount)} label="PRs" />
        <TopMetric icon={Zap} value={formatNumber(topE1rm)} label="e1RM" />
      </div>

      <div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.38)]" style={{ width: `${progressPercent}%` }} /></div>
        <div className="mt-2 flex justify-between text-sm text-slate-400"><span>{completedExercises} of {exercises.length} exercises</span><span>{progressPercent}%</span></div>
      </div>

      <GlassCard className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <IconTile icon={Dumbbell} size="large" />
            <div className="min-w-0">
              <div className="truncate text-2xl font-black">{activeExercise.name}</div>
              <div className="mt-1 text-sm text-slate-400">{activeExercise.muscles}</div>
            </div>
          </div>
          <button
            aria-expanded={exercisePickerOpen}
            aria-label="Open exercise dropdown"
            onClick={() => setExercisePickerOpen((open) => !open)}
            className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-blue-500/15 px-3 text-xs font-black text-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"
          >
            {activeExercise.sets.filter((set) => set.completed).length} / {activeExercise.targetSets}
            <ChevronDown className={`h-4 w-4 transition ${exercisePickerOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {exercisePickerOpen && (
          <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-black/20 p-2">
            {exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => selectExercise(exercise)}
                className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 ${exercise.id === activeExercise.id ? "bg-blue-500/18 text-blue-200" : "bg-white/[0.035] text-slate-200"}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black">{exercise.name}</span>
                  <span className="block truncate text-xs text-slate-400">{exercise.muscles}</span>
                </span>
                <StatusPill tone={exercise.sets.filter((set) => set.completed).length >= exercise.targetSets ? "green" : "slate"}>{exercise.sets.filter((set) => set.completed).length} / {exercise.targetSets}</StatusPill>
              </button>
            ))}
          </div>
        )}

        <button onClick={() => setNotice(`${activeExercise.name}: previous best ${activeExercise.previousBest}; last time ${activeExercise.lastTime}.`)} className="mt-4 grid min-h-[72px] w-full grid-cols-2 rounded-2xl border border-white/10 bg-black/15 p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">
          <div>
            <div className="text-xs text-slate-500">Previous best</div>
            <div className="mt-1 font-mono text-base">{activeExercise.previousBest}</div>
          </div>
          <div className="flex items-center justify-between border-l border-white/10 pl-4">
            <div className="min-w-0">
              <div className="text-xs text-slate-500">Last time</div>
              <div className="mt-1 truncate font-mono text-sm">{activeExercise.lastTime}</div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0" />
          </div>
        </button>

        <SetTable sets={activeExercise.sets} onToggle={toggleSetCompletion} />

        <GlassCard className="mt-5 border-blue-500/45 bg-blue-500/[0.06] p-4">
          <SectionTitle label="Next set" />
          <div className="grid grid-cols-1 gap-2 min-[370px]:grid-cols-3">
            <EntryBox label="Weight" value={nextWeight} unit="lb" min={0} step={5} onChange={(value) => setNextWeight(sanitizeWeight(value))} />
            <EntryBox label="Reps" value={nextReps} unit="reps" min={1} step={1} onChange={(value) => setNextReps(sanitizeReps(value))} />
            <EntryBox label="RPE" value={nextRpe} unit="RPE" min={0} max={10} step={0.5} onChange={(value) => setNextRpe(sanitizeRpe(value))} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 min-[400px]:grid-cols-4">
            <MobileGhostButton onClick={() => setNextWeight((value) => sanitizeWeight(value - 5))}>-5 lb</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextWeight((value) => sanitizeWeight(value + 5))}>+5 lb</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextReps((value) => sanitizeReps(value - 1))}>-1 rep</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextReps((value) => sanitizeReps(value + 1))}>+1 rep</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextRpe((value) => sanitizeRpe(value - 0.5))}>-0.5 RPE</MobileGhostButton>
            <MobileGhostButton onClick={() => setNextRpe((value) => sanitizeRpe(value + 0.5))}>+0.5 RPE</MobileGhostButton>
            <MobileGhostButton onClick={copyLastSet} className="flex items-center justify-center gap-2"><Copy className="h-4 w-4" />Copy</MobileGhostButton>
            <MobileGhostButton disabled={saving} onClick={repeatLastSet}>Repeat set</MobileGhostButton>
            <MobilePrimaryButton disabled={saving} onClick={() => void addSet(nextWeight, nextReps, nextRpe, "add")} className="col-span-2 min-[400px]:col-span-4">Add Set</MobilePrimaryButton>
          </div>
        </GlassCard>

        <div className="mt-4 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.035] py-3 text-sm text-slate-300">
          <button onClick={() => setNotice("Rest timer is local UI only for now; sets are saved.")} className="flex min-h-[44px] items-center justify-center gap-2"><Clock className="h-5 w-5" />Rest <span className="font-mono text-blue-400">01:22</span></button>
          <button onClick={() => setNotice("Notes are coming next; sets are saved locally now.")} className="flex min-h-[44px] items-center justify-center gap-2 border-l border-white/10"><MessageSquare className="h-5 w-5" />Note</button>
        </div>
      </GlassCard>

      <div className="space-y-3">
        {exercises.filter((exercise) => exercise.id !== activeExercise.id).map((exercise) => {
          const completed = exercise.sets.filter((set) => set.completed).length;
          const done = completed >= exercise.targetSets;
          return (
            <ExerciseDropdownCard
              key={exercise.id}
              exercise={exercise}
              done={done}
              expanded={expandedExerciseId === exercise.id}
              onToggle={() => setExpandedExerciseId((current) => current === exercise.id ? null : exercise.id)}
              onSelect={() => selectExercise(exercise)}
            />
          );
        })}
      </div>

      <MobilePrimaryButton disabled={saving} onClick={() => void finishWorkout()} className="sticky bottom-28 z-10 flex h-14 w-full items-center justify-center gap-3 text-lg">
        <Check className="h-5 w-5 rounded-full border border-white" />{hasActiveWorkout ? "Finish Workout" : "Workout Finished"}
      </MobilePrimaryButton>
    </MobilePage>
  );
}

function TrainStartScreen({
  analyzer,
  exercises,
  hasActiveWorkout,
  lastWorkoutName,
  onBack,
  onImport,
  onResume,
  onStart,
  saving,
  snapshot
}: {
  analyzer: MobileAnalyzerModel;
  exercises: WorkoutExercise[];
  hasActiveWorkout: boolean;
  lastWorkoutName?: string;
  onBack: () => void;
  onImport: () => void;
  onResume: () => void;
  onStart: () => void;
  saving: boolean;
  snapshot: MobileSnapshot;
}) {
  const recentExercises = exercises.slice(0, 5);
  const lastSession = latestImportedWorkout(snapshot);
  const weeklyVolume = analyzer.summary.totals.volume;
  const recentPr = analyzer.recentPrs.find((record) => record.importance === "major" || record.importance === "medium") ?? analyzer.recentPrs[0];

  return (
    <MobilePage>
      <header className="flex items-start justify-between pt-1">
        <button onClick={onBack} aria-label="Back to Home" className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><ChevronLeft className="h-7 w-7 text-white" /></button>
        <div className="min-w-0 px-2 text-center">
          <div className="truncate text-2xl font-black leading-tight">Train</div>
          <div className="mt-1 text-sm text-slate-400">Start when you are ready.</div>
        </div>
        <button onClick={onImport} aria-label="Open Data and Settings" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><MoreHorizontal className="h-5 w-5" /></button>
      </header>

      <GlassCard className="overflow-hidden p-5">
        <div className="flex items-start gap-4">
          <IconTile icon={Dumbbell} size="large" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-400">Workout Launcher</div>
            <h1 className="mt-2 text-2xl font-black leading-tight text-white">Choose how to train today</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Start a fresh phone-local workout, resume one you already opened, or review your imported desktop history first.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          {hasActiveWorkout && (
            <MobilePrimaryButton disabled={saving} onClick={onResume} className="flex h-14 w-full items-center justify-center gap-3 text-base">
              <Play className="h-5 w-5" />Resume Active Workout
            </MobilePrimaryButton>
          )}
          {!hasActiveWorkout ? (
            <MobilePrimaryButton disabled={saving} onClick={onStart} className="flex h-14 w-full items-center justify-center gap-3 text-base">
              <Plus className="h-5 w-5" />Start New Workout
            </MobilePrimaryButton>
          ) : (
            <MobileGhostButton disabled className="h-12 w-full">Finish the active workout before starting another</MobileGhostButton>
          )}
          <MobileGhostButton onClick={onImport} className="h-12 w-full">Import / Data Settings</MobileGhostButton>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-4">
        <TopMetric icon={Dumbbell} value={formatNumber(snapshot.exercises.filter((exercise) => !exercise.deletedAt).length)} label="Exercises" />
        <TopMetric icon={List} value={formatNumber(snapshot.setLogs.filter((set) => !set.deletedAt).length)} label="Sets" />
        <TopMetric icon={Trophy} value={formatNumber(analyzer.recentPrs.length)} label="PRs" />
        <TopMetric icon={Zap} value={formatNumber(weeklyVolume)} label="30D Vol" />
      </div>

      <GlassCard className="p-4">
        <SectionTitle label="Ready context" />
        <div className="space-y-2">
          <StartInfoRow label="Last imported workout" value={lastSession?.name ?? lastWorkoutName ?? "No imported sessions yet"} />
          <StartInfoRow label="Last phone workout" value={lastWorkoutName ?? "No phone workout finished yet"} />
          <StartInfoRow label="Best recent PR" value={recentPr ? `${recentPr.type.replaceAll("_", " ")} - ${formatNumber(recentPr.value)} ${recentPr.unit}` : "No recent meaningful PRs"} />
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <SectionTitle label="Quick exercise choices" />
        {recentExercises.length ? (
          <div className="space-y-2">
            {recentExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={onStart}
                className="flex min-h-[64px] w-full items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"
              >
                <IconTile icon={Dumbbell} tone="blue" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-black text-white">{exercise.name}</span>
                  <span className="mt-1 block truncate text-sm text-slate-400">{exercise.muscles}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        ) : (
          <EmptyMobileState icon={Dumbbell} title="No exercises imported" body="Import your desktop seed or Boostcamp history before starting a workout on this phone." actionLabel="Open Import" onAction={onImport} />
        )}
      </GlassCard>
    </MobilePage>
  );
}

function StartInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-3">
      <div className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</div>
      <div className="min-w-0 truncate text-right text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}

function buildWorkoutExercises(snapshot: MobileSnapshot, analyzer: MobileAnalyzerModel): WorkoutExercise[] {
  const exercisesById = new Map(snapshot.exercises.filter((exercise) => !exercise.deletedAt).map((exercise) => [exercise.id, exercise]));
  const rankedIds = [...analyzer.strengthRows.map((row) => row.exerciseId), ...snapshot.exercises.map((exercise) => exercise.id)];
  const uniqueIds = [...new Set(rankedIds)].filter((id) => exercisesById.has(id)).slice(0, 6);
  const displaySession = visibleMobileWorkoutSession(snapshot);
  const displayRows = snapshot.sessionExercises.filter((row) => !row.deletedAt && row.workoutSessionId === displaySession?.id);
  const prsBySetId = new Set(snapshot.personalRecords.filter((record) => !record.deletedAt && record.importSource === "mobile-workout").map((record) => record.setLogId).filter(Boolean));

  return uniqueIds.map((exerciseId) => {
    const exercise = exercisesById.get(exerciseId);
    if (!exercise) return null;
    const displayRow = displayRows.find((row) => row.exerciseId === exercise.id);
    const sets = displayRow
      ? snapshot.setLogs
        .filter((set) => !set.deletedAt && set.workoutSessionExerciseId === displayRow.id)
        .sort((a, b) => a.setNumber - b.setNumber)
        .map((set): LoggedSet => ({
          id: set.id,
          set: set.setNumber,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe ?? 0,
          e1rm: calculateE1rm(set.weight, set.reps),
          completed: set.isCompleted,
          pr: prsBySetId.has(set.id)
        }))
      : [];
    const history = historyForExercise(snapshot, exercise.id, displaySession?.id);
    return {
      id: exercise.id,
      name: exercise.name,
      muscles: [exercise.primaryMuscle, ...exercise.secondaryMuscles].filter(Boolean).slice(0, 3).join(", ") || "Custom exercise",
      targetSets: Math.max(sets.length, 3),
      previousBest: history.previousBest,
      lastTime: history.lastTime,
      sets
    };
  }).filter(Boolean) as WorkoutExercise[];
}

function visibleMobileWorkoutSession(snapshot: MobileSnapshot) {
  const mobileSessions = snapshot.sessions
    .filter((session) => !session.deletedAt && session.importSource === "mobile-pwa")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return mobileSessions.find((session) => !session.finishedAt) ?? mobileSessions[0] ?? null;
}

function latestCompletedMobileWorkout(snapshot: MobileSnapshot) {
  return snapshot.sessions
    .filter((session) => !session.deletedAt && Boolean(session.finishedAt) && session.importSource === "mobile-pwa")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
}

function latestImportedWorkout(snapshot: MobileSnapshot) {
  return snapshot.sessions
    .filter((session) => !session.deletedAt && session.importSource !== "mobile-pwa")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
}

function historyForExercise(snapshot: MobileSnapshot, exerciseId: string, activeSessionId?: string): { previousBest: string; lastTime: string } {
  const rows = snapshot.sessionExercises.filter((row) => !row.deletedAt && row.exerciseId === exerciseId);
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const sessionsById = new Map(snapshot.sessions.filter((session) => !session.deletedAt).map((session) => [session.id, session]));
  const historicalSets = snapshot.setLogs
    .filter((set) => {
      const row = rowById.get(set.workoutSessionExerciseId);
      return !set.deletedAt && set.isCompleted && row && row.workoutSessionId !== activeSessionId;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const best = [...historicalSets].sort((a, b) => calculateE1rm(b.weight, b.reps) - calculateE1rm(a.weight, a.reps))[0];
  const latestSessionId = historicalSets.map((set) => rowById.get(set.workoutSessionExerciseId)?.workoutSessionId).find(Boolean);
  const latestSets = latestSessionId
    ? historicalSets
      .filter((set) => rowById.get(set.workoutSessionExerciseId)?.workoutSessionId === latestSessionId)
      .sort((a, b) => a.setNumber - b.setNumber)
    : [];
  const latestSession = latestSessionId ? sessionsById.get(latestSessionId) : undefined;
  return {
    previousBest: best ? `${formatNumber(best.weight)} lb x ${best.reps}` : "No previous best",
    lastTime: latestSets.length ? `${latestSets.map((set) => `${formatNumber(set.weight)}x${set.reps}`).join(", ")}${latestSession ? ` (${new Date(latestSession.startedAt).toLocaleDateString()})` : ""}` : "No previous session"
  };
}

function calculateE1rm(weight: number, reps: number) {
  return Math.round(weight * (1 + reps / 30));
}

function sanitizeWeight(value: number) {
  return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
}

function sanitizeReps(value: number) {
  return Math.max(1, Math.round(Number.isFinite(value) ? value : 1));
}

function sanitizeRpe(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, Math.round(value * 2) / 2));
}

function withSaveTimeout<T>(operation: Promise<T>, timeoutMs = 4500): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Phone storage took too long. Try again after reopening the app.")), timeoutMs);
    operation.then((value) => {
      window.clearTimeout(timeout);
      resolve(value);
    }, (error) => {
      window.clearTimeout(timeout);
      reject(error);
    });
  });
}

function TopMetric({ icon, value, label }: { icon: typeof Dumbbell; value: string; label: string }) {
  return <MetricChip icon={icon} value={value} label={label} />;
}

function ExerciseDropdownCard({ exercise, done, expanded, onToggle, onSelect }: { exercise: WorkoutExercise; done: boolean; expanded: boolean; onToggle: () => void; onSelect: () => void }) {
  const completed = exercise.sets.filter((set) => set.completed).length;
  return (
    <GlassCard className="overflow-hidden p-0">
      <button onClick={onToggle} aria-expanded={expanded} className="flex min-h-[64px] w-full items-center gap-3 p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">
        <IconTile icon={Dumbbell} tone={done ? "green" : "slate"} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-black text-white">{exercise.name}</div>
          <div className="mt-1 truncate text-sm text-slate-400">{exercise.muscles}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill tone={done ? "green" : "slate"}>{completed} / {exercise.targetSets} sets</StatusPill>
          <ChevronDown className={`h-5 w-5 text-slate-300 transition ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>
      {expanded && (
        <div className="border-t border-white/10 bg-black/15 p-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-white/[0.045] p-3">
              <div className="text-xs font-bold text-slate-500">Previous best</div>
              <div className="mt-1 font-mono font-black text-white">{exercise.previousBest}</div>
            </div>
            <div className="rounded-xl bg-white/[0.045] p-3">
              <div className="text-xs font-bold text-slate-500">Last time</div>
              <div className="mt-1 truncate font-mono font-black text-white">{exercise.lastTime}</div>
            </div>
          </div>
          {exercise.sets.length > 0 && (
            <div className="mt-3 space-y-1">
              {exercise.sets.slice(-3).map((set) => (
                <div key={set.id} className="flex items-center justify-between rounded-xl bg-white/[0.035] px-3 py-2 font-mono text-sm text-slate-200">
                  <span>Set {set.set}</span>
                  <span>{set.weight} lb x {set.reps}</span>
                </div>
              ))}
            </div>
          )}
          <MobilePrimaryButton onClick={onSelect} className="mt-3 w-full">Log this exercise</MobilePrimaryButton>
        </div>
      )}
    </GlassCard>
  );
}

function SetTable({ sets, onToggle }: { sets: LoggedSet[]; onToggle: (set: LoggedSet) => void }) {
  if (!sets.length) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.035] p-4 text-center text-sm text-slate-400">
        No sets logged yet. Enter the next set below and tap Add Set.
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 grid grid-cols-[0.7fr_1.3fr_0.8fr_0.8fr_1.1fr_1.4rem] px-2 text-[0.58rem] font-black uppercase tracking-widest text-slate-500">
        <span>Set</span><span>Weight</span><span>Reps</span><span>RPE</span><span>e1RM</span><span />
      </div>
      <div className="mt-2 space-y-1.5">
        {sets.map((row) => (
          <button key={row.id} onClick={() => onToggle(row)} className={`grid min-h-[48px] w-full grid-cols-[0.7fr_1.3fr_0.8fr_0.8fr_1.1fr_1.4rem] items-center rounded-xl border border-white/10 px-2 py-3 text-left font-mono text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 ${row.pr ? "border-l-4 border-l-blue-500 bg-blue-500/10 text-blue-300" : row.completed ? "bg-black/12 text-slate-100" : "bg-white/[0.035] text-slate-500"}`}>
            <span className="font-black">{row.set}</span>
            <span className="font-bold">{row.weight} lb</span>
            <span>{row.reps}</span>
            <span>{row.rpe}</span>
            <span className="font-black">{row.e1rm}{row.pr ? " PR" : ""}</span>
            {row.completed ? <Check className="h-5 w-5 rounded-full border-2 border-emerald-400 p-0.5 text-emerald-400" /> : <Circle className="h-6 w-6 text-blue-500" />}
          </button>
        ))}
      </div>
    </>
  );
}

function EntryBox({ label, value, unit, min, max, step, onChange }: { label: string; value: number; unit: string; min: number; max?: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      <span className="mt-2 flex items-end gap-1">
        <input
          aria-label={label}
          className="min-h-[54px] min-w-0 flex-1 bg-transparent font-mono text-[2rem] font-black leading-none text-white outline-none focus:text-blue-300"
          inputMode="decimal"
          max={max}
          min={min}
          step={step}
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span className="pb-3 text-xs text-slate-400">{unit}</span>
      </span>
    </label>
  );
}
