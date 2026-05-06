import type { ComponentType, ReactNode } from "react";

export function EmptyState({ icon: Icon, title, body, action }: { icon: ComponentType<{ className?: string }>; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-white/12 bg-white/[0.02] p-6 text-center">
      <div>
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl border border-line bg-white/[0.04]">
          <Icon className="h-5 w-5 text-white/45" />
        </div>
        <div className="font-medium">{title}</div>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-white/45">{body}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
