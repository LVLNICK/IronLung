import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";

export const fieldClass = "h-10 rounded-md border border-obsidian-strong bg-obsidian-900 px-3 text-sm text-white outline-none transition placeholder:text-obsidian-subtle focus-visible:border-electric focus-visible:ring-1 focus-visible:ring-electric";

export function Button({ children, icon: Icon, variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ComponentType<{ className?: string }>; variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-40",
        variant === "primary" && "h-12 border-0 bg-electric font-bold text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] hover:bg-blue-500",
        variant === "ghost" && "border border-obsidian-strong bg-obsidian-700 font-semibold text-obsidian-muted hover:border-electric hover:text-white",
        variant === "danger" && "border border-red-400/30 bg-danger-muted text-danger hover:bg-red-500/15",
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function IconButton({ label, icon: Icon, onClick, variant = "ghost" }: { label: string; icon: ComponentType<{ className?: string }>; onClick: () => void; variant?: "ghost" | "danger" }) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className={clsx(
        "grid h-10 w-10 place-items-center rounded-lg border transition",
        variant === "danger" ? "border-red-400/30 bg-danger-muted text-danger" : "border-obsidian-strong bg-obsidian-700 text-obsidian-muted hover:border-electric hover:text-white"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <input type={type} className={fieldClass} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />;
}

export function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>;
}

export function TextArea({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <textarea className="min-h-24 rounded-md border border-obsidian-strong bg-obsidian-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-obsidian-subtle focus-visible:border-electric focus-visible:ring-1 focus-visible:ring-electric" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />;
}
