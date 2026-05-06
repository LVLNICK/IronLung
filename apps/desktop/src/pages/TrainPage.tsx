import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Copy, Dumbbell, Flame, Plus, Search, Trash2 } from "lucide-react";
import { exerciseSessionVolume, prLabel, setVolume, type PersonalRecord, type SetType, type WorkoutSession } from "@ironlung/core";
import { Card, MetricCard, SectionHeader } from "../components/cards/Card";
import { Button, IconButton, Input, Select, fieldClass } from "../components/forms/controls";
import { ScreenShell } from "../components/layout/ScreenShell";
import { EmptyState } from "../components/empty-states/EmptyState";
import { AnalyticsTable } from "../components/tables/AnalyticsTable";
import { ConfirmModal } from "../components/modals/ConfirmModal";
import { compactNumber, countNumber, dateTime, shortDate } from "../lib/format";
import { oneRmForSet, selectOpenSession, useIronLungStore } from "../lib/store";

type TrainTab = "Start Workout" | "Active Workout" | "Training Journal" | "Templates";

export function TrainPage() {
  const [tab, setTab] = useState<TrainTab>("Start Workout");
  const openSession = useIronLungStore(selectOpenSession);

  return (
    <ScreenShell title="Train" subtitle="Start workouts, log fast, review your training journal, and manage user-created templates.">
      <div className="inline-flex flex-wrap gap-2">
        {(["Start Workout", "Active Workout", "Training Journal", "Templates"] as TrainTab[]).map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === item ? "bg-electric text-white" : "border border-obsidian-strong bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.08)]"}`}>{item}</button>
        ))}
      </div>
      {tab === "Start Workout" && <StartWorkout onActive={() => setTab("Active Workout")} />}
      {tab === "Active Workout" && (openSession ? <ActiveWorkout session={openSession} /> : <Card><EmptyState icon={Dumbbell} title="No active workout" body="Start an empty workout or a user-created template." action={<Button onClick={() => setTab("Start Workout")}>Start workout</Button>} /></Card>)}
      {tab === "Training Journal" && <TrainingJournal onEdit={() => setTab("Active Workout")} />}
      {tab === "Templates" && <Templates />}
    </ScreenShell>
  );
}

function StartWorkout({ onActive }: { onActive: () => void }) {
  const state = useIronLungStore();
  const openSession = selectOpenSession(state);
  const recentExercises = [...state.sessionExercises].reverse().map((row) => state.exercises.find((exercise) => exercise.id === row.exerciseId)).filter(Boolean).slice(0, 8);

  return (
    <div className="grid grid-cols-[1fr_.9fr] gap-5">
      <Card>
        <SectionHeader title="Start Workout" icon={Flame} />
        <div className="grid grid-cols-2 gap-3">
          {openSession ? (
            <Button icon={Flame} onClick={onActive}>Resume active workout</Button>
          ) : (
            <Button icon={Plus} onClick={() => { state.startWorkout(); onActive(); }}>Start empty workout</Button>
          )}
          <Button variant="ghost" icon={Dumbbell} onClick={() => { state.startWorkout(state.templates[0]?.id); onActive(); }} disabled={!state.templates.length || Boolean(openSession)}>Start recent template</Button>
        </div>
        {openSession && <div className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-sm text-yellow-300">Finish or discard the active workout before starting another one.</div>}
        <div className="mt-5 grid gap-2">
          {state.templates.slice(-6).reverse().map((template) => (
            <button key={template.id} onClick={() => { state.startWorkout(template.id); onActive(); }} className="group flex w-full flex-col items-start rounded-lg border border-obsidian-strong bg-obsidian-700 p-3 text-left transition-colors hover:border-electric hover:bg-obsidian-600">
              <div className="text-sm font-semibold text-white transition-colors group-hover:text-electric">{template.name}</div>
              <div className="mt-0.5 text-xs text-[rgba(255,255,255,0.5)]">{state.templateExercises.filter((row) => row.workoutTemplateId === template.id).length} exercises</div>
            </button>
          ))}
          {!state.templates.length && <EmptyState icon={Dumbbell} title="No templates yet" body="Create your own templates. No premade plans exist in IronLung." />}
        </div>
      </Card>
      <Card>
        <SectionHeader title="Recent Exercises" icon={Search} />
        <div className="grid grid-cols-2 gap-2">
          {recentExercises.map((exercise) => exercise && (
            <div key={exercise.id} className="rounded-xl border border-obsidian-strong bg-obsidian-700 p-3">
              <div className="font-medium">{exercise.name}</div>
              <div className="text-sm text-obsidian-muted">{exercise.primaryMuscle}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ActiveWorkout({ session }: { session: WorkoutSession }) {
  const state = useIronLungStore();
  const [exerciseId, setExerciseId] = useState("");
  const [notes, setNotes] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const rows = state.sessionExercises.filter((row) => row.workoutSessionId === session.id).sort((a, b) => a.orderIndex - b.orderIndex);
  const sets = rows.flatMap((row) => state.setLogs.filter((set) => set.workoutSessionExerciseId === row.id));
  const volume = compactNumber(sets.reduce((total, set) => total + setVolume(set.weight, set.reps), 0));
  const workoutPrs = state.personalRecords.filter((record) => record.workoutSessionId === session.id);
  const bestOneRm = Math.max(0, ...sets.map(oneRmForSet));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-6 gap-4">
        <MetricCard label="Workout volume" value={volume} hint="current" />
        <MetricCard label="Sets" value={countNumber(sets.length)} hint="logged" />
        <MetricCard label="Exercises" value={countNumber(rows.length)} hint="active" />
        <MetricCard label="Workout PRs" value={countNumber(workoutPrs.length)} hint="current" tone={workoutPrs.length ? "good" : "default"} />
        <MetricCard label="Best e1RM" value={bestOneRm ? compactNumber(bestOneRm) : "--"} hint="current" />
        <MetricCard label="Started" value={shortDate(session.startedAt)} hint={session.name} />
      </div>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <SectionHeader title={session.name} icon={Dumbbell} />
          <div className="flex gap-2">
            <Select value={exerciseId} onChange={setExerciseId}>
              <option value="">Add exercise</option>
              {state.exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
            </Select>
            <Button onClick={() => { if (exerciseId) state.addExerciseToSession(session.id, exerciseId); setExerciseId(""); }} icon={Plus}>Add</Button>
            <Button variant="danger" icon={Trash2} onClick={() => setDiscardOpen(true)}>Discard</Button>
          </div>
        </div>
      </Card>
      {rows.map((row) => {
        const exercise = state.exercises.find((item) => item.id === row.exerciseId);
        return exercise ? <LoggerExercise key={row.id} session={session} sessionExerciseId={row.id} exerciseId={exercise.id} /> : null;
      })}
      {!rows.length && <Card><EmptyState icon={Plus} title="Add an exercise to begin" body="Fast set entry appears once an exercise is added." /></Card>}
      <Card>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Input placeholder="Finish notes" value={notes} onChange={setNotes} />
          <Button icon={CheckCircle2} onClick={() => state.finishWorkout(session.id, notes)}>Finish workout</Button>
        </div>
        {!!workoutPrs.length && (
          <div className="mt-3 flex flex-wrap gap-2">
            {workoutPrs.slice(-8).map((record) => <span key={record.id} className="inline-block rounded-md bg-electric-muted px-2.5 py-0.5 text-xs font-semibold text-electric">{prLabel(record.type)} - {record.importance ?? "legacy"}</span>)}
          </div>
        )}
      </Card>
      {discardOpen && <ConfirmModal title="Discard active workout?" body="This deletes the active workout, logged sets, and PRs created during this session." confirmLabel="Discard workout" onCancel={() => setDiscardOpen(false)} onConfirm={() => { state.deleteWorkout(session.id); setDiscardOpen(false); }} />}
    </div>
  );
}

function LoggerExercise({ session, sessionExerciseId, exerciseId }: { session: WorkoutSession; sessionExerciseId: string; exerciseId: string }) {
  const state = useIronLungStore();
  const exercise = state.exercises.find((item) => item.id === exerciseId)!;
  const sets = state.setLogs.filter((set) => set.workoutSessionExerciseId === sessionExerciseId);
  const previous = findPreviousPerformance(exerciseId, session.id);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [notes, setNotes] = useState("");
  const [setType, setSetType] = useState<SetType>("working");
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const repsRef = useRef<HTMLInputElement | null>(null);
  const weightRef = useRef<HTMLInputElement | null>(null);
  const weightStep = state.unitPreference === "kg" ? 2.5 : 5;
  const parsedWeight = Number(weight);
  const parsedReps = Number(reps);
  const parsedRpe = rpe ? Number(rpe) : null;
  const canSubmit = Number.isFinite(parsedWeight) && parsedWeight >= 0 && Number.isFinite(parsedReps) && parsedReps > 0 && Number.isInteger(parsedReps) && (parsedRpe === null || (Number.isFinite(parsedRpe) && parsedRpe >= 0 && parsedRpe <= 10));

  function submit() {
    if (!canSubmit) return;
    const result = state.logSet({
      workoutSessionExerciseId: sessionExerciseId,
      exerciseId,
      workoutSessionId: session.id,
      weight: parsedWeight,
      reps: parsedReps,
      rpe: parsedRpe,
      setType,
      notes
    });
    setRecords(result);
    setReps("");
    setNotes("");
    weightRef.current?.focus();
  }

  function useLast() {
    const last = sets.at(-1);
    if (!last) return;
    setWeight(String(last.weight));
    setReps(String(last.reps));
    setRpe(last.rpe ? String(last.rpe) : "");
    setSetType(last.setType);
    repsRef.current?.focus();
  }

  function duplicateLast() {
    const last = sets.at(-1);
    if (!last) return;
    const result = state.logSet({
      workoutSessionExerciseId: sessionExerciseId,
      exerciseId,
      workoutSessionId: session.id,
      weight: last.weight,
      reps: last.reps,
      rpe: last.rpe,
      setType: last.setType,
      notes: last.notes
    });
    setRecords(result);
    weightRef.current?.focus();
  }

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="text-xl font-semibold text-white">{exercise.name}</div>
          <div className="text-sm text-obsidian-muted">{exercise.primaryMuscle} - previous: {previous || "no prior sets"}</div>
        </div>
        <RestTimer seconds={120} />
      </div>
      <div className="space-y-2">
        {sets.map((set) => (
          <div key={set.id} className="grid grid-cols-[70px_1fr_1fr_1fr_1fr_1fr_auto] items-center rounded-lg bg-obsidian-700 p-2 font-mono text-sm text-white/70">
            <span>#{countNumber(set.setNumber)}</span><span>{set.weight} {state.unitPreference}</span><span>{countNumber(set.reps)} reps</span><span>{set.rpe ?? "--"}</span><span>{set.setType}</span><span>e1RM {compactNumber(oneRmForSet(set))}</span><IconButton label="Delete set" icon={Trash2} variant="danger" onClick={() => state.deleteSet(set.id)} />
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-[80px_1fr_1fr_1fr_1.1fr_1fr_auto] items-center gap-2">
        <span className="text-sm text-obsidian-muted">Next</span>
        <input ref={weightRef} className={fieldClass} inputMode="decimal" placeholder={`Weight ${state.unitPreference}`} value={weight} onChange={(event) => setWeight(event.target.value)} onKeyDown={(event) => event.key === "Enter" && repsRef.current?.focus()} />
        <input ref={repsRef} className={fieldClass} inputMode="numeric" placeholder="5" value={reps} onChange={(event) => setReps(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} />
        <input className={fieldClass} inputMode="decimal" placeholder="8" value={rpe} onChange={(event) => setRpe(event.target.value)} />
        <select className={fieldClass} value={setType} onChange={(event) => setSetType(event.target.value as SetType)}>
          <option value="warmup">warmup</option><option value="working">working</option><option value="drop">drop set</option><option value="failure">failure</option><option value="amrap">AMRAP</option>
        </select>
        <Input placeholder="Note" value={notes} onChange={setNotes} />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setWeight(String(Math.max(0, Number(weight || 0) - weightStep)))}>-{weightStep}</Button>
          <Button variant="ghost" onClick={() => setWeight(String(Number(weight || 0) + weightStep))}>+{weightStep}</Button>
          <IconButton label="Same as last set" icon={Copy} onClick={useLast} />
          <Button variant="ghost" onClick={duplicateLast} disabled={!sets.length}>Duplicate</Button>
          <IconButton label="Log set" icon={CheckCircle2} onClick={submit} />
        </div>
      </div>
      {!canSubmit && (weight || reps || rpe) && <div className="mt-2 text-xs text-yellow-300">Enter a valid weight, whole-number reps, and optional RPE from 0-10.</div>}
      {!!records.length && <div className="mt-4 flex flex-wrap gap-2">{records.map((record) => <span key={record.id} className="inline-block rounded-md bg-electric-muted px-2.5 py-0.5 text-xs font-semibold text-electric">PR - {prLabel(record.type)} {record.value}</span>)}</div>}
    </Card>
  );
}

function RestTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const minutes = Math.floor(remaining / 60);
  const secs = String(remaining % 60).padStart(2, "0");

  return (
    <button type="button" onClick={() => setRunning((value) => !value)} onDoubleClick={() => { setRemaining(seconds); setRunning(false); }} className="rounded-lg border border-obsidian-strong bg-obsidian-700 px-3 py-2 text-sm font-semibold text-obsidian-muted hover:border-electric hover:bg-obsidian-600 hover:text-white">
      Rest {minutes}:{secs} {running ? "pause" : "start"}
    </button>
  );
}

function TrainingJournal({ onEdit }: { onEdit: () => void }) {
  const state = useIronLungStore();
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const sessions = [...state.sessions]
    .filter((session) => session.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return (
    <Card>
      <SectionHeader title="Training Journal" icon={CalendarDays} action={<Input placeholder="Search workouts" value={query} onChange={setQuery} />} />
      <AnalyticsTable headers={["Date", "Workout", "Exercises", "Sets", "Volume", "Avg RPE", "PRs", ""]} rows={sessions.map((session) => {
        const rows = state.sessionExercises.filter((row) => row.workoutSessionId === session.id);
        const sets = rows.flatMap((row) => state.setLogs.filter((set) => set.workoutSessionExerciseId === row.id));
        const rpes = sets.map((set) => set.rpe).filter((value): value is number => typeof value === "number");
        return [dateTime(session.startedAt), session.name, rows.length, sets.length, compactNumber(exerciseSessionVolume(sets)), rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : "--", state.personalRecords.filter((record) => record.workoutSessionId === session.id).length, "delete"];
      })} />
      {status && <div className="mt-3 rounded-xl border border-obsidian bg-obsidian-700 p-3 text-sm text-obsidian-muted">{status}</div>}
      <div className="mt-3 grid gap-2">
        {sessions.slice(0, 20).map((session) => (
          <div key={session.id} className="flex items-center justify-between gap-3 rounded-xl border border-obsidian-strong bg-obsidian-700 p-3">
            <div>
              <div className="font-medium text-white">{session.name}</div>
              <div className="text-sm text-obsidian-muted">{shortDate(session.startedAt)}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => {
                try {
                  state.reopenWorkout(session.id);
                  setStatus("");
                  onEdit();
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Could not edit workout.");
                }
              }}>Edit</Button>
              <Button variant="danger" icon={Trash2} onClick={() => setDeleteId(session.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
      {deleteId && <ConfirmModal title="Delete workout?" body="This removes the workout, its sets, and related PR records from local storage." confirmLabel="Delete" onCancel={() => setDeleteId(null)} onConfirm={() => { state.deleteWorkout(deleteId); setDeleteId(null); }} />}
    </Card>
  );
}

function Templates() {
  const state = useIronLungStore();
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState(state.templates[0]?.id ?? "");
  const [exerciseId, setExerciseId] = useState("");
  const selected = state.templates.find((template) => template.id === selectedId) ?? state.templates[0];

  return (
    <div className="grid grid-cols-[360px_1fr] gap-5">
      <Card>
        <SectionHeader title="Templates" icon={Dumbbell} />
        <div className="grid gap-2">
          <Input placeholder="Template name" value={name} onChange={setName} />
          <Button icon={Plus} onClick={() => { if (!name.trim()) return; const template = state.createTemplate(name.trim()); setSelectedId(template.id); setName(""); }}>Create template</Button>
        </div>
        <div className="mt-5 space-y-2">
          {state.templates.map((template) => <button key={template.id} onClick={() => setSelectedId(template.id)} className={`w-full rounded-lg border p-3 text-left text-sm font-semibold text-white transition-colors hover:text-electric ${selected?.id === template.id ? "border-electric bg-electric-muted" : "border-obsidian-strong bg-obsidian-700 hover:border-electric hover:bg-obsidian-600"}`}>{template.name}</button>)}
        </div>
      </Card>
      <Card>
        {selected ? (
          <>
            <SectionHeader title={selected.name} icon={Dumbbell} action={<div className="flex gap-2"><Button variant="ghost" onClick={() => state.duplicateTemplate(selected.id)}>Duplicate</Button><Button variant="danger" onClick={() => state.deleteTemplate(selected.id)}>Delete</Button></div>} />
            <div className="mb-4 grid grid-cols-[1fr_auto] gap-2">
              <Select value={exerciseId} onChange={setExerciseId}>
                <option value="">Add exercise</option>
                {state.exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
              </Select>
              <Button onClick={() => { if (exerciseId) state.addTemplateExercise(selected.id, exerciseId, {}); setExerciseId(""); }}>Add</Button>
            </div>
            <div className="space-y-2">
              {state.templateExercises.filter((row) => row.workoutTemplateId === selected.id).sort((a, b) => a.orderIndex - b.orderIndex).map((row) => {
                const exercise = state.exercises.find((item) => item.id === row.exerciseId);
                return <div key={row.id} className="grid grid-cols-[1fr_90px_110px_110px_auto] items-center gap-2 rounded-xl border border-obsidian-strong bg-obsidian-700 p-3"><div>{exercise?.name}</div><Input value={String(row.targetSets)} onChange={(value) => state.updateTemplateExercise(row.id, { targetSets: Number(value) || 0 })} placeholder="sets" /><Input value={row.targetReps} onChange={(value) => state.updateTemplateExercise(row.id, { targetReps: value })} placeholder="reps" /><Input value={String(row.targetRestSeconds)} onChange={(value) => state.updateTemplateExercise(row.id, { targetRestSeconds: Number(value) || 0 })} placeholder="rest" /><IconButton label="Remove" icon={Trash2} onClick={() => state.removeTemplateExercise(row.id)} /></div>;
              })}
            </div>
          </>
        ) : <EmptyState icon={Dumbbell} title="No template selected" body="Create a user-owned template to begin." />}
      </Card>
    </div>
  );
}

function findPreviousPerformance(exerciseId: string, currentSessionId: string) {
  const state = useIronLungStore.getState();
  const previousRow = [...state.sessionExercises].reverse().find((row) => row.exerciseId === exerciseId && row.workoutSessionId !== currentSessionId);
  if (!previousRow) return "";
  const sets = state.setLogs.filter((set) => set.workoutSessionExerciseId === previousRow.id);
  return sets.map((set) => `${set.weight}x${set.reps}`).join(", ");
}
