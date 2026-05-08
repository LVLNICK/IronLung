import type { ComponentType, ReactNode, SelectHTMLAttributes } from "react";

type IconComponent = ComponentType<{ className?: string }>;

export function GlassCard({ children, className = "", as = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" }) {
  const Tag = as;
  return (
    <Tag className={`rounded-[1.45rem] border border-white/12 bg-[linear-gradient(135deg,rgba(25,34,50,0.88),rgba(8,12,20,0.95))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_55px_rgba(0,0,0,0.34)] ${className}`}>
      {children}
    </Tag>
  );
}

export function MobilePage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-4 scroll-smooth ${className}`}>{children}</div>;
}

export function MobileHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[2rem] font-black leading-none tracking-tight text-white min-[390px]:text-[2.25rem]">{title}</h1>
        {subtitle && <p className="mt-2 text-base leading-relaxed text-slate-400">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function MobileCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <GlassCard className={`p-4 ${className}`}>{children}</GlassCard>;
}

export function MobilePrimaryButton({ children, onClick, disabled = false, type = "button", className = "" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; className?: string }) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`min-h-[44px] rounded-2xl bg-blue-500 px-4 text-sm font-black text-white shadow-[0_0_32px_rgba(59,130,246,0.38)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 active:scale-[0.98] disabled:opacity-40 ${className}`}>
      {children}
    </button>
  );
}

export function MobileGhostButton({ children, onClick, disabled = false, type = "button", className = "" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; className?: string }) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`min-h-[44px] rounded-2xl border border-white/15 bg-white/[0.045] px-4 text-sm font-bold text-slate-100 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 active:scale-[0.98] disabled:opacity-40 ${className}`}>
      {children}
    </button>
  );
}

export const MobileSecondaryButton = MobileGhostButton;

export function MobileButton({ children, onClick, variant = "primary", disabled = false, type = "button", className = "" }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger"; disabled?: boolean; type?: "button" | "submit"; className?: string }) {
  if (variant === "primary") return <MobilePrimaryButton type={type} disabled={disabled} onClick={onClick} className={className}>{children}</MobilePrimaryButton>;
  const danger = variant === "danger" ? "border-red-400/40 bg-red-500/10 text-red-200" : "";
  return <MobileGhostButton type={type} disabled={disabled} onClick={onClick} className={`${danger} ${className}`}>{children}</MobileGhostButton>;
}

export function MobileSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`min-h-[44px] rounded-xl border border-white/12 bg-[#070a10] px-3 text-base text-white outline-none focus:border-blue-400 ${props.className ?? ""}`} />;
}

export function SectionTitle({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-xs font-black uppercase tracking-[0.18em] text-blue-400">{label}</h2>
      {action && <button onClick={onAction} className="min-h-[44px] shrink-0 rounded-xl px-2 text-sm font-bold text-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">{action}</button>}
    </div>
  );
}

export function IconTile({ icon: Icon, size = "normal", tone = "blue" }: { icon: IconComponent; size?: "small" | "normal" | "large"; tone?: "blue" | "green" | "yellow" | "slate" }) {
  const sizeClass = size === "large" ? "h-14 w-14 min-[400px]:h-16 min-[400px]:w-16" : size === "small" ? "h-9 w-9" : "h-11 w-11";
  const iconClass = size === "large" ? "h-8 w-8" : size === "small" ? "h-[1.125rem] w-[1.125rem]" : "h-6 w-6";
  const toneClass = tone === "green"
    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-400"
    : tone === "yellow"
      ? "border-yellow-300/30 bg-yellow-400/10 text-yellow-300"
      : tone === "slate"
        ? "border-white/12 bg-white/[0.06] text-slate-300"
        : "border-blue-500/35 bg-blue-500/10 text-blue-400 shadow-[inset_0_0_24px_rgba(59,130,246,0.14)]";
  return <div className={`${sizeClass} grid shrink-0 place-items-center rounded-2xl border ${toneClass}`}><Icon className={iconClass} /></div>;
}

export function MetricChip({ icon: Icon, label, value, sub }: { icon: IconComponent; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-blue-400" />
        <span className="text-[0.68rem] font-black uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className="mt-2 font-mono text-xl font-black tracking-tight text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export function ListRow({ icon: Icon, title, subtitle, meta, onClick, tone = "blue" }: { icon?: IconComponent; title: string; subtitle?: string; meta?: ReactNode; onClick?: () => void; tone?: "blue" | "green" | "yellow" | "slate" }) {
  const content = (
    <>
      {Icon && <IconTile icon={Icon} tone={tone} />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-black text-white">{title}</div>
        {subtitle && <div className="mt-1 truncate text-sm text-slate-400">{subtitle}</div>}
      </div>
      {meta && <div className="shrink-0">{meta}</div>}
    </>
  );
  const className = "flex min-h-[64px] w-full items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-3 text-left";
  return onClick ? <button onClick={onClick} className={`${className} focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300`}>{content}</button> : <div className={className}>{content}</div>;
}

export function StatPill({ label, value }: { label: string; value: string }) {
  return <MetricChip icon={() => null} label={label} value={value} />;
}

export function StatusPill({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "yellow" | "red" | "slate" }) {
  const toneClass = tone === "green"
    ? "bg-emerald-500/15 text-emerald-300"
    : tone === "yellow"
      ? "bg-yellow-400/10 text-yellow-300"
      : tone === "red"
        ? "bg-red-500/10 text-red-300"
        : tone === "slate"
          ? "bg-white/[0.07] text-slate-300"
          : "bg-blue-500/15 text-blue-300";
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${toneClass}`}>{children}</span>;
}

export function MiniTrendBars({ values, labels, activeIndex = values.length - 1, className = "" }: { values: number[]; labels?: string[]; activeIndex?: number; className?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className={`flex h-24 items-end justify-between gap-2 ${className}`}>
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
          <div className={`w-full max-w-8 rounded-lg ${index === activeIndex ? "bg-blue-500 shadow-[0_0_18px_rgba(59,130,246,0.35)]" : "bg-slate-600/65"}`} style={{ height: `${Math.max(16, (value / max) * 86)}%` }} />
          {labels?.[index] && <div className={`text-xs ${index === activeIndex ? "font-black text-blue-400" : "text-slate-500"}`}>{labels[index]}</div>}
        </div>
      ))}
    </div>
  );
}

export function CircularScore({ value, label = "score", size = "normal" }: { value: number; label?: string; size?: "normal" | "large" }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  const sizeClass = size === "large" ? "h-32 w-32" : "h-24 w-24";
  return (
    <div className={`relative ${sizeClass} shrink-0`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(71,85,105,0.55)" strokeWidth="9" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#3b82f6" strokeLinecap="round" strokeWidth="9" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className={`${size === "large" ? "text-4xl" : "text-2xl"} font-black leading-none text-white`}>{Math.round(value)}</div>
        <div className="mt-1 text-xs text-slate-400">{label}</div>
      </div>
    </div>
  );
}

export function EmptyMobileState({ icon: Icon, title, body, actionLabel, onAction }: { icon: IconComponent; title: string; body: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <GlassCard className="border-dashed p-8 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-white/[0.06]"><Icon className="h-6 w-6 text-slate-400" /></div>
      <div className="text-lg font-black text-white">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
      {actionLabel && onAction && <MobilePrimaryButton onClick={onAction} className="mt-5 w-full">{actionLabel}</MobilePrimaryButton>}
    </GlassCard>
  );
}

export const EmptyState = EmptyMobileState;
