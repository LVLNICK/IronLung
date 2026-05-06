import type { ComponentType, ReactNode } from "react";

export function EmptyState({ icon: Icon, title, body, action }: { icon: ComponentType<{ className?: string }>; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-obsidian-strong bg-obsidian-800 px-6 py-20 text-center">
      <div>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-obsidian-700">
          <Icon className="h-5 w-5 text-obsidian-subtle" />
        </div>
        <div className="mb-2 text-lg font-bold text-white">{title}</div>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-obsidian-muted">{body}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
