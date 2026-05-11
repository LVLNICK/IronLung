import { useMemo, useState } from "react";
import { Check, Dumbbell, Filter, LibraryBig, Plus, Search, Trophy } from "lucide-react";
import { estimatedOneRepMax, resolveMuscleContributions } from "@ironlog/core";
import { saveMobileExercise, type MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel } from "../features/analytics/mobileAnalytics";
import { EmptyMobileState, GlassCard, IconTile, ListRow, MetricChip, MobileGhostButton, MobileHeader, MobilePage, MobilePrimaryButton, MobileSelect, SectionTitle, StatusPill } from "../components/MobilePrimitives";
import { formatNumber } from "./AnalyzerShared";

type ExerciseForm = {
  id?: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  movementPattern: string;
  isUnilateral: boolean;
  notes: string;
};

export function ExercisesPage({ snapshot, analyzer, onSnapshot }: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel; onSnapshot: (snapshot: MobileSnapshot) => void }) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("all");
  const [selectedId, setSelectedId] = useState(snapshot.exercises.find((exercise) => !exercise.deletedAt)?.id ?? "");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ExerciseForm>(() => emptyForm());
  const [status, setStatus] = useState("Exercise library is stored locally on this phone.");

  const rows = useMemo(() => buildExerciseRows(snapshot, analyzer), [snapshot, analyzer]);
  const muscleOptions = useMemo(() => {
    const names = new Set<string>();
    rows.forEach((row) => row.muscles.forEach((name) => names.add(name)));
    return [...names].sort();
  }, [rows]);
  const filteredRows = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [row.name, row.primaryMuscle, row.equipment, row.movementPattern].some((value) => value.toLowerCase().includes(q));
    const matchesMuscle = muscle === "all" || row.muscles.some((name) => name.toLowerCase() === muscle.toLowerCase());
    return matchesQuery && matchesMuscle;
  });
  const selected = rows.find((row) => row.id === selectedId) ?? filteredRows[0] ?? rows[0];

  const openCreate = () => {
    setForm(emptyForm());
    setEditing(true);
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      id: selected.id,
      name: selected.name,
      primaryMuscle: selected.primaryMuscle,
      equipment: selected.equipment,
      movementPattern: selected.movementPattern,
      isUnilateral: selected.isUnilateral,
      notes: selected.notes
    });
    setEditing(true);
  };

  const submitExercise = async () => {
    if (!form.name.trim()) {
      setStatus("Exercise name is required.");
      return;
    }
    const next = await saveMobileExercise(snapshot.settings, {
      ...form,
      secondaryMuscles: form.primaryMuscle ? [] : undefined
    });
    onSnapshot(next);
    const saved = next.exercises.find((exercise) => exercise.name.toLowerCase() === form.name.trim().toLowerCase());
    if (saved) setSelectedId(saved.id);
    setEditing(false);
    setStatus(`${form.name.trim()} saved locally. Export your mobile cache if you want to merge phone-created exercises back later.`);
  };

  if (!rows.length) {
    return (
      <MobilePage>
        <MobileHeader title="Exercises" subtitle="Search, inspect, and create your local exercise library." action={<MobilePrimaryButton onClick={openCreate} className="px-3"><Plus className="h-5 w-5" /></MobilePrimaryButton>} />
        {editing && <ExerciseEditor form={form} setForm={setForm} onCancel={() => setEditing(false)} onSave={() => void submitExercise()} />}
        <EmptyMobileState icon={LibraryBig} title="No exercises yet" body="Import desktop data or create a local exercise before logging workouts on mobile." />
      </MobilePage>
    );
  }

  return (
    <MobilePage>
      <MobileHeader title="Exercises" subtitle="Full exercise library, PRs, targets, history, and local edits." action={<MobilePrimaryButton onClick={openCreate} className="flex items-center gap-2 px-3"><Plus className="h-5 w-5" /><span className="hidden min-[390px]:inline">New</span></MobilePrimaryButton>} />

      <GlassCard className="p-3">
        <div className="grid gap-2">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises" className="min-h-[48px] w-full rounded-2xl border border-white/12 bg-black/20 pl-10 pr-3 text-base text-white outline-none placeholder:text-slate-500 focus:border-blue-400" />
          </label>
          <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-2">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.045]"><Filter className="h-5 w-5 text-blue-400" /></div>
            <MobileSelect value={muscle} onChange={(event) => setMuscle(event.target.value)}>
              <option value="all">All muscles</option>
              {muscleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </MobileSelect>
          </div>
        </div>
      </GlassCard>

      <div className="flex items-center justify-between gap-3 px-1">
        <StatusPill tone="slate">{filteredRows.length} shown</StatusPill>
        <StatusPill tone="blue">{rows.length} total</StatusPill>
      </div>

      <GlassCard className="p-3">
        <SectionTitle label="Library" />
        <div className="max-h-[24rem] space-y-2 overflow-y-auto pr-1">
          {filteredRows.map((row) => (
            <ListRow
              key={row.id}
              icon={Dumbbell}
              title={row.name}
              subtitle={`${row.primaryMuscle} • ${row.sets} sets • ${formatNumber(row.volume)} lb`}
              tone={row.id === selected?.id ? "blue" : "slate"}
              meta={<StatusPill tone={row.lastTrained === "Never" ? "yellow" : "green"}>{row.lastTrained}</StatusPill>}
              onClick={() => setSelectedId(row.id)}
            />
          ))}
          {!filteredRows.length && <p className="p-4 text-center text-sm text-slate-400">No exercises match that search.</p>}
        </div>
      </GlassCard>

      {selected && <ExerciseDetail row={selected} onEdit={openEdit} />}
      {editing && <ExerciseEditor form={form} setForm={setForm} onCancel={() => setEditing(false)} onSave={() => void submitExercise()} />}

      <GlassCard className="p-4">
        <SectionTitle label="Status" />
        <p className="text-sm leading-relaxed text-slate-300">{status}</p>
      </GlassCard>
    </MobilePage>
  );
}

