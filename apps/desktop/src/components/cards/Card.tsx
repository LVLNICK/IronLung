import { clsx } from "clsx";
import type { ComponentType, ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-2xl border border-line bg-panel/88 p-5 shadow-soft ring-1 ring-white/[0.02]", className)}>
      {children}
    </section>
  );
}

export function MetricCard({ label, value, hint, tone = "default" }: { label: string; value: string; hint: string; tone?: "default" | "good" | "warn" | "bad" }) {
  const color = {
    default: "from-transparent via-accent/70 to-transparent",
    good: "from-transparent via-mint/70 to-transparent",
    warn: "from-transparent via-amber-300/70 to-transparent",
    bad: "from-transparent via-red-400/70 to-transparent"
  }[tone];
  return (
    <Card className="relative min-h-[118px] overflow-hidden">
      <div className={clsx("absolute inset-x-0 top-0 h-px bg-gradient-to-r", color)} />
      <div className="text-sm text-white/45">{label}</div>
      <div className="mt-2 truncate text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-white/32">{hint}</div>
    </Card>
  );
}

export function SectionHeader({ title, icon: Icon, action }: { title: string; icon?: ComponentType<{ className?: string }>; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-accent" />}
        <h2 className="truncate font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  );
}
