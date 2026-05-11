import { useMemo, useState } from "react";
import { CheckCircle2, Database, Download, FolderDown, FolderUp, Lock, Settings, Smartphone, Trash2 } from "lucide-react";
import {
  BoostcampCsvImporter,
  BoostcampJsonImporter,
  buildImportPreview,
  createDefaultExerciseMappings,
  type ExerciseMapping,
  type ImportCommitSummary,
  type ImportPreview,
  type ImportUnitPreference,
  type NormalizedWorkoutImport,
  type TrainingGoal
} from "@ironlog/core";
import { Card, MetricCard, SectionHeader } from "../components/cards/Card";
import { Button, Input, Select, TextArea } from "../components/forms/controls";
import { ScreenShell } from "../components/layout/ScreenShell";
import { EmptyState } from "../components/empty-states/EmptyState";
import { AnalyticsTable, StatRows } from "../components/tables/AnalyticsTable";
import { ConfirmModal } from "../components/modals/ConfirmModal";
import { countNumber, shortDate } from "../lib/format";
import { refreshBoostcampFromLocalHelper } from "../lib/boostcampSync";
import { createExport, validateImportPayload } from "../lib/importExport";
import { type IronLogStateData, useIronLogStore } from "../lib/store";
import { parseMobileExportBundle } from "../features/mobile-sync/mobileBundleImporter";
import { createMobileSeedBundle, mergeMobileBundle, previewMobileImport } from "../features/mobile-sync/mobileMerge";
import type { MobileExportBundle, MobileImportPreview } from "../features/mobile-sync/mobileSyncTypes";

export function DataSettingsPage() {
  const state = useIronLogStore();
  const [status, setStatus] = useState("");
  const [confirmAction, setConfirmAction] = useState<"photos" | "reset" | null>(null);
  const exportJson = useMemo(() => JSON.stringify(createExport(pickStateData(state)), null, 2), [state]);

  async function copyExport() {
    await navigator.clipboard.writeText(exportJson);
    setStatus("Export JSON copied.");
  }

  function downloadExport() {
    const blob = new Blob([exportJson], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ironlog-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Export downloaded.");
  }

  return (
    <ScreenShell title="Data & Settings" subtitle="Preferences, Boostcamp import, IronLog JSON backup, privacy controls, and local data safety.">
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
            <Select value={state.trainingGoal} onChange={(value) => state.updateSettings({ trainingGoal: value as TrainingGoal })}>
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy</option>
              <option value="lean_bulk">Lean bulk</option>
              <option value="cutting">Cutting</option>
              <option value="powerbuilding">Powerbuilding</option>
              <option value="general_fitness">General fitness</option>
            </Select>
            <Select value={state.currentTrainingBlockId ?? ""} onChange={(value) => state.setCurrentTrainingBlock(value || null)}>
              <option value="">No active block</option>
              {state.trainingBlocks.map((block) => <option key={block.id} value={block.id}>{block.name}</option>)}
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
          <div className="space-y-3 text-sm leading-relaxed text-obsidian-muted">
            <p>IronLog Desktop does not require an account, does not upload progress photos, and does not add analytics tracking.</p>
            <p>Imported Boostcamp and IronLog files are parsed locally. Original import files are not stored unless you choose to keep them elsewhere.</p>
            <p>Future sync is intentionally left as a documented roadmap item, not a hidden service.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="danger" icon={Trash2} onClick={() => setConfirmAction("photos")}>Delete all photos</Button>
            <Button variant="danger" icon={Trash2} onClick={() => setConfirmAction("reset")}>Reset all local data</Button>
          </div>
        </Card>
      </div>

      <TrainingBlocksPanel />

      <BoostcampImportPanel />

      <MobileSyncPanel />

      <div className="grid grid-cols-2 gap-5">
        <IronLogImportPanel onStatus={setStatus} />
        <Card>
          <SectionHeader title="Export" icon={FolderDown} action={<div className="flex gap-2"><Button variant="ghost" icon={Download} onClick={downloadExport}>Download</Button><Button icon={FolderDown} onClick={copyExport}>Copy JSON</Button></div>} />
          <TextArea value={exportJson} onChange={() => undefined} placeholder="IronLog JSON export" />
          <div className="mt-4 grid grid-cols-4 gap-3">
            <ExportStat label="Workouts" value={state.sessions.length} />
            <ExportStat label="PRs" value={state.personalRecords.length} />
            <ExportStat label="Photos" value={state.photos.length} />
            <ExportStat label="Analyses" value={state.analyses.length} />
          </div>
          {status && <div className="mt-3 text-sm text-obsidian-muted">{status}</div>}
        </Card>
      </div>

      <Card>
        <SectionHeader title="Backup and Mobile Roadmap" icon={Database} />
        <div className="grid grid-cols-3 gap-4 text-sm leading-relaxed text-obsidian-muted">
          <p>Manual backup today: export JSON and copy any photo files you want to preserve into your own backup folder.</p>
          <p>Mobile later: keep shared types, PR calculations, analytics, importers, and schema concepts in reusable packages.</p>
          <p>Sync later: add an optional encrypted sync API only after local-first behavior is stable and documented.</p>
        </div>
      </Card>
      {confirmAction === "photos" && (
        <ConfirmModal
          title="Delete all photo data?"
          body="This removes local progress photos and analysis outputs from IronLog storage. Workout logs stay intact."
          confirmLabel="Delete photos"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => { state.deleteAllPhotoData(); setConfirmAction(null); }}
        />
      )}
      {confirmAction === "reset" && (
        <ConfirmModal
          title="Reset all local data?"
          body="This removes local workouts, exercises, templates, PRs, photos, analyses, goals, and blocks from IronLog storage."
          confirmLabel="Reset everything"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => { state.clearAllData(); setConfirmAction(null); }}
        />
      )}
    </ScreenShell>
  );
}