function ExerciseDetail({ row, onEdit }: { row: ExerciseRow; onEdit: () => void }) {
  return (
    <GlassCard className="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <IconTile icon={Dumbbell} size="large" />
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black">{row.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{row.primaryMuscle} • {row.equipment} • {row.movementPattern}</p>
          </div>
        </div>
        <MobileGhostButton onClick={onEdit} className="px-3">Edit</MobileGhostButton>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricChip icon={Dumbbell} label="Sessions" value={formatNumber(row.sessions)} />
        <MetricChip icon={Check} label="Sets" value={formatNumber(row.sets)} />
        <MetricChip icon={Trophy} label="Best Set" value={row.bestSet} />
        <MetricChip icon={Trophy} label="e1RM" value={`${formatNumber(row.estimatedOneRm)} lb`} />
      </div>

      <div className="mt-4">
        <SectionTitle label="Muscle targets" />
        <div className="flex flex-wrap gap-2">
          {row.contributions.map((item) => <StatusPill key={item.muscle} tone={item.role === "primary" ? "blue" : "slate"}>{item.muscle} {Math.round(item.percent)}%</StatusPill>)}
        </div>
      </div>

      <div className="mt-4">
        <SectionTitle label="Recent PRs" />
        <div className="space-y-2">
          {row.prs.slice(0, 5).map((record) => (
            <div key={record.id} className="flex min-h-[52px] items-center justify-between gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-black capitalize">{record.type.replace(/_/g, " ")}</div>
                <div className="text-xs text-slate-400">{new Date(record.achievedAt).toLocaleDateString()}</div>
              </div>
              <div className="font-mono text-sm font-black text-blue-300">{formatNumber(record.value)} {record.unit}</div>
            </div>
          ))}
          {!row.prs.length && <p className="text-sm text-slate-400">No non-baseline PRs for this exercise yet.</p>}
        </div>
      </div>

      <div className="mt-4">
        <SectionTitle label="Notes" />
        <p className="text-sm leading-relaxed text-slate-400">{row.notes || "No notes yet."}</p>
      </div>
    </GlassCard>
  );
}

