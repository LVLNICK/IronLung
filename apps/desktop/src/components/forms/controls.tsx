import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";

export const fieldClass = "h-10 rounded-lg border border-line bg-black/24 px-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-accent/70";

export function Button({ children, icon: Icon, variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ComponentType<{ className?: string }>; variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition disabled:opacity-40",
        variant === "primary" && "bg-white text-ink hover:bg-accent",
        variant === "ghost" && "border border-line bg-white/[0.04] text-white/70 hover:border-accent/50 hover:text-white",
        variant === "danger" && "border border-red-400/30 bg-red-500/10 text-red-100 hover:bg-red-500/15",
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
        variant === "danger" ? "border-red-400/30 bg-red-500/10 text-red-100" : "border-line bg-white/[0.04] text-white/70 hover:border-accent/50 hover:text-white"
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
  return <textarea className="min-h-24 rounded-lg border border-line bg-black/24 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-accent/70" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />;
}