function TrainingBlocksPanel() {
  const state = useIronLogStore();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<TrainingGoal>(state.trainingGoal);
  const [notes, setNotes] = useState("");
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const today = new Date().toISOString();
  const deleteBlock = state.trainingBlocks.find((block) => block.id === deleteBlockId);

  function createBlock() {
    if (!name.trim()) return;
    const block = state.createTrainingBlock({ name: name.trim(), goal, notes, startedAt: today, endedAt: null });
    state.setCurrentTrainingBlock(block.id);
    setName("");
    setNotes("");
  }

  return (
    <Card>
      <SectionHeader title="Training Blocks" icon={Database} />
      <div className="grid grid-cols-[1fr_220px_1.2fr_auto] gap-3">
        <Input placeholder="Block name, e.g. Bench Focus Block" value={name} onChange={setName} />
        <Select value={goal} onChange={(value) => setGoal(value as TrainingGoal)}>
          <option value="strength">Strength</option>
          <option value="hypertrophy">Hypertrophy</option>
          <option value="lean_bulk">Lean bulk</option>
          <option value="cutting">Cutting</option>
          <option value="powerbuilding">Powerbuilding</option>
          <option value="general_fitness">General fitness</option>
        </Select>
        <Input placeholder="Block notes" value={notes} onChange={setNotes} />
        <Button onClick={createBlock}>Create block</Button>
      </div>
      <div className="mt-5">
        <AnalyticsTable
          headers={["Block", "Goal", "Started", "Status", "Actions"]}
          rows={state.trainingBlocks.map((block) => [
            block.name,
            goalLabel(block.goal ?? "general_fitness"),
            shortDate(block.startedAt),
            state.currentTrainingBlockId === block.id ? "Active" : block.endedAt ? "Ended" : "Open",
            state.currentTrainingBlockId === block.id ? "active" : "set active"
          ])}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {state.trainingBlocks.map((block) => (
          <div key={block.id} className="flex items-center gap-2 rounded-xl border border-obsidian-strong bg-obsidian-700 p-2">
            <span className="px-2 text-sm text-obsidian-muted">{block.name}</span>
            <Button variant="ghost" onClick={() => state.setCurrentTrainingBlock(block.id)}>Set active</Button>
            <Button variant="ghost" onClick={() => state.updateTrainingBlock(block.id, { endedAt: block.endedAt ? null : new Date().toISOString() })}>{block.endedAt ? "Reopen" : "End"}</Button>
            <Button variant="danger" onClick={() => setDeleteBlockId(block.id)}>Delete</Button>
          </div>
        ))}
      </div>
      {!state.trainingBlocks.length && <div className="mt-5"><EmptyState icon={Database} title="No training blocks yet" body="Create a block to group sessions into phases like Lean Bulk 2026, Cut Phase, or Bench Focus Block." /></div>}
      {deleteBlock && (
        <ConfirmModal
          title="Delete training block?"
          body={`This deletes "${deleteBlock.name}" as a grouping label and unassigns its workouts. The workout history stays intact.`}
          confirmLabel="Delete block"
          onCancel={() => setDeleteBlockId(null)}
          onConfirm={() => { state.deleteTrainingBlock(deleteBlock.id); setDeleteBlockId(null); }}
        />
      )}
    </Card>
  );
}