function ExerciseEditor({ form, setForm, onCancel, onSave }: { form: ExerciseForm; setForm: (form: ExerciseForm) => void; onCancel: () => void; onSave: () => void }) {
  return (
    <GlassCard className="border-blue-500/35 p-4">
      <SectionTitle label={form.id ? "Edit exercise" : "Create exercise"} />
      <div className="grid gap-3">
        <LabeledInput label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="Barbell Bench Press" />
        <div className="grid grid-cols-2 gap-2">
          <LabeledInput label="Primary muscle" value={form.primaryMuscle} onChange={(primaryMuscle) => setForm({ ...form, primaryMuscle })} placeholder="Chest" />
          <LabeledInput label="Equipment" value={form.equipment} onChange={(equipment) => setForm({ ...form, equipment })} placeholder="Barbell" />
        </div>
        <LabeledInput label="Movement pattern" value={form.movementPattern} onChange={(movementPattern) => setForm({ ...form, movementPattern })} placeholder="Horizontal push" />
        <label className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-slate-200">
          <input type="checkbox" checked={form.isUnilateral} onChange={(event) => setForm({ ...form, isUnilateral: event.target.checked })} className="h-5 w-5 accent-blue-500" />
          Unilateral movement
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Notes</span>
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} className="rounded-2xl border border-white/12 bg-black/20 p-3 text-base text-white outline-none placeholder:text-slate-500 focus:border-blue-400" placeholder="Setup cues, form notes, machine settings..." />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <MobileGhostButton onClick={onCancel}>Cancel</MobileGhostButton>
          <MobilePrimaryButton onClick={onSave}>Save</MobilePrimaryButton>
        </div>
      </div>
    </GlassCard>
  );
}

function LabeledInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-[48px] rounded-2xl border border-white/12 bg-black/20 px-3 text-base text-white outline-none placeholder:text-slate-500 focus:border-blue-400" />
    </label>
  );
}

type ExerciseRow = ReturnType<typeof buildExerciseRows>[number];

function buildExerciseRows(snapshot: MobileSnapshot, analyzer: MobileAnalyzerModel) {
  const sessionById = new Map(snapshot.sessions.filter((session) => !session.deletedAt).map((session) => [session.id, session]));
  const rowsByExercise = new Map<string, typeof snapshot.sessionExercises>();
  snapshot.sessionExercises.filter((row) => !row.deletedAt).forEach((row) => {
    rowsByExercise.set(row.exerciseId, [...(rowsByExercise.get(row.exerciseId) ?? []), row]);
  });
  const setsByRow = new Map<string, typeof snapshot.setLogs>();
  snapshot.setLogs.filter((set) => !set.deletedAt && set.isCompleted).forEach((set) => {
    setsByRow.set(set.workoutSessionExerciseId, [...(setsByRow.get(set.workoutSessionExerciseId) ?? []), set]);
  });
  const strengthByExercise = new Map(analyzer.strengthRows.map((row) => [row.exerciseId, row]));
  return snapshot.exercises
    .filter((exercise) => !exercise.deletedAt)
    .map((exercise) => {
      const exerciseRows = rowsByExercise.get(exercise.id) ?? [];
      const sets = exerciseRows.flatMap((row) => setsByRow.get(row.id) ?? []);
      const sessionIds = new Set(exerciseRows.map((row) => row.workoutSessionId));
      const sessions = [...sessionIds].map((id) => sessionById.get(id)).filter(Boolean);
      const latestSession = sessions.sort((a, b) => (b?.startedAt ?? "").localeCompare(a?.startedAt ?? ""))[0];
      const best = sets.sort((a, b) => estimatedOneRepMax(b.weight, b.reps) - estimatedOneRepMax(a.weight, a.reps))[0];
      const strength = strengthByExercise.get(exercise.id);
      const contributions = resolveMuscleContributions(exercise);
      const muscles = [...new Set([exercise.primaryMuscle, ...exercise.secondaryMuscles, ...contributions.map((item) => item.muscle)].filter(Boolean))];
      return {
        id: exercise.id,
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle || "Unspecified",
        muscles,
        contributions,
        equipment: exercise.equipment || "Unspecified",
        movementPattern: exercise.movementPattern || "Unspecified",
        isUnilateral: exercise.isUnilateral,
        notes: exercise.notes ?? "",
        sessions: sessionIds.size,
        sets: sets.length,
        volume: sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
        bestSet: best ? `${formatNumber(best.weight)} x ${best.reps}` : "n/a",
        estimatedOneRm: strength?.estimatedOneRm ?? (best ? estimatedOneRepMax(best.weight, best.reps) : 0),
        lastTrained: latestSession ? new Date(latestSession.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Never",
        prs: analyzer.recentPrs.filter((record) => record.exerciseId === exercise.id)
      };
    })
    .sort((a, b) => b.volume - a.volume || a.name.localeCompare(b.name));
}

function emptyForm(): ExerciseForm {
  return {
    name: "",
    primaryMuscle: "",
    equipment: "",
    movementPattern: "",
    isUnilateral: false,
    notes: ""
  };
}
