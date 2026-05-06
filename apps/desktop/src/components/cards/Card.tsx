import { clsx } from "clsx";
import type { ComponentType, ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-xl border border-obsidian-strong bg-obsidian-800 p-5", className)}>
      {children}
    </section>
  );
}

export function MetricCard({ label, value, hint, tone = "default" }: { label: string; value: string; hint: string; tone?: "default" | "good" | "warn" | "bad" }) {
  const stripe = {
    default: "border-l-electric",
    good: "border-l-electric",
    warn: "border-l-warn",
    bad: "border-l-danger"
  }[tone];
  const valueTone = {
    default: "text-white [text-shadow:0_0_14px_rgba(96,165,250,0.50)]",
    good: "text-white [text-shadow:0_0_14px_rgba(96,165,250,0.50)]",
    warn: "text-warn",
    bad: "text-danger"
  }[tone];
  return (
    <Card className={clsx("min-h-[118px] border-l-2", stripe)}>
      <div className="text-xs font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.55)]">{label}</div>
      <div className={clsx("mt-2 truncate font-mono text-3xl font-bold leading-tight tracking-tight", valueTone)}>{value}</div>
      <div className="mt-1 text-xs font-medium text-[rgba(255,255,255,0.5)]">{hint}</div>
    </Card>
  );
}

export function SectionHeader({ title, icon: Icon, action }: { title: string; icon?: ComponentType<{ className?: string }>; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-electric" />}
        <h2 className="truncate text-sm font-semibold uppercase tracking-wider text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}
