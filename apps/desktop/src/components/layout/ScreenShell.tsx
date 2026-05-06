import type { ReactNode } from "react";

export function ScreenShell({ title, subtitle, action, children }: { title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-white">{title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-obsidian-muted">{subtitle}</p>
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}
