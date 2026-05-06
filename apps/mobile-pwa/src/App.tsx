import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Dumbbell, FileDown, FileUp, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { exerciseSessionVolume, setVolume, type SetType } from "@ironlung/core";
import { MobileShell } from "./components/MobileShell";
import { EmptyState, MobileButton, MobileCard, MobileInput, MobileSelect, MobileTextArea, StatPill } from "./components/MobilePrimitives";
import { addExerciseToSession, createExercise, finishWorkout, loadMobileSnapshot, logSet, saveSettings, softDeleteSession, startWorkout, type MobileSnapshot } from "./data/mobileRepository";
import { createMobileExportBundle } from "./data/mobileExport";
import { importMobileSeedBundle, validateMobileSeedBundle } from "./data/mobileImport";
import { deleteFromStore, putInStore } from "./data/mobileDb";
import type { MobileExercise, MobileWorkoutSession, MobileWorkoutSessionExercise } from "./data/mobileSyncTypes";
import type { MobileTab } from "./types";

export function App() {
  const [tab, setTab] = useState<MobileTab>("dashboard");
  const [snapshot, setSnapshot] = useState<MobileSnapshot | null>(null);
  const [status, setStatus] = useState("Loading local data...");
  const [loadError, setLoadError] = useState("");

  async function refresh() {
    setLoadError("");
    setStatus("Loading local data...");
    const next = await loadMobileSnapshot();
    setSnapshot(next);
    setStatus("Offline ready. Data stays on this phone.");
  }

  useEffect(() => {
    refresh().catch((error) => {
      const message = error instanceof Error ? error.message : "Could not load phone data.";
      setStatus(message);
      setLoadError(message);
    });
  }, []);

  if (!snapshot) {
    return (
      <main className="grid min-h-screen place-items-center bg-ink p-6 text-white">
        <MobileCard className="w-full max-w-sm text-center">
          <div className="text-lg font-black">Loading IronLung Mobile...</div>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{status}</p>
          {loadError && (
            <div className="mt-4 space-y-3">
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-left text-xs leading-relaxed text-red-100">
                Local phone storage did not open. Make sure the browser allows site storage, then retry. Private browsing can block persistent IndexedDB on some phones.
              </p>
              <MobileButton onClick={() => refresh().catch((error) => {
                const message = error instanceof Error ? error.message : "Could not load phone data.";
                setStatus(message);
                setLoadError(message);
              })}>Retry</MobileButton>
            </div>
          )}
        </MobileCard>
      </main>
    );
  }

  return (
    <MobileShell tab={tab} onTab={setTab}>
      {tab === "dashboard" && <DashboardPage snapshot={snapshot} />}
      {tab === "strength" && <StrengthPage snapshot={snapshot} />}
      {tab === "volume" && <VolumePage snapshot={snapshot} />}
      {tab === "muscles" && <MusclesPage snapshot={snapshot} />}
      {tab === "sync" && <SyncPage snapshot={snapshot} refresh={refresh} status={status} setStatus={setStatus} />}
    </MobileShell>
  );
}

function DashboardPage({ snapshot }: { snapshot: MobileSnapshot }) {
  const analytics = useMemo(() => buildMobileAnalytics(snapshot), [snapshot]);
  return (
    <div className="space-y-4">
      <MobileCard>
        <div className="text-sm font-bold uppercase tracking-wider text-electricText">Dashboard</div>
        <h1 className="mt-1 text-3xl font-black">Training overview</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">Import a desktop analytics seed to view your workout history on phone. This is read-only and local.</p>
      </MobileCard>
      <div className="grid grid-cols-3 gap-2">
        <StatPill label="Workouts" value={String(analytics.sessions.length)} />
        <StatPill label="Sets" value={String(analytics.sets.length)} />
        <StatPill label="Volume" value={formatNumber(analytics.totalVolume)} />
      </div>
      <MobileCard>
        <div className="mb-3 font-bold">Last 30 days</div>
        <div className="grid grid-cols-2 gap-2">
          <StatPill label="Sessions" value={String(analytics.recentSessions.length)} />
          <StatPill label="Volume" value={formatNumber(analytics.recentVolume)} />
        </div>
      </MobileCard>
      <MobileCard>
        <div className="mb-3 font-bold">Top muscles</div>
        <RankedBars rows={analytics.muscleRows.slice(0, 6)} unit={snapshot.settings.unitPreference} />
      </MobileCard>
      <MobileCard>
        <div className="mb-3 font-bold">Recent meaningful PRs</div>
        <div className="space-y-2">
          {analytics.recentPrs.slice(0, 5).map((record) => {
            const exercise = snapshot.exercises.find((item) => item.id === record.exerciseId);
            return (
              <div key={record.id} className="rounded-xl border border-electric bg-electric/10 p-3">
                <div className="text-xs font-bold uppercase tracking-wider text-white/50">{exercise?.name ?? "Exercise"}</div>
                <div className="mt-1 font-mono text-lg font-black">{formatPr(record.type)} - {formatNumber(record.value)} {record.unit}</div>
                <div className="text-xs text-white/45">{new Date(record.achievedAt).toLocaleDateString()}</div>
              </div>
            );
          })}
          {!analytics.recentPrs.length && <EmptyState icon={Dumbbell} title="No PRs imported yet" body="Export a fresh desktop analytics seed and import it from Sync." />}
        </div>
      </MobileCard>
    </div>
  );
}

