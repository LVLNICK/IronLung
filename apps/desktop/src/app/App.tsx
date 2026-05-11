import { useEffect, useMemo, useState } from "react";
import { Camera, Command, Database, Dumbbell, FolderDown, FolderUp, Plus, Search, Settings, TrendingUp } from "lucide-react";
import { AppShell } from "../layout/AppShell";
import { type AppScreen } from "./navigation";
import { CommandCenter } from "../pages/CommandCenter";
import { TrainPage } from "../pages/TrainPage";
import { ExercisesPage } from "../pages/ExercisesPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { PhotosPage } from "../pages/PhotosPage";
import { DataSettingsPage } from "../pages/DataSettingsPage";
import { Button } from "../components/forms/controls";
import { useIronLogStore } from "../lib/store";

export function App() {
  const [screen, setScreen] = useState<AppScreen>("Command Center");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState("");
  const state = useIronLogStore();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
      if (event.key === "Escape") setPaletteOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function startWorkout() {
    state.startWorkout();
    setScreen("Train");
    setPaletteOpen(false);
    setToast("Started empty workout.");
  }

  function exportData() {
    setScreen("Data & Settings");
    setPaletteOpen(false);
    setToast("Open Export in Data & Settings.");
  }

  return (
    <main className={state.theme === "light" ? "min-h-screen bg-obsidian-900 text-white" : "min-h-screen bg-obsidian-900 text-white"}>
      <AppShell screen={screen} onNavigate={setScreen}>
        {screen === "Command Center" && <CommandCenter onNavigate={setScreen} />}
        {screen === "Train" && <TrainPage />}
        {screen === "Exercises" && <ExercisesPage />}
        {screen === "Analytics" && <AnalyticsPage />}
        {screen === "Photos" && <PhotosPage />}
        {screen === "Data & Settings" && <DataSettingsPage />}
      </AppShell>
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-lg border border-obsidian-strong bg-obsidian-700 px-4 py-2 text-sm font-semibold text-obsidian-muted shadow-soft transition-colors hover:border-electric hover:text-white"
      >
        <Command className="h-4 w-4" />
        Ctrl+K
      </button>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} onNavigate={setScreen} onStartWorkout={startWorkout} onExport={exportData} />}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </main>
  );
}

function CommandPalette({ onClose, onNavigate, onStartWorkout, onExport }: { onClose: () => void; onNavigate: (screen: AppScreen) => void; onStartWorkout: () => void; onExport: () => void }) {
  const [query, setQuery] = useState("");
  const commands = useMemo(() => [
    { label: "Start workout", hint: "Open Train and start an empty workout", icon: Dumbbell, action: onStartWorkout },
    { label: "Create exercise", hint: "Open exercise library", icon: Plus, action: () => { onNavigate("Exercises"); onClose(); } },
    { label: "Search exercise", hint: "Open exercise library search", icon: Search, action: () => { onNavigate("Exercises"); onClose(); } },
    { label: "Go to analytics", hint: "Open the analytics command page", icon: TrendingUp, action: () => { onNavigate("Analytics"); onClose(); } },
    { label: "Import data", hint: "Open Boostcamp and JSON import", icon: FolderUp, action: () => { onNavigate("Data & Settings"); onClose(); } },
    { label: "Export data", hint: "Open JSON export controls", icon: FolderDown, action: onExport },
    { label: "Open settings", hint: "Preferences, privacy, backup", icon: Settings, action: () => { onNavigate("Data & Settings"); onClose(); } },
    { label: "Open photos", hint: "Local photo timeline", icon: Camera, action: () => { onNavigate("Photos"); onClose(); } },
    { label: "Open command center", hint: "Training status and next actions", icon: Database, action: () => { onNavigate("Command Center"); onClose(); } }
  ], [onClose, onExport, onNavigate, onStartWorkout]);
  const filtered = commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()) || command.hint.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-8 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="mx-auto mt-20 w-full max-w-2xl overflow-hidden rounded-xl border border-obsidian-strong bg-obsidian-800 shadow-soft" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-obsidian-strong px-4 py-3">
          <Command className="h-5 w-5 text-electric" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands..."
            className="h-11 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-obsidian-subtle"
          />
        </div>
        <div className="max-h-[420px] overflow-auto p-2">
          {filtered.map((command) => {
            const Icon = command.icon;
            return (
              <button key={command.label} onClick={command.action} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-obsidian-600">
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-obsidian-strong bg-obsidian-700"><Icon className="h-4 w-4 text-electric" /></div>
                <div>
                  <div className="text-sm font-semibold text-white">{command.label}</div>
                  <div className="text-xs text-obsidian-muted">{command.hint}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, 2600);
    return () => window.clearTimeout(timeout);
  }, [onClose]);

  return (
    <div className="fixed right-5 top-5 z-50 rounded-xl border border-obsidian-strong bg-obsidian-800 px-4 py-3 text-sm text-obsidian-muted shadow-soft">
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <Button variant="ghost" onClick={onClose}>Dismiss</Button>
      </div>
    </div>
  );
}
