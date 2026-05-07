import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "./components/MobileShell";
import { MobileButton, MobileCard, MobileSelect } from "./components/MobilePrimitives";
import { loadMobileSnapshot, type MobileSnapshot } from "./data/mobileRepository";
import { availableMuscles, buildMobileAnalyzer, type MobileRangePreset } from "./features/analytics/mobileAnalytics";
import { HomePage } from "./pages/HomePage";
import { StrengthPage } from "./pages/StrengthPage";
import { VolumePage } from "./pages/VolumePage";
import { MusclesPage } from "./pages/MusclesPage";
import { SyncPage } from "./pages/SyncPage";
import type { MobileTab } from "./types";

const rangeOptions: Array<{ value: MobileRangePreset; label: string }> = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
  { value: "block", label: "Block" }
];

export function App() {
  const [tab, setTab] = useState<MobileTab>("dashboard");
  const [snapshot, setSnapshot] = useState<MobileSnapshot | null>(null);
  const [status, setStatus] = useState("Loading local analyzer data...");
  const [loadError, setLoadError] = useState("");
  const [range, setRange] = useState<MobileRangePreset>("30d");
  const [muscleFilter, setMuscleFilter] = useState("all");

  async function refresh() {
    setLoadError("");
    setStatus("Loading local analyzer data...");
    const next = await loadMobileSnapshot();
    setSnapshot(next);
    setStatus("Analyzer cache ready. Data stays on this phone.");
  }

  useEffect(() => {
    refresh().catch((error) => {
      const message = error instanceof Error ? error.message : "Could not load phone analyzer data.";
      setStatus(message);
      setLoadError(message);
    });
  }, []);

  const analyzer = useMemo(() => snapshot ? buildMobileAnalyzer(snapshot, range, muscleFilter) : null, [snapshot, range, muscleFilter]);
  const muscles = useMemo(() => snapshot ? availableMuscles(snapshot) : [], [snapshot]);

  if (!snapshot || !analyzer) {
    return (
      <main className="grid min-h-screen place-items-center bg-ink p-6 text-white">
        <MobileCard className="w-full max-w-sm text-center">
          <div className="text-lg font-black">Loading IronLung Analyzer...</div>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{status}</p>
          {loadError && (
            <div className="mt-4 space-y-3">
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-left text-xs leading-relaxed text-red-100">
                Local phone storage did not open. Make sure site storage is allowed and private browsing is off, then retry.
              </p>
              <MobileButton onClick={() => refresh().catch((error) => {
                const message = error instanceof Error ? error.message : "Could not load phone analyzer data.";
                setStatus(message);
                setLoadError(message);
              })}>Retry</MobileButton>
            </div>
          )}
        </MobileCard>
      </main>
    );
  }

  const openSync = () => setTab("sync");

  return (
    <MobileShell tab={tab} onTab={setTab}>
      <AnalyzerControls range={range} onRange={setRange} muscleFilter={muscleFilter} onMuscleFilter={setMuscleFilter} muscles={muscles} />
      {tab === "dashboard" && <HomePage snapshot={snapshot} analyzer={analyzer} onOpenSync={openSync} />}
      {tab === "strength" && <StrengthPage snapshot={snapshot} analyzer={analyzer} onOpenSync={openSync} />}
      {tab === "volume" && <VolumePage snapshot={snapshot} analyzer={analyzer} onOpenSync={openSync} />}
      {tab === "muscles" && <MusclesPage snapshot={snapshot} analyzer={analyzer} onOpenSync={openSync} />}
      {tab === "sync" && <SyncPage snapshot={snapshot} refresh={refresh} status={status} setStatus={setStatus} />}
    </MobileShell>
  );
}

function AnalyzerControls({ range, onRange, muscleFilter, onMuscleFilter, muscles }: { range: MobileRangePreset; onRange: (range: MobileRangePreset) => void; muscleFilter: string; onMuscleFilter: (muscle: string) => void; muscles: string[] }) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-panel p-1">
        {rangeOptions.map((option) => (
          <button key={option.value} onClick={() => onRange(option.value)} className={`min-h-10 min-w-14 rounded-xl px-3 text-xs font-black ${range === option.value ? "bg-electric text-white" : "text-white/55"}`}>
            {option.label}
          </button>
        ))}
      </div>
      <MobileSelect value={muscleFilter} onChange={(event) => onMuscleFilter(event.target.value)}>
        <option value="all">All muscles</option>
        {muscles.map((muscle) => <option key={muscle} value={muscle}>{muscle}</option>)}
      </MobileSelect>
    </div>
  );
}
