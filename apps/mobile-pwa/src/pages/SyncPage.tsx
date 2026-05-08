import { useRef } from "react";
import { Database, FileDown, FileUp, ShieldCheck, Trash2 } from "lucide-react";
import { GlassCard, ListRow, MetricChip, MobileButton, MobileCard, SectionTitle, StatusPill } from "../components/MobilePrimitives";
import { getMobileStorageMode } from "../data/mobileDb";
import { createMobileExportBundle } from "../data/mobileExport";
import { importMobileSeedBundle, parseMobileImportFile } from "../data/mobileImport";
import { clearAnalyzerCache, saveSettings, type MobileSnapshot } from "../data/mobileRepository";
import { formatNumber, importedDataStatus } from "./AnalyzerShared";

type SyncPageProps = {
  snapshot: MobileSnapshot;
  refresh: () => Promise<void>;
  status: string;
  setStatus: (status: string) => void;
};

export function SyncPage({ snapshot, refresh, status, setStatus }: SyncPageProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dateRange = cachedDateRange(snapshot);
  const importStatus = importedDataStatus(snapshot);
  const workouts = snapshot.sessions.filter((item) => !item.deletedAt).length;
  const sets = snapshot.setLogs.filter((item) => !item.deletedAt).length;
  const exercises = snapshot.exercises.filter((item) => !item.deletedAt).length;
  const prs = snapshot.personalRecords.filter((item) => !item.deletedAt).length;

  async function exportCacheBackup() {
    const bundle = createMobileExportBundle(pickRecords(snapshot), snapshot.settings, snapshot.operationLog);
    const text = JSON.stringify(bundle, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const file = new File([blob], `ironlung-analyzer-cache-${new Date().toISOString().slice(0, 10)}.ironlung-mobile.json`, { type: "application/json" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "IronLung analyzer cache backup" });
    } else {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(link.href);
    }

    await saveSettings({ ...snapshot.settings, lastExportedAt: bundle.exportedAt });
    await refresh();
    setStatus("Analyzer cache backup exported. IronLung did not upload it anywhere.");
  }

  async function importSeed(file?: File) {
    if (!file) return;
    try {
      setStatus(`Importing ${file.name}...`);
      const bundle = parseMobileImportFile(await file.text(), snapshot.settings);
      const summary = await importMobileSeedBundle(bundle, snapshot.settings);
      await refresh();
      setStatus(`Imported ${file.name}: ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import desktop data.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function clearCache() {
    if (!window.confirm("Clear local analyzer cache from this phone? Desktop data is not affected.")) return;
    await clearAnalyzerCache(snapshot.settings);
    await refresh();
    setStatus("Local analyzer cache cleared from this phone.");
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <SectionTitle label="Mobile data status" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xl font-black">{workouts || sets || exercises ? "Local cache ready" : "No desktop data imported"}</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Desktop remains the source of truth. Mobile currently imports analytics data and exports a local cache backup; workout writeback is not enabled yet.</p>
          </div>
          <StatusPill tone={workouts || sets || exercises ? "green" : "yellow"}>{workouts || sets || exercises ? "Ready" : "Empty"}</StatusPill>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-2">
        <MetricChip icon={Database} label="Workouts" value={formatNumber(workouts)} />
        <MetricChip icon={Database} label="Sets" value={formatNumber(sets)} />
        <MetricChip icon={Database} label="Exercises" value={formatNumber(exercises)} />
        <MetricChip icon={Database} label="Photos" value="0" sub="metadata not cached" />
      </div>

      <MobileCard>
        <SectionTitle label="Import / export" />
        <div className="grid gap-3">
          <MobileButton variant="ghost" onClick={() => inputRef.current?.click()} className="flex items-center justify-center gap-2"><FileUp className="h-4 w-4" />Import desktop data</MobileButton>
          <MobileButton variant="ghost" onClick={exportCacheBackup} className="flex items-center justify-center gap-2"><FileDown className="h-4 w-4" />Export cache backup</MobileButton>
          <MobileButton variant="danger" onClick={clearCache} className="flex items-center justify-center gap-2"><Trash2 className="h-4 w-4" />Clear analyzer cache</MobileButton>
          <input ref={inputRef} className="hidden" type="file" accept=".json,.ironlung-mobile-seed.json,application/json" onChange={(event) => void importSeed(event.target.files?.[0])} />
        </div>
      </MobileCard>

      <GlassCard className="p-4">
        <SectionTitle label="Cache details" />
        <div className="space-y-3">
          <ListRow title="Last import" subtitle={snapshot.settings.lastImportedAt ? new Date(snapshot.settings.lastImportedAt).toLocaleString() : "Never imported"} />
          <ListRow title="Date range" subtitle={dateRange} />
          <ListRow title="Storage mode" subtitle={getMobileStorageMode()} />
          {importStatus.warning && <p className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-3 text-sm leading-relaxed text-yellow-100">{importStatus.warning}</p>}
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="flex items-center gap-2 font-black"><ShieldCheck className="h-5 w-5 text-blue-400" />Privacy defaults</div>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">No account, no cloud sync, no server, no analytics tracking, and no uploads. Import/export files are controlled by you.</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">Phone testing from a local network may need HTTPS for full install/service-worker behavior. The analyzer cache still stays on the phone.</p>
      </GlassCard>

      <GlassCard className="p-4">
        <SectionTitle label="Status" />
        <p className="text-sm leading-relaxed text-slate-300">{status}</p>
      </GlassCard>
    </div>
  );
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

function cachedDateRange(snapshot: MobileSnapshot): string {
  const dates = snapshot.sessions.filter((session) => !session.deletedAt).map((session) => session.startedAt).sort();
  if (!dates.length) return "No workouts cached";
  return `${new Date(dates[0]).toLocaleDateString()} - ${new Date(dates[dates.length - 1] ?? dates[0]).toLocaleDateString()}`;
}
