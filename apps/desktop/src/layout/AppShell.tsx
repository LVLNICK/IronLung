import { clsx } from "clsx";
import { Command, Dumbbell } from "lucide-react";
import type { ReactNode } from "react";
import { navigationItems, type AppScreen } from "../app/navigation";

export function AppShell({ screen, onNavigate, children }: { screen: AppScreen; onNavigate: (screen: AppScreen) => void; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-start bg-obsidian-900 text-white">
      <div className="flex min-h-screen w-full items-start">
        <aside className="sticky top-0 z-10 flex min-h-screen w-[260px] shrink-0 flex-col border-r border-obsidian-strong bg-obsidian-800">
          <div className="flex items-center gap-3 p-6 pb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric glow-positive">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white">IronLung</div>
              <div className="text-xs font-semibold uppercase tracking-widest text-obsidian-muted">Local-First Fitness</div>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 px-3 py-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = screen === item.screen;
              return (
                <button
                  key={item.screen}
                  aria-label={item.screen}
                  onClick={() => onNavigate(item.screen)}
                  className={clsx(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150",
                    active ? "bg-electric font-semibold text-white" : "text-obsidian-muted hover:bg-obsidian-600 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{item.screen}</div>
                    <div className={clsx("truncate text-xs", active ? "text-white/80" : "text-obsidian-subtle")}>{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
          <div className="relative mx-3 mb-4 mt-auto overflow-hidden rounded-xl border border-obsidian-strong bg-obsidian-700 p-4">
            <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl bg-electric" />
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white">
              <Command className="h-3.5 w-3.5 text-electric" />
              Local-first
            </div>
            <p className="text-xs leading-5 text-white/65">No account, no cloud sync, no tracking. Import, analyze, and export locally.</p>
          </div>
        </aside>
        <section className="min-h-screen min-w-0 flex-1 bg-obsidian-900 p-8 pb-24">{children}</section>
      </div>
    </main>
  );
}