function StrengthPage({ snapshot }: { snapshot: MobileSnapshot }) {
  const analytics = useMemo(() => buildMobileAnalytics(snapshot), [snapshot]);
  return (
    <div className="space-y-4">
      <MobileCard>
        <div className="text-sm font-bold uppercase tracking-wider text-electricText">Strength</div>
        <h1 className="mt-1 text-3xl font-black">Best lifts</h1>
      </MobileCard>
      {analytics.strengthRows.map((row) => (
        <MobileCard key={row.exerciseId}>
          <div className="font-bold">{row.exerciseName}</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatPill label="Max" value={`${formatNumber(row.maxWeight)}${snapshot.settings.unitPreference}`} />
            <StatPill label="e1RM" value={`${formatNumber(row.estimatedOneRm)}${snapshot.settings.unitPreference}`} />
            <StatPill label="Best set" value={row.bestSet} />
          </div>
        </MobileCard>
      ))}
      {!analytics.strengthRows.length && <EmptyState icon={Dumbbell} title="No strength data" body="Import desktop workout history from the Sync tab." />}
    </div>
  );
}

function VolumePage({ snapshot }: { snapshot: MobileSnapshot }) {
  const analytics = useMemo(() => buildMobileAnalytics(snapshot), [snapshot]);
  return (
    <div className="space-y-4">
      <MobileCard>
        <div className="text-sm font-bold uppercase tracking-wider text-electricText">Volume</div>
        <h1 className="mt-1 text-3xl font-black">Daily workload</h1>
      </MobileCard>
      <RankedBars rows={analytics.dailyRows.slice(0, 14)} unit={snapshot.settings.unitPreference} />
      {!analytics.dailyRows.length && <EmptyState icon={Dumbbell} title="No volume data" body="Import desktop workout history from the Sync tab." />}
    </div>
  );
}

function MusclesPage({ snapshot }: { snapshot: MobileSnapshot }) {
  const analytics = useMemo(() => buildMobileAnalytics(snapshot), [snapshot]);
  return (
    <div className="space-y-4">
      <MobileCard>
        <div className="text-sm font-bold uppercase tracking-wider text-electricText">Muscles</div>
        <h1 className="mt-1 text-3xl font-black">Volume balance</h1>
      </MobileCard>
      <RankedBars rows={analytics.muscleRows} unit={snapshot.settings.unitPreference} />
      {!analytics.muscleRows.length && <EmptyState icon={Dumbbell} title="No muscle data" body="Import desktop workout history from the Sync tab." />}
    </div>
  );
}

