import { useMemo, useState } from "react";
import { CheckCircle2, Database, Download, FolderDown, FolderUp, Lock, Settings, Trash2 } from "lucide-react";
import {
  BoostcampCsvImporter,
  BoostcampJsonImporter,
  buildImportPreview,
  createDefaultExerciseMappings,
  type ExerciseMapping,
  type ImportCommitSummary,
  type ImportPreview,
  type ImportUnitPreference,
  type NormalizedWorkoutImport
} from "@ironlung/core";
import { Card, MetricCard, SectionHeader } from "../components/cards/Card";
import { Button, Input, Select, TextArea } from "../components/forms/controls";
import { ScreenShell } from "../components/layout/ScreenShell";
import { EmptyState } from "../components/empty-states/EmptyState";
import { AnalyticsTable, StatRows } from "../components/tables/AnalyticsTable";
import { shortDate } from "../lib/format";
import { createExport, validateImportPayload } from "../lib/importExport";
import { type IronLungStateData, useIronLungStore } from "../lib/store";

export function DataSettingsPage() {
  const state = useIronLungStore();
  const [status, setStatus] = useState("");
  const exportJson = useMemo(() => JSON.stringify(createExport(pickStateData(state)), null, 2), [state]);

  async function copyExport() {
    await navigator.clipboard.writeText(exportJson);
    setStatus("Export JSON copied.");
  }

  function downloadExport() {
    const blob = new Blob([exportJson], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ironlung-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Export downloaded.");
  }

  return (
    <ScreenShell title="Data & Settings" subtitle="Preferences, Boostcamp import, IronLung JSON backup, privacy controls, and local data safety.">
      <div className="grid grid-cols-5 gap-4">
        <MetricCard label="Exercises" value={String(state.exercises.length)} hint="local" />
        <MetricCard label="Workouts" value={String(state.sessions.length)} hint="local" />
        <MetricCard label="Sets" value={String(state.setLogs.length)} hint="local" />
        <MetricCard label="PRs" value={String(state.personalRecords.length)} hint="by type" />
        <MetricCard label="Photos" value={String(state.photos.length)} hint="local only" />
      </div>

      <div className="grid grid-cols-[.85fr_1.15fr] gap-5">
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
          <div className="mt-5">
            <StatRows rows={[
              ["Default rest timer", "120 seconds"],
              ["Default date range", "30 days"],
              ["Storage mode", "Local-first"],
              ["Cloud sync", "Not implemented"]
            ]} />
          </div>
        </Card>

        <Card>
          <SectionHeader title="Privacy" icon={Lock} />
          <div className="space-y-3 text-sm leading-6 text-white/55">
            <p>IronLung Desktop does not require an account, does not upload progress photos, and does not add analytics tracking.</p>
            <p>Imported Boostcamp and IronLung files are parsed locally. Original import files are not stored unless you choose to keep them elsewhere.</p>
            <p>Future sync is intentionally left as a documented roadmap item, not a hidden service.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="danger" icon={Trash2} onClick={() => state.deleteAllPhotoData()}>Delete all photos</Button>
            <Button variant="danger" icon={Trash2} onClick={() => state.clearAllData()}>Reset all local data</Button>
          </div>
        </Card>
      </div>

      <BoostcampImportPanel />

      <div className="grid grid-cols-2 gap-5">
        <IronLungImportPanel onStatus={setStatus} />
        <Card>
          <SectionHeader title="Export" icon={FolderDown} action={<div className="flex gap-2"><Button variant="ghost" icon={Download} onClick={downloadExport}>Download</Button><Button icon={FolderDown} onClick={copyExport}>Copy JSON</Button></div>} />
          <TextArea value={exportJson} onChange={() => undefined} placeholder="IronLung JSON export" />
          <div className="mt-4 grid grid-cols-4 gap-3">
            <ExportStat label="Workouts" value={state.sessions.length} />
            <ExportStat label="PRs" value={state.personalRecords.length} />
            <ExportStat label="Photos" value={state.photos.length} />
            <ExportStat label="Analyses" value={state.analyses.length} />
          </div>
          {status && <div className="mt-3 text-sm text-white/50">{status}</div>}
        </Card>
      </div>

      <Card>
        <SectionHeader title="Backup and Mobile Roadmap" icon={Database} />
        <div className="grid grid-cols-3 gap-4 text-sm leading-6 text-white/52">
          <p>Manual backup today: export JSON and copy any photo files you want to preserve into your own backup folder.</p>
          <p>Mobile later: keep shared types, PR calculations, analytics, importers, and schema concepts in reusable packages.</p>
          <p>Sync later: add an optional encrypted sync API only after local-first behavior is stable and documented.</p>
        </div>
      </Card>
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
    const current = useIronLungStore.getState();
    const existingHashes = current.setLogs.map((setLog) => setLog.importHash).filter((hash): hash is string => Boolean(hash));
    setPreview(buildImportPreview(normalized, current.exercises, existingHashes));
  }

  return (
    <Card>
      <SectionHeader title="Boostcamp Import" icon={FolderUp} action={<div className="flex gap-2"><Select value={unit} onChange={(value) => setUnit(value as ImportUnitPreference)}><option value="auto">Auto unit</option><option value="lbs">lbs</option><option value="kg">kg</option></Select><label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-ink transition hover:bg-accent"><FolderUp className="h-4 w-4" />Upload CSV/JSON<input className="hidden" type="file" accept=".csv,.json,.txt,application/json,text/csv,text/plain" onChange={(event) => handleFile(event.target.files?.[0])} /></label></div>} />
      <p className="max-w-4xl text-sm leading-6 text-white/50">Import user-provided Boostcamp CSV or JSON files only. IronLung does not scrape Boostcamp, does not ask for Boostcamp credentials, and does not upload imported data.</p>
      {status && <div className="mt-4 rounded-xl border border-line bg-black/20 p-3 text-sm text-white/55">{status}</div>}

      {preview ? (
        <>
          <div className="mt-5 grid grid-cols-6 gap-3">
            <ImportStat label="Workouts" value={preview.totalWorkouts} hint="found" />
            <ImportStat label="Exercises" value={preview.totalExercises} hint="names" />
            <ImportStat label="Sets" value={preview.totalSets} hint="rows" />
            <ImportStat label="Duplicates" value={preview.duplicateSetHashes.length} hint="hashes" />
            <ImportStat label="Skipped" value={preview.skippedRows.length} hint="rows" />
            <ImportStat label="Unknown" value={preview.unknownFields.length} hint="fields" />
          </div>
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
              <ImportDetail title="Date range" body={preview.dateRange.start ? `${shortDate(preview.dateRange.start)} to ${shortDate(preview.dateRange.end ?? preview.dateRange.start)}` : "No dates found"} />
              <ImportDetail title="Unknown fields" body={preview.unknownFields.length ? preview.unknownFields.slice(0, 18).join(", ") : "None"} />
              <ImportDetail title="Possible duplicates" body={preview.possibleDuplicateExercises.length ? preview.possibleDuplicateExercises.slice(0, 5).map((item) => `${item.importedName} -> ${item.existingName}`).join(", ") : "No close matches found"} />
              <Button onClick={commitImport} disabled={!normalized} icon={CheckCircle2}>Import reviewed data</Button>
            </div>
          </div>
          {normalized && (
            <div className="mt-5">
              <AnalyticsTable headers={["Date", "Workout", "Exercises", "Sets"]} rows={normalized.workouts.slice(0, 30).map((workout) => [shortDate(workout.startedAt), workout.name, workout.exercises.length, workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)])} />
            </div>
          )}
          {summary && (
            <div className="mt-5 grid grid-cols-6 gap-3">
              <ImportStat label="Imported" value={summary.workoutsImported} hint="workouts" />
              <ImportStat label="Created" value={summary.exercisesCreated} hint="exercises" />
              <ImportStat label="Sets" value={summary.setsImported} hint="imported" />
              <ImportStat label="PRs" value={summary.prsDetected} hint="detected" />
              <ImportStat label="Skipped" value={summary.skippedRows} hint="rows" />
              <ImportStat label="Warnings" value={summary.warnings.length} hint="review" />
            </div>
          )}
        </>
      ) : (
        <div className="mt-5"><EmptyState icon={FolderUp} title="No import file selected" body="Upload a CSV or JSON file you provide manually. A dry-run preview appears before anything is written." /></div>
      )}
    </Card>
  );
}

function IronLungImportPanel({ onStatus }: { onStatus: (value: string) => void }) {
  const state = useIronLungStore();
  const [importText, setImportText] = useState("");

  function importJson(raw: string) {
    try {
      state.importData(validateImportPayload(raw));
      onStatus("IronLung JSON import complete.");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Import failed.");
    }
  }

  async function importFile(file?: File) {
    if (!file) return;
    importJson(await file.text());
  }

  return (
    <Card>
      <SectionHeader title="IronLung JSON Import" icon={FolderUp} />
      <TextArea placeholder="Paste IronLung JSON export" value={importText} onChange={setImportText} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button icon={FolderUp} onClick={() => importJson(importText)}>Import pasted JSON</Button>
        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-white/[0.04] px-4 text-sm font-medium text-white/70 transition hover:border-accent/50 hover:text-white">
          <FolderUp className="h-4 w-4" />
          Import file
          <input className="hidden" type="file" accept=".json,application/json" onChange={(event) => importFile(event.target.files?.[0])} />
        </label>
      </div>
    </Card>
  );
}

function ExportStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-black/15 p-3">
      <div className="text-xs text-white/42">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function ImportStat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl border border-line bg-black/15 p-4">
      <div className="text-xs text-white/42">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-white/30">{hint}</div>
    </div>
  );
}

function ImportDetail({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-line bg-black/15 p-4">
      <div className="mb-2 font-medium">{title}</div>
      <div className="max-h-28 overflow-auto text-sm leading-6 text-white/50">{body}</div>
    </div>
  );
}

function pickStateData(state: ReturnType<typeof useIronLungStore.getState>): IronLungStateData {
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
