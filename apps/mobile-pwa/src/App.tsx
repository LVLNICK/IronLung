import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "./components/MobileShell";
import { MobileButton, MobileCard } from "./components/MobilePrimitives";
import { loadMobileSnapshot, type MobileSnapshot } from "./data/mobileRepository";
import { buildMobileAnalyzer } from "./features/analytics/mobileAnalytics";
import { HomePage } from "./pages/HomePage";
import { TrainPage } from "./pages/TrainPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { PhotosPage } from "./pages/PhotosPage";
import { SettingsPage } from "./pages/SettingsPage";
import type { MobileTab } from "./types";

export function App() {
  const [tab, setTab] = useState<MobileTab>(initialTab());
  const [snapshot, setSnapshot] = useState<MobileSnapshot | null>(null);
  const [status, setStatus] = useState("Loading local analyzer data...");
  const [loadError, setLoadError] = useState("");

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

  const analyzer = useMemo(() => snapshot ? buildMobileAnalyzer(snapshot, "30d", "all") : null, [snapshot]);

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

  const changeTab = (next: MobileTab) => {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
  };
  const openSettings = () => changeTab("settings");

  return (
    <MobileShell tab={tab} onTab={changeTab}>
      {tab === "home" && <HomePage snapshot={snapshot} analyzer={analyzer} onOpenSync={openSettings} />}
      {tab === "train" && <TrainPage snapshot={snapshot} analyzer={analyzer} />}
      {tab === "analytics" && <AnalyticsPage snapshot={snapshot} analyzer={analyzer} />}
      {tab === "photos" && <PhotosPage snapshot={snapshot} analyzer={analyzer} />}
      {tab === "settings" && <SettingsPage snapshot={snapshot} refresh={refresh} status={status} setStatus={setStatus} />}
    </MobileShell>
  );
}

function initialTab(): MobileTab {
  const hash = typeof window === "undefined" ? "" : window.location.hash.replace("#", "");
  return hash === "train" || hash === "analytics" || hash === "photos" || hash === "settings" ? hash : "home";
}