function BoostcampImportPanel() {
  const state = useIronLogStore();
  const [unit, setUnit] = useState<ImportUnitPreference>("auto");
  const [helperPath, setHelperPath] = useState("D:\\boostcamp-mcp");
  const [exportDir, setExportDir] = useState("D:\\IronLung");
  const [timezoneOffset, setTimezoneOffset] = useState("-240");
  const [normalized, setNormalized] = useState<NormalizedWorkoutImport | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mappings, setMappings] = useState<ExerciseMapping[]>([]);
  const [summary, setSummary] = useState<ImportCommitSummary | null>(null);
  const [status, setStatus] = useState("");
  const [latestExportPath, setLatestExportPath] = useState("");

  function prepareImport(text: string, format: "csv" | "json") {
    const importer = format === "csv" ? new BoostcampCsvImporter() : new BoostcampJsonImporter();
    const parsed = importer.parse(text, { unit });
    const existingHashes = state.setLogs.map((setLog) => setLog.importHash).filter((hash): hash is string => Boolean(hash));
    const nextPreview = buildImportPreview(parsed, state.exercises, existingHashes);
    const importedNames = [...new Set(parsed.workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.exerciseName)))];
    setNormalized(parsed);
    setPreview(nextPreview);
    setMappings(createDefaultExerciseMappings(importedNames, state.exercises));
    setSummary(null);
  }

  async function refreshFromBoostcamp() {
    try {
      setStatus("Refreshing from local Boostcamp helper...");
      const result = await refreshBoostcampFromLocalHelper({
        repoPath: helperPath,
        exportDir,
        timezoneOffset: Number(timezoneOffset)
      });
      prepareImport(result.content, "json");
      setLatestExportPath(result.path);
      setStatus(`Boostcamp refresh complete. Saved ${result.path}. Review the dry-run preview before importing.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not refresh Boostcamp data.");
      setNormalized(null);
      setPreview(null);
      setMappings([]);
    }
  }

  async function handleFile(file?: File) {
    if (!file) return;
    try {
      setStatus("Parsing locally...");
      setLatestExportPath("");
      prepareImport(await file.text(), file.name.toLowerCase().endsWith(".csv") ? "csv" : "json");
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
    const current = useIronLogStore.getState();
    const existingHashes = current.setLogs.map((setLog) => setLog.importHash).filter((hash): hash is string => Boolean(hash));
    setPreview(buildImportPreview(normalized, current.exercises, existingHashes));
  }

  return (
    <Card>
      <SectionHeader title="Boostcamp Import" icon={FolderUp} action={<div className="flex gap-2"><Select value={unit} onChange={(value) => setUnit(value as ImportUnitPreference)}><option value="auto">Auto unit</option><option value="lbs">lbs</option><option value="kg">kg</option></Select><label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-electric px-4 text-sm font-bold text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] transition-colors hover:bg-blue-500"><FolderUp className="h-4 w-4" />Upload CSV/JSON<input className="hidden" type="file" accept=".csv,.json,.txt,application/json,text/csv,text/plain" onChange={(event) => handleFile(event.target.files?.[0])} /></label></div>} />
      <p className="max-w-4xl text-sm leading-relaxed text-obsidian-muted">Import user-provided Boostcamp files, or refresh through your local authenticated `boostcamp-mcp` helper. IronLog does not store your Boostcamp password, does not upload imported data, and still runs a dry-run preview before writing anything.</p>
      <div className="mt-5 grid grid-cols-[1.15fr_1.15fr_150px_auto] gap-3 rounded-xl border border-obsidian bg-obsidian-700 p-3">
        <Input value={helperPath} onChange={setHelperPath} placeholder="Boostcamp helper folder" />
        <Input value={exportDir} onChange={setExportDir} placeholder="Export folder" />
        <Select value={timezoneOffset} onChange={setTimezoneOffset}>
          <option value="-240">Eastern daylight</option>
          <option value="-300">Eastern standard</option>
          <option value="0">UTC</option>
        </Select>
        <Button icon={FolderDown} onClick={refreshFromBoostcamp}>Refresh Boostcamp</Button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-obsidian-subtle">Personal local mode uses the existing token in the helper folder's `.env`. If it fails, run `uv run login` in that folder and try again.</p>
      {status && <div className="mt-4 rounded-xl border border-obsidian bg-obsidian-700 p-3 text-sm text-obsidian-muted">{status}</div>}
      {latestExportPath && <div className="mt-2 text-xs text-obsidian-subtle">Latest export: {latestExportPath}</div>}

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
            <div className="rounded-xl border border-obsidian bg-obsidian-700 p-4">
              <div className="mb-3 font-medium">Exercise mapping</div>
              <div className="max-h-80 space-y-2 overflow-auto pr-1">
                {mappings.map((mapping) => (
                  <div key={mapping.importedName} className="grid grid-cols-[1fr_150px_1.2fr] items-center gap-2 rounded-lg border border-obsidian-strong bg-obsidian-700 p-2">
                    <div>
                      <div className="text-sm font-medium text-white">{mapping.importedName}</div>
                      <div className="text-xs text-obsidian-subtle">Imported name</div>
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

function MobileSyncPanel() {
  const state = useIronLogStore();
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<MobileImportPreview | null>(null);
  const [bundle, setBundle] = useState<MobileExportBundle | null>(null);

  function downloadSeedBundle() {
    const seed = createMobileSeedBundle(pickStateData(state));
    const blob = new Blob([JSON.stringify(seed, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ironlog-mobile-seed-${new Date().toISOString().slice(0, 10)}.ironlog-mobile-seed.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Mobile seed bundle exported. Import it on your phone from the Sync tab.");
  }

  async function handleMobileBundle(file?: File) {
    if (!file) return;
    try {
      const parsed = parseMobileExportBundle(await file.text());
      setBundle(parsed);
      setPreview(previewMobileImport(parsed, pickStateData(state)));
      setStatus("Dry-run preview complete. Review before merging phone data.");
    } catch (error) {
      setBundle(null);
      setPreview(null);
      setStatus(error instanceof Error ? error.message : "Could not read mobile bundle.");
    }
  }

  function mergePhoneData() {
    if (!bundle) return;
    const result = mergeMobileBundle(bundle, pickStateData(useIronLogStore.getState()));
    state.importData(result.data);
    setPreview(result.preview);
    setStatus("Mobile bundle merged. PRs and analytics were recalculated.");
  }

  return (
    <Card>
      <SectionHeader
        title="Mobile/PWA Sync"
        icon={Smartphone}
        action={<Button icon={FolderDown} onClick={downloadSeedBundle}>Export mobile analytics seed</Button>}
      />
      <div className="grid grid-cols-[1fr_360px] gap-5">
        <div className="space-y-3 text-sm leading-relaxed text-obsidian-muted">
          <p>Use file-based local sync for the phone analytics dashboard. Export an analytics seed from desktop, import it on your phone, and view workout history locally.</p>
          <p>No account, no cloud upload, and no server is required. Mobile bundles are user-controlled files that can contain sensitive workout data.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-obsidian-strong bg-obsidian-700 px-4 text-sm font-semibold text-obsidian-muted transition-colors hover:border-electric hover:text-white">
              <FolderUp className="h-4 w-4" />
              Import mobile export
              <input className="hidden" type="file" accept=".json,.ironlog-mobile.json,.ironlung-mobile.json,application/json" onChange={(event) => handleMobileBundle(event.target.files?.[0])} />
            </label>
            <Button disabled={!bundle} icon={CheckCircle2} onClick={mergePhoneData}>Merge mobile data</Button>
          </div>
          {status && <div className="rounded-xl border border-obsidian bg-obsidian-700 p-3 text-sm text-obsidian-muted">{status}</div>}
        </div>
        <div className="rounded-xl border border-obsidian bg-obsidian-700 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-obsidian-muted">Dry-run preview</div>
          {preview ? (
            <div className="space-y-2">
              <StatRows rows={[
                ["Device", preview.deviceName],
                ["Exported", shortDate(preview.exportedAt)],
                ["Workouts found", countNumber(preview.workoutsFound)],
                ["Sets found", countNumber(preview.setsFound)],
                ["Exercises found", countNumber(preview.exercisesFound)],
                ["Duplicates", countNumber(preview.duplicateRecords)],
                ["Conflicts", countNumber(preview.conflicts)],
                ["Will create", countNumber(preview.recordsToCreate)],
                ["Will update", countNumber(preview.recordsToUpdate)],
                ["Will skip", countNumber(preview.recordsToSkip)]
              ]} />
              {preview.warnings.length > 0 && <div className="text-xs leading-relaxed text-warn">{preview.warnings.join(" ")}</div>}
            </div>
          ) : (
            <EmptyState icon={Smartphone} title="No phone export selected" body="Upload a .ironlog-mobile.json file from the PWA Sync tab to preview a local merge. Legacy .ironlung-mobile.json exports are still accepted." />
          )}
        </div>
      </div>
    </Card>
  );
}

function IronLogImportPanel({ onStatus }: { onStatus: (value: string) => void }) {
  const state = useIronLogStore();
  const [importText, setImportText] = useState("");

  function importJson(raw: string) {
    try {
      state.importData(validateImportPayload(raw));
      onStatus("IronLog JSON import complete.");
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
      <SectionHeader title="IronLog JSON Import" icon={FolderUp} />
      <TextArea placeholder="Paste IronLog JSON export" value={importText} onChange={setImportText} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button icon={FolderUp} onClick={() => importJson(importText)}>Import pasted JSON</Button>
        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-obsidian-strong bg-obsidian-700 px-4 text-sm font-medium text-obsidian-muted transition-colors hover:border-electric hover:text-white">
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
    <div className="rounded-xl border border-obsidian bg-obsidian-700 p-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-obsidian-muted">{label}</div>
      <div className="mt-1 font-mono text-xl font-semibold text-white">{countNumber(value)}</div>
    </div>
  );
}

function ImportStat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl border border-obsidian bg-obsidian-700 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-obsidian-muted">{label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-white">{countNumber(value)}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-obsidian-subtle">{hint}</div>
    </div>
  );
}

function ImportDetail({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-obsidian bg-obsidian-700 p-4">
      <div className="mb-2 font-medium text-white">{title}</div>
      <div className="max-h-28 overflow-auto text-sm leading-relaxed text-obsidian-muted">{body}</div>
    </div>
  );
}

function goalLabel(goal: TrainingGoal) {
  const labels: Record<TrainingGoal, string> = {
    strength: "Strength",
    hypertrophy: "Hypertrophy",
    lean_bulk: "Lean bulk",
    cutting: "Cutting",
    powerbuilding: "Powerbuilding",
    general_fitness: "General fitness"
  };
  return labels[goal];
}

function pickStateData(state: ReturnType<typeof useIronLogStore.getState>): IronLogStateData {
  return {
    unitPreference: state.unitPreference,
    theme: state.theme,
    trainingGoal: state.trainingGoal,
    currentTrainingBlockId: state.currentTrainingBlockId,
    trainingBlocks: state.trainingBlocks,
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
