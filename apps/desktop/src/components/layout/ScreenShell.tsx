import type { ReactNode } from "react";

export function ScreenShell({ title, subtitle, action, children }: { title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-white/48">{subtitle}</p>
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}
