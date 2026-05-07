import type { ComponentType, ReactNode, SelectHTMLAttributes } from "react";

export function MobileCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-panel p-4 ${className}`}>{children}</section>;
}

export function MobileButton({ children, onClick, variant = "primary", disabled = false, type = "button" }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger"; disabled?: boolean; type?: "button" | "submit" }) {
  const style = variant === "primary"
    ? "bg-electric text-white shadow-glow"
    : variant === "danger"
      ? "border border-red-400/40 bg-red-500/10 text-red-200"
      : "border border-line bg-panelSoft text-white";
  return <button type={type} disabled={disabled} onClick={onClick} className={`min-h-12 rounded-xl px-4 text-sm font-bold disabled:opacity-40 ${style}`}>{children}</button>;
}

export function MobileSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`min-h-12 rounded-xl border border-line bg-ink px-3 text-base text-white outline-none focus:border-electric ${props.className ?? ""}`} />;
}

export function EmptyState({ icon: Icon, title, body }: { icon: ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-panel p-8 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-panelSoft"><Icon className="h-5 w-5 text-white/40" /></div>
      <div className="font-bold text-white">{title}</div>
      <p className="mt-1 text-sm leading-relaxed text-white/55">{body}</p>
    </div>
  );
}

export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panelSoft p-3">
      <div className="text-xs uppercase tracking-wider text-white/45">{label}</div>
      <div className="mt-1 font-mono text-xl font-bold text-white">{value}</div>
    </div>
  );
}
