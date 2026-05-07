import { Activity, BarChart3, Dumbbell, PieChart, RefreshCw, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import type { MobileTab } from "../types";

const tabs: Array<{ tab: MobileTab; label: string; icon: typeof Dumbbell }> = [
  { tab: "dashboard", label: "Home", icon: Activity },
  { tab: "strength", label: "Strength", icon: Trophy },
  { tab: "volume", label: "Volume", icon: BarChart3 },
  { tab: "muscles", label: "Muscles", icon: PieChart },
  { tab: "sync", label: "Sync", icon: RefreshCw }
];

export function MobileShell({ tab, onTab, children }: { tab: MobileTab; onTab: (tab: MobileTab) => void; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-ink pb-24 text-white">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+14px)] backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-black tracking-tight">IronLung Analyzer</div>
            <div className="text-xs font-semibold uppercase tracking-widest text-electricText">Offline analytics dashboard</div>
          </div>
          <div className="rounded-full border border-electric bg-electric/15 px-3 py-1 text-xs font-bold text-electricText">Local</div>
        </div>
      </header>
      <div className="px-4 py-5">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 backdrop-blur">
        <div className="grid grid-cols-5 gap-1">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = item.tab === tab;
            return (
              <button key={item.tab} onClick={() => onTab(item.tab)} className={`rounded-xl px-2 py-2 text-xs font-bold ${active ? "bg-electric text-white" : "text-white/55"}`}>
                <Icon className="mx-auto mb-1 h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
