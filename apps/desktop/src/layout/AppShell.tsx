import { clsx } from "clsx";
import { Command, Dumbbell } from "lucide-react";
import type { ReactNode } from "react";
import { navigationItems, type AppScreen } from "../app/navigation";

export function AppShell({ screen, onNavigate, children }: { screen: AppScreen; onNavigate: (screen: AppScreen) => void; children: ReactNode }) {
  return (
    <main className="min-h-screen text-white">
      <div className="grid min-h-screen grid-cols-[280px_1fr]">
        <aside className="border-r border-line bg-ink/88 px-5 py-6 shadow-soft backdrop-blur-xl">
          <div className="mb-7 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-accent/30 bg-accent/15">
              <Dumbbell className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">IronLung</div>
              <div className="text-xs text-white/45">Fitness command center</div>
            </div>
          </div>
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = screen === item.screen;
              return (
                <button
                  key={item.screen}
                  aria-label={item.screen}
                  onClick={() => onNavigate(item.screen)}
                  className={clsx(
                    "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
                    active ? "bg-white text-ink shadow-soft" : "text-white/62 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.screen}</div>
                    <div className={clsx("truncate text-xs", active ? "text-ink/55" : "text-white/35")}>{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
          <div className="mt-8 rounded-xl border border-line bg-panel/75 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Command className="h-4 w-4 text-accent" />
              Local-first
            </div>
            <p className="text-xs leading-5 text-white/50">No account, no cloud sync, no tracking. Import, analyze, and export locally.</p>
          </div>
        </aside>
        <section className="min-w-0 px-8 py-6">{children}</section>
      </div>
    </main>
  );
}
