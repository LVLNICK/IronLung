import { useRef } from "react";
import { FileDown, FileUp, ShieldCheck, Trash2 } from "lucide-react";
import { MobileButton, MobileCard } from "../components/MobilePrimitives";
import { getMobileStorageMode } from "../data/mobileDb";
import { createMobileExportBundle } from "../data/mobileExport";
import { importMobileSeedBundle, validateMobileSeedBundle } from "../data/mobileImport";
import { clearAnalyzerCache, saveSettings, type MobileSnapshot } from "../data/mobileRepository";
import { PageIntro, StatPill, formatNumber, importedDataStatus } from "./AnalyzerShared";

type SyncPageProps = {
  snapshot: MobileSnapshot;
  refresh: () => Promise<void>;
  status: string;
  setStatus: (status: string) => void;
};

export function SyncPage({ snapshot, refresh, status, setStatus }: SyncPageProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

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
      const bundle = validateMobileSeedBundle(JSON.parse(await file.text()));
      const summary = await importMobileSeedBundle(bundle, snapshot.settings);
      await refresh();
      setStatus(`Imported desktop data: ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import desktop data.");
    }
  }

  async function clearCache() {
    if (!window.confirm("Clear local analyzer cache from this phone? Desktop data is not affected.")) return;
    await clearAnalyzerCache(snapshot.settings);
    await refresh();
    setStatus("Local analyzer cache cleared from this phone.");
  }

  const dateRange = cachedDateRange(snapshot);
  const importStatus = importedDataStatus(snapshot);

  return (
    <div className="space-y-4">
      <PageIntro kicker="Import Desktop Data" title="No-cloud phone cache" body="Your imported seed is stored locally on this phone. IronLung does not upload it anywhere." />
      <MobileCard>
        <div className="grid gap-2">
          <MobileButton variant="ghost" onClick={() => inputRef.current?.click()}><FileUp className="mr-2 inline h-4 w-4" />Import desktop data</MobileButton>
          <MobileButton variant="ghost" onClick={exportCacheBackup}><FileDown className="mr-2 inline h-4 w-4" />Export analyzer cache backup</MobileButton>
          <MobileButton variant="danger" onClick={clearCache}><Trash2 className="mr-2 inline h-4 w-4" />Clear analyzer cache</MobileButton>
          <input ref={inputRef} className="hidden" type="file" accept=".json,.ironlung-mobile-seed.json,application/json" onChange={(event) => importSeed(event.target.files?.[0])} />
        </div>
      </MobileCard>
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Workouts cached" value={formatNumber(snapshot.sessions.filter((item) => !item.deletedAt).length)} />
        <StatPill label="Sets cached" value={formatNumber(snapshot.setLogs.filter((item) => !item.deletedAt).length)} />
        <StatPill label="Exercises cached" value={formatNumber(snapshot.exercises.filter((item) => !item.deletedAt).length)} />
        <StatPill label="PRs cached" value={formatNumber(snapshot.personalRecords.filter((item) => !item.deletedAt).length)} />
      </div>
      <MobileCard>
        <div className="font-bold">Cache details</div>
        <div className="mt-3 space-y-2 text-sm text-white/60">
          <p>Last imported: {snapshot.settings.lastImportedAt ? new Date(snapshot.settings.lastImportedAt).toLocaleString() : "Never"}</p>
          <p>Date range cached: {dateRange}</p>
          <p>Storage mode: {getMobileStorageMode()}</p>
          {importStatus.warning && <p className="text-yellow-200">{importStatus.warning}</p>}
        </div>
      </MobileCard>
      <MobileCard>
        <div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4 text-electricText" />Privacy</div>
        <p className="mt-2 text-sm leading-relaxed text-white/60">No account, no cloud sync, no server, and no uploads. File transfer is user-controlled.</p>
        <p className="mt-2 text-xs leading-relaxed text-white/45">Phone testing from a local network may need HTTPS for full install/service-worker behavior. The analyzer cache still stays on the phone.</p>
      </MobileCard>
      <MobileCard>
        <div className="font-bold">Status</div>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{status}</p>
      </MobileCard>
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
  return `${new Date(dates[0]).toLocaleDateString()} - ${new Date(dates.at(-1) ?? dates[0]).toLocaleDateString()}`;
}