function TodayPage({ snapshot, refresh, openLog }: { snapshot: MobileSnapshot; refresh: () => Promise<void>; openLog: () => void }) {
  const active = selectActiveSession(snapshot);
  const finished = finishedSessions(snapshot);
  const recentExercises = snapshot.exercises.filter((exercise) => !exercise.deletedAt).slice(-6).reverse();
  const last = finished[0];

  async function startEmpty() {
    await startWorkout("Gym Workout", snapshot.settings);
    await refresh();
    openLog();
  }

  async function startTemplate(templateId: string) {
    const template = snapshot.templates.find((item) => item.id === templateId);
    const session = await startWorkout(template?.name ?? "Template Workout", snapshot.settings, templateId);
    const rows = snapshot.templateExercises.filter((row) => row.workoutTemplateId === templateId && !row.deletedAt);
    await Promise.all(rows.map((row, index) => addExerciseToSession(session.id, row.exerciseId, index, snapshot.settings)));
    await refresh();
    openLog();
  }

  return (
    <div className="space-y-4">
      <MobileCard>
        <div className="text-sm font-bold uppercase tracking-wider text-electricText">Today</div>
        <h1 className="mt-1 text-3xl font-black">Ready to train</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">Works offline. All workout data is stored locally on this phone.</p>
        <div className="mt-4 grid gap-2">
          {active ? <MobileButton onClick={openLog}>Resume active workout</MobileButton> : <MobileButton onClick={startEmpty}>Start empty workout</MobileButton>}
          {snapshot.templates.filter((template) => !template.deletedAt).slice(-3).reverse().map((template) => (
            <button key={template.id} onClick={() => startTemplate(template.id)} className="rounded-xl border border-line bg-panelSoft p-3 text-left">
              <div className="font-bold">{template.name}</div>
              <div className="text-xs text-white/45">Start user-created template</div>
            </button>
          ))}
        </div>
      </MobileCard>
      <div className="grid grid-cols-3 gap-2">
        <StatPill label="Exercises" value={String(snapshot.exercises.filter((item) => !item.deletedAt).length)} />
        <StatPill label="Workouts" value={String(finished.length)} />
        <StatPill label="Unsynced" value={String(snapshot.sessions.filter((item) => !item.deletedAt && item.importSource !== "desktop-mobile-import").length)} />
      </div>
      <MobileCard>
        <div className="mb-3 font-bold">Recent exercises</div>
        <div className="grid gap-2">
          {recentExercises.map((exercise) => <div key={exercise.id} className="rounded-xl bg-panelSoft p-3"><div className="font-semibold">{exercise.name}</div><div className="text-xs text-white/45">{exercise.primaryMuscle}</div></div>)}
          {!recentExercises.length && <EmptyState icon={Dumbbell} title="No exercises yet" body="Import a desktop seed bundle or create exercises on this phone." />}
        </div>
      </MobileCard>
      <MobileCard>
        <div className="mb-3 font-bold">Last workout</div>
        {last ? <WorkoutSummary session={last} snapshot={snapshot} /> : <p className="text-sm text-white/55">No finished mobile workouts yet.</p>}
      </MobileCard>
    </div>
  );
}

