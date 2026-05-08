import { BarChart3, Camera, Dumbbell, Home, Settings } from "lucide-react";
import type { ReactNode } from "react";
import type { MobileTab } from "../types";

const tabs: Array<{ tab: MobileTab; label: string; icon: typeof Dumbbell }> = [
  { tab: "home", label: "Home", icon: Home },
  { tab: "train", label: "Train", icon: Dumbbell },
  { tab: "analytics", label: "Analytics", icon: BarChart3 },
  { tab: "photos", label: "Photos", icon: Camera },
  { tab: "settings", label: "Settings", icon: Settings }
];

export function MobileShell({ tab, onTab, children }: { tab: MobileTab; onTab: (tab: MobileTab) => void; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#02040a] text-white">
      <div className="mx-auto min-h-screen max-w-[430px] overflow-x-hidden bg-[radial-gradient(circle_at_22%_-6%,rgba(59,130,246,0.22),transparent_34%),radial-gradient(circle_at_90%_8%,rgba(96,165,250,0.10),transparent_28%),linear-gradient(160deg,#070b13_0%,#05070d_48%,#0b1220_100%)] shadow-[0_0_90px_rgba(0,0,0,0.88)]">
        <StatusBar />
        <div className="px-4 pb-32 text-[15px] leading-snug min-[400px]:px-5">{children}</div>
        <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] border-t border-white/10 bg-[#0b111d]/85 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 shadow-[0_-22px_70px_rgba(0,0,0,0.62)] backdrop-blur-2xl min-[400px]:px-4">
          <div className="grid grid-cols-5 gap-1 rounded-[1.75rem] border border-white/[0.06] bg-white/[0.035] p-1">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = item.tab === tab;
              return (
                <button key={item.tab} onClick={() => onTab(item.tab)} aria-current={active ? "page" : undefined} className={`min-h-[4rem] rounded-2xl px-1 text-[0.68rem] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 active:scale-[0.98] ${active ? "bg-white/[0.08] text-[#3b82f6] shadow-[inset_0_0_30px_rgba(59,130,246,0.18),0_10px_30px_rgba(0,0,0,0.24)]" : "text-slate-300 hover:text-white"}`}>
                  <Icon className={`mx-auto mb-1 h-5 w-5 ${active ? "fill-current stroke-[2.35]" : "stroke-[2.35]"}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="mx-auto mt-2 h-1.5 w-36 rounded-full bg-white" />
        </nav>
      </div>
    </main>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-7 pb-5 pt-[calc(env(safe-area-inset-top)+1.35rem)] text-white">
      <div className="text-[1.05rem] font-black tracking-tight">9:41</div>
      <div className="flex items-center gap-1.5">
        <SignalIcon />
        <WifiIcon />
        <div className="h-3.5 w-6 rounded-[0.22rem] border-2 border-white/85 p-[2px]">
          <div className="h-full w-full rounded-[0.08rem] bg-white" />
        </div>
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <div className="flex h-4 items-end gap-[2px]">
      {[6, 9, 12, 15].map((height) => <span key={height} className="w-[3px] rounded-full bg-white" style={{ height }} />)}
    </div>
  );
}

function WifiIcon() {
  return (
    <svg className="h-4 w-5 text-white" viewBox="0 0 24 18" fill="none" aria-hidden="true">
      <path d="M2 5.5C7.8.8 16.2.8 22 5.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M6.2 10c3.4-2.8 8.2-2.8 11.6 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M10.3 14.2c1.1-.8 2.3-.8 3.4 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