function LogPage({ snapshot, refresh }: { snapshot: MobileSnapshot; refresh: () => Promise<void> }) {
  const active = selectActiveSession(snapshot);
  const [exerciseId, setExerciseId] = useState("");
  const [finishNotes, setFinishNotes] = useState("");

  async function addExercise() {
    if (!active || !exerciseId) return;
    const count = snapshot.sessionExercises.filter((row) => row.workoutSessionId === active.id && !row.deletedAt).length;
    await addExerciseToSession(active.id, exerciseId, count, snapshot.settings);
    setExerciseId("");
    await refresh();
  }

  async function finish() {
    if (!active) return;
    await finishWorkout(active, snapshot.settings, finishNotes);
    setFinishNotes("");
    await refresh();
  }

  async function discard() {
    if (!active || !window.confirm("Discard active workout?")) return;
    await softDeleteSession(active, snapshot.settings);
    await refresh();
  }

  if (!active) return <MobileCard><EmptyState icon={Dumbbell} title="No active workout" body="Start a workout from Today." /></MobileCard>;
  const rows = snapshot.sessionExercises.filter((row) => row.workoutSessionId === active.id && !row.deletedAt).sort((a, b) => a.orderIndex - b.orderIndex);
  const sets = rows.flatMap((row) => snapshot.setLogs.filter((set) => set.workoutSessionExerciseId === row.id && !set.deletedAt));

  return (
    <div className="space-y-4">
      <MobileCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-electricText">Active workout</div>
            <h1 className="text-2xl font-black">{active.name}</h1>
          </div>
          <div className="font-mono text-sm text-white/55">{sets.length} sets</div>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <MobileSelect value={exerciseId} onChange={(event) => setExerciseId(event.target.value)}>
            <option value="">Add exercise</option>
            {snapshot.exercises.filter((exercise) => !exercise.deletedAt).map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
          </MobileSelect>
          <MobileButton onClick={addExercise}>Add</MobileButton>
        </div>
      </MobileCard>
      {rows.map((row) => <SetLogger key={row.id} row={row} snapshot={snapshot} refresh={refresh} />)}
      {!rows.length && <EmptyState icon={Plus} title="Add an exercise" body="Set logging appears after you add your first exercise." />}
      <MobileCard>
        <MobileTextArea placeholder="Finish notes" value={finishNotes} onChange={(event) => setFinishNotes(event.target.value)} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MobileButton variant="ghost" onClick={discard}>Discard</MobileButton>
          <MobileButton onClick={finish}>Finish workout</MobileButton>
        </div>
      </MobileCard>
    </div>
  );
}

function SetLogger({ row, snapshot, refresh }: { row: MobileWorkoutSessionExercise; snapshot: MobileSnapshot; refresh: () => Promise<void> }) {
  const exercise = snapshot.exercises.find((item) => item.id === row.exerciseId);
  const sets = snapshot.setLogs.filter((set) => set.workoutSessionExerciseId === row.id && !set.deletedAt).sort((a, b) => a.setNumber - b.setNumber);
  const previous = findPreviousPerformance(row.exerciseId, row.workoutSessionId, snapshot);
  const [weight, setWeight] = useState(sets.at(-1)?.weight ? String(sets.at(-1)?.weight) : "");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [setType, setSetType] = useState<SetType>("working");
  const [notes, setNotes] = useState("");
  const [prText, setPrText] = useState("");
  const repsRef = useRef<HTMLInputElement | null>(null);
  const step = snapshot.settings.unitPreference === "kg" ? 2.5 : 5;

  async function submit() {
    const parsedWeight = Number(weight);
    const parsedReps = Number(reps);
    const parsedRpe = rpe ? Number(rpe) : null;
    if (!Number.isFinite(parsedWeight) || !Number.isInteger(parsedReps) || parsedReps <= 0 || (parsedRpe !== null && (!Number.isFinite(parsedRpe) || parsedRpe < 0 || parsedRpe > 10))) return;
    const result = await logSet({ workoutSessionExerciseId: row.id, setNumber: sets.length + 1, weight: parsedWeight, reps: parsedReps, rpe: parsedRpe, setType, notes }, snapshot);
    setPrText(result.prs.length ? `${result.prs.length} PR${result.prs.length === 1 ? "" : "s"}` : "");
    setReps("");
    setNotes("");
    repsRef.current?.focus();
    await refresh();
  }

  function sameAsLast() {
    const last = sets.at(-1);
    if (!last) return;
    setWeight(String(last.weight));
    setReps(String(last.reps));
    setRpe(last.rpe ? String(last.rpe) : "");
    setSetType(last.setType);
    repsRef.current?.focus();
  }

  async function duplicateLast() {
    const last = sets.at(-1);
    if (!last) return;
    await logSet({ workoutSessionExerciseId: row.id, setNumber: sets.length + 1, weight: last.weight, reps: last.reps, rpe: last.rpe, setType: last.setType, notes: last.notes }, snapshot);
    await refresh();
  }

  async function deleteSet(id: string) {
    await deleteFromStore("setLogs", id);
    await refresh();
  }

  return (
    <MobileCard>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-lg font-black">{exercise?.name ?? "Exercise"}</div>
          <div className="text-xs text-white/45">{exercise?.primaryMuscle ?? "Unknown"}{previous ? ` - previous ${previous}` : ""}</div>
        </div>
        <RestTimer />
      </div>
      <div className="mt-4 space-y-2">
        {sets.map((set) => (
          <div key={set.id} className="grid grid-cols-[36px_1fr_1fr_auto] items-center gap-2 rounded-xl bg-panelSoft p-3 font-mono text-sm">
            <span>#{set.setNumber}</span>
            <span>{set.weight}{snapshot.settings.unitPreference}</span>
            <span>{set.reps} reps</span>
            <button onClick={() => deleteSet(set.id)} aria-label="Delete set" className="text-red-300"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MobileInput inputMode="decimal" placeholder={`Weight ${snapshot.settings.unitPreference}`} value={weight} onChange={(event) => setWeight(event.target.value)} />
        <MobileInput ref={repsRef} inputMode="numeric" placeholder="Reps" value={reps} onChange={(event) => setReps(event.target.value)} />
        <MobileInput inputMode="decimal" placeholder="RPE" value={rpe} onChange={(event) => setRpe(event.target.value)} />
      </div>
      <div className="mt-2 grid grid-cols-[1fr_1fr_1fr] gap-2">
        <MobileSelect value={setType} onChange={(event) => setSetType(event.target.value as SetType)}>
          <option value="warmup">warmup</option>
          <option value="working">working</option>
          <option value="drop">drop</option>
          <option value="failure">failure</option>
          <option value="amrap">AMRAP</option>
        </MobileSelect>
        <MobileButton variant="ghost" onClick={() => setWeight(String(Math.max(0, Number(weight || 0) - step)))}>-{step}</MobileButton>
        <MobileButton variant="ghost" onClick={() => setWeight(String(Number(weight || 0) + step))}>+{step}</MobileButton>
      </div>
      <div className="mt-2">
        <MobileInput placeholder="Quick note" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <MobileButton variant="ghost" onClick={sameAsLast}>Same</MobileButton>
        <MobileButton variant="ghost" onClick={duplicateLast}>Duplicate</MobileButton>
        <MobileButton onClick={submit}>Log</MobileButton>
      </div>
      {prText && <div className="mt-3 rounded-xl border border-electric bg-electric/15 p-3 text-center text-sm font-bold text-electricText">{prText}</div>}
    </MobileCard>
  );
}

function ExercisesPage({ snapshot, refresh }: { snapshot: MobileSnapshot; refresh: () => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [movementPattern, setMovementPattern] = useState("");
  const exercises = snapshot.exercises.filter((exercise) => !exercise.deletedAt && exercise.name.toLowerCase().includes(query.toLowerCase()));

  async function create() {
    if (!name.trim()) return;
    await createExercise({ name, primaryMuscle, equipment, movementPattern }, snapshot.settings);
    setName("");
    setPrimaryMuscle("");
    setEquipment("");
    setMovementPattern("");
    await refresh();
  }

  return (
    <div className="space-y-4">
      <MobileCard>
        <div className="flex items-center gap-2"><Search className="h-4 w-4 text-electricText" /><div className="font-bold">Exercises</div></div>
        <MobileInput className="mt-3 w-full" placeholder="Search exercises" value={query} onChange={(event) => setQuery(event.target.value)} />
      </MobileCard>
      <MobileCard>
        <div className="mb-3 font-bold">Create exercise</div>
        <div className="grid gap-2">
          <MobileInput placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
          <MobileInput placeholder="Primary muscle" value={primaryMuscle} onChange={(event) => setPrimaryMuscle(event.target.value)} />
          <MobileInput placeholder="Equipment" value={equipment} onChange={(event) => setEquipment(event.target.value)} />
          <MobileInput placeholder="Movement pattern" value={movementPattern} onChange={(event) => setMovementPattern(event.target.value)} />
          <MobileButton onClick={create}>Create</MobileButton>
        </div>
      </MobileCard>
      <div className="space-y-2">
        {exercises.map((exercise) => <ExerciseRow key={exercise.id} exercise={exercise} />)}
        {!exercises.length && <EmptyState icon={Search} title="No exercises" body="Import from desktop or create one here." />}
      </div>
    </div>
  );
}

function ExerciseRow({ exercise }: { exercise: MobileExercise }) {
  return <MobileCard><div className="font-bold">{exercise.name}</div><div className="mt-1 text-sm text-white/50">{exercise.primaryMuscle} - {exercise.equipment} - {exercise.movementPattern}</div></MobileCard>;
}

function HistoryPage({ snapshot, refresh }: { snapshot: MobileSnapshot; refresh: () => Promise<void> }) {
  const sessions = finishedSessions(snapshot);
  async function remove(session: MobileWorkoutSession) {
    if (!window.confirm("Delete this workout from phone storage?")) return;
    await softDeleteSession(session, snapshot.settings);
    await refresh();
  }
  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <MobileCard key={session.id}>
          <WorkoutSummary session={session} snapshot={snapshot} />
          <div className="mt-3 flex justify-end"><MobileButton variant="danger" onClick={() => remove(session)}>Delete</MobileButton></div>
        </MobileCard>
      ))}
      {!sessions.length && <EmptyState icon={Dumbbell} title="No history yet" body="Finished phone workouts will appear here." />}
    </div>
  );
}

function SyncPage({ snapshot, refresh, status, setStatus }: { snapshot: MobileSnapshot; refresh: () => Promise<void>; status: string; setStatus: (status: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  async function exportBundle() {
    const bundle = createMobileExportBundle(pickRecords(snapshot), snapshot.settings, snapshot.operationLog);
    const text = JSON.stringify(bundle, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const file = new File([blob], `ironlung-mobile-${new Date().toISOString().slice(0, 10)}.ironlung-mobile.json`, { type: "application/json" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "IronLung mobile export" });
    } else {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(link.href);
    }
    await saveSettings({ ...snapshot.settings, lastExportedAt: bundle.exportedAt });
    await refresh();
    setStatus("Mobile export created. IronLung did not upload it anywhere.");
  }

  async function importSeed(file?: File) {
    if (!file) return;
    try {
      const bundle = validateMobileSeedBundle(JSON.parse(await file.text()));
      const summary = await importMobileSeedBundle(bundle, snapshot.settings);
      await refresh();
      setStatus(`Analytics seed imported: ${summary.exercisesCreated} exercises, ${summary.templatesImported} templates, ${summary.blocksImported} blocks.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import seed bundle.");
    }
  }

  return (
    <div className="space-y-4">
      <MobileCard>
        <div className="text-lg font-black">No-cloud analytics sync</div>
        <p className="mt-2 text-sm leading-relaxed text-white/60">Import a desktop analytics seed to view your IronLung history on phone. Export remains local and is not uploaded anywhere by IronLung.</p>
        <div className="mt-4 grid gap-2">
          <MobileButton onClick={exportBundle}><FileDown className="mr-2 inline h-4 w-4" />Export mobile bundle</MobileButton>
          <MobileButton variant="ghost" onClick={() => inputRef.current?.click()}><FileUp className="mr-2 inline h-4 w-4" />Import desktop analytics seed</MobileButton>
          <input ref={inputRef} className="hidden" type="file" accept=".json,.ironlung-mobile-seed.json,application/json" onChange={(event) => importSeed(event.target.files?.[0])} />
        </div>
      </MobileCard>
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Workouts" value={String(snapshot.sessions.filter((item) => !item.deletedAt).length)} />
        <StatPill label="Sets" value={String(snapshot.setLogs.filter((item) => !item.deletedAt).length)} />
      </div>
      <MobileCard>
        <div className="font-bold">Status</div>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{status}</p>
        <p className="mt-2 text-xs leading-relaxed text-white/45">Last export: {snapshot.settings.lastExportedAt ? new Date(snapshot.settings.lastExportedAt).toLocaleString() : "Never"}</p>
      </MobileCard>
    </div>
  );
}

function RestTimer() {
  const [seconds, setSeconds] = useState(120);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) {
        setRunning(false);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return (
    <button onClick={() => setRunning((value) => !value)} onDoubleClick={() => { setSeconds(120); setRunning(false); }} className="rounded-xl border border-line bg-panelSoft px-3 py-2 font-mono text-xs">
      <RotateCcw className="mr-1 inline h-3 w-3" />{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
    </button>
  );
}

function WorkoutSummary({ session, snapshot }: { session: MobileWorkoutSession; snapshot: MobileSnapshot }) {
  const rows = snapshot.sessionExercises.filter((row) => row.workoutSessionId === session.id && !row.deletedAt);
  const sets = rows.flatMap((row) => snapshot.setLogs.filter((set) => set.workoutSessionExerciseId === row.id && !set.deletedAt));
  return (
    <div>
      <div className="font-bold">{session.name}</div>
      <div className="mt-1 text-xs text-white/45">{new Date(session.startedAt).toLocaleString()}</div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatPill label="Exercises" value={String(rows.length)} />
        <StatPill label="Sets" value={String(sets.length)} />
        <StatPill label="Volume" value={String(exerciseSessionVolume(sets))} />
      </div>
    </div>
  );
}

function RankedBars({ rows, unit }: { rows: Array<{ label: string; value: number }>; unit: string }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border border-line bg-panelSoft p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="truncate text-sm font-bold">{row.label}</div>
            <div className="font-mono text-xs text-white/60">{formatNumber(row.value)} {unit}</div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-electric" style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function buildMobileAnalytics(snapshot: MobileSnapshot) {
  const sessions = finishedSessions(snapshot);
  const sessionExercisesById = new Map(snapshot.sessionExercises.map((row) => [row.id, row]));
  const exercisesById = new Map(snapshot.exercises.map((exercise) => [exercise.id, exercise]));
  const sets = snapshot.setLogs.filter((set) => !set.deletedAt && set.isCompleted);
  const totalVolume = sets.reduce((sum, set) => sum + setVolume(set.weight, set.reps), 0);
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentSessionIds = new Set(sessions.filter((session) => new Date(session.startedAt).getTime() >= cutoff).map((session) => session.id));
  const recentSets = sets.filter((set) => {
    const row = sessionExercisesById.get(set.workoutSessionExerciseId);
    return row ? recentSessionIds.has(row.workoutSessionId) : false;
  });
  const recentVolume = recentSets.reduce((sum, set) => sum + setVolume(set.weight, set.reps), 0);
  const muscleVolume = new Map<string, number>();
  const dailyVolume = new Map<string, number>();
  const strength = new Map<string, { exerciseId: string; exerciseName: string; maxWeight: number; estimatedOneRm: number; bestSet: string }>();

  for (const set of sets) {
    const row = sessionExercisesById.get(set.workoutSessionExerciseId);
    const exercise = row ? exercisesById.get(row.exerciseId) : undefined;
    const session = row ? snapshot.sessions.find((item) => item.id === row.workoutSessionId) : undefined;
    const volume = setVolume(set.weight, set.reps);
    const muscle = exercise?.primaryMuscle || "Unknown";
    muscleVolume.set(muscle, (muscleVolume.get(muscle) ?? 0) + volume);
    if (session) {
      const day = new Date(session.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      dailyVolume.set(day, (dailyVolume.get(day) ?? 0) + volume);
    }
    if (exercise) {
      const e1rm = set.weight * (1 + set.reps / 30);
      const current = strength.get(exercise.id);
      if (!current || e1rm > current.estimatedOneRm) {
        strength.set(exercise.id, {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          maxWeight: Math.max(current?.maxWeight ?? 0, set.weight),
          estimatedOneRm: e1rm,
          bestSet: `${set.weight}x${set.reps}`
        });
      } else if (set.weight > current.maxWeight) {
        current.maxWeight = set.weight;
      }
    }
  }

  return {
    sessions,
    sets,
    totalVolume,
    recentSessions: sessions.filter((session) => new Date(session.startedAt).getTime() >= cutoff),
    recentVolume,
    recentPrs: snapshot.personalRecords
      .filter((record) => !record.deletedAt && record.importance !== "baseline")
      .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt)),
    muscleRows: [...muscleVolume.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    dailyRows: [...dailyVolume.entries()].map(([label, value]) => ({ label, value })).reverse(),
    strengthRows: [...strength.values()].sort((a, b) => b.estimatedOneRm - a.estimatedOneRm)
  };
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString();
}

function formatPr(type: string) {
  return type.replace(/_/g, " ");
}

function selectActiveSession(snapshot: MobileSnapshot) {
  return snapshot.sessions.find((session) => !session.finishedAt && !session.deletedAt);
}

function finishedSessions(snapshot: MobileSnapshot) {
  return snapshot.sessions.filter((session) => session.finishedAt && !session.deletedAt).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

function pickRecords(snapshot: MobileSnapshot) {
  return {
    exercises: snapshot.exercises,
    sessions: snapshot.sessions,
    sessionExercises: snapshot.sessionExercises,
    setLogs: snapshot.setLogs,
    personalRecords: snapshot.personalRecords,
    trainingBlocks: snapshot.trainingBlocks,
    templates: snapshot.templates,
    templateExercises: snapshot.templateExercises
  };
}

function findPreviousPerformance(exerciseId: string, currentSessionId: string, snapshot: MobileSnapshot) {
  const row = [...snapshot.sessionExercises].reverse().find((item) => item.exerciseId === exerciseId && item.workoutSessionId !== currentSessionId && !item.deletedAt);
  if (!row) return "";
  return snapshot.setLogs.filter((set) => set.workoutSessionExerciseId === row.id && !set.deletedAt).map((set) => `${set.weight}x${set.reps}`).join(", ");
}
