import { ChevronRight, Dumbbell, Shield, Target, TrendingUp, Zap } from "lucide-react";
import type { MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel } from "../features/analytics/mobileAnalytics";
import { formatNumber } from "./AnalyzerShared";

export function HomePage({ analyzer }: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel; onOpenSync: () => void }) {
  const volume = formatNumber(analyzer.summary.totals.volume || 18400);
  const bestPr = analyzer.recentPrs[0];
  const bestLift = analyzer.strengthRows[0];
  return (
    <div className="space-y-4">
      <BrandHeader />
      <section>
        <h1 className="text-[2rem] font-black leading-tight tracking-tight">Good morning, Alex.</h1>
        <p className="text-lg text-slate-400">You're on track. Let's get better today.</p>
      </section>

      <GlassCard className="p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_8.75rem] items-center gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-blue-400">Today's readiness</div>
            <h2 className="mt-3 text-[1.55rem] font-black leading-tight">Upper Strength Ready</h2>
            <p className="mt-3 text-[1rem] leading-relaxed text-slate-300">Chest/back ratio is low and recovery is good. Last hard press session was 5 days ago.</p>
          </div>
          <ReadinessDial value={82} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button className="flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-blue-500 text-lg font-black text-white shadow-[0_0_32px_rgba(59,130,246,0.42)]">Train Today <ChevronRight /></button>
          <button className="min-h-14 rounded-2xl border border-white/25 bg-white/[0.03] text-lg font-bold text-white">Edit Plan</button>
        </div>
      </GlassCard>

      <GlassCard className="grid grid-cols-[4.6rem_1fr_1.5rem] items-center gap-4 p-5">
        <IconTile icon={Target} size="large" />
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-blue-400">What to focus on</div>
          <div className="mt-2 text-xl font-black">Add rear delt + row work</div>
          <p className="mt-1 text-sm text-slate-400">Back exposure is 38% lower than chest.</p>
        </div>
        <ChevronRight className="h-7 w-7 text-white" />
      </GlassCard>

      <GlassCard className="grid grid-cols-[1fr_13rem] items-end gap-4 p-5">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-blue-400">Weekly load trend</div>
          <div className="mt-3 text-[2.25rem] font-black leading-none">{volume} lb</div>
          <p className="mt-3 text-lg text-slate-400">+12% vs last week</p>
        </div>
        <WeekBars />
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <div className="text-xs font-black uppercase tracking-wider text-blue-400">Recent PR</div>
          <div className="mt-4 flex items-center gap-3">
            <IconTile icon={Dumbbell} />
            <div>
              <div className="text-xl font-black">{bestLift?.exerciseName ?? "Bench Press"}</div>
              <div className="mt-1 text-2xl font-black text-blue-400">{bestPr ? formatNumber(bestPr.value) : "225"} lb x 5</div>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-slate-400"><span>+10 lb from last best</span><ChevronRight /></div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs font-black uppercase tracking-wider text-blue-400">Recovery check</div>
          <StatusRow label="Fatigue" value="High" tone="yellow" />
          <StatusRow label="Sleep" value="Good" tone="green" sub="7h 42m" />
          <StatusRow label="Soreness" value="Low" tone="green" />
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-blue-400">View details <ChevronRight /></div>
        </GlassCard>
      </div>

      <GlassCard className="grid grid-cols-[4.6rem_1fr_6rem] items-center gap-4 p-5">
        <IconTile icon={Zap} size="large" />
        <div>
          <div className="text-xl font-black">Momentum is building.</div>
          <p className="mt-1 text-slate-400">Keep pushing this week.</p>
        </div>
        <MiniDial value="6" label="day streak" />
      </GlassCard>
    </div>
  );
}

export function BrandHeader() {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.45)]" style={{ clipPath: "polygon(25% 0,75% 0,100% 25%,100% 75%,75% 100%,25% 100%,0 75%,0 25%)" }} />
        <div>
          <div className="text-[1.65rem] font-black leading-none">IronLung</div>
          <div className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">Local-first fitness</div>
        </div>
      </div>
      <div className="relative">
        <span className="absolute right-0 top-0 h-3 w-3 rounded-full bg-blue-500" />
        <Shield className="h-8 w-8 text-white" />
      </div>
    </div>
  );
}

export function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.45rem] border border-white/12 bg-[linear-gradient(135deg,rgba(26,35,51,0.88),rgba(12,17,27,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_22px_50px_rgba(0,0,0,0.32)] ${className}`}>{children}</section>;
}

export function IconTile({ icon: Icon, size = "normal" }: { icon: typeof Dumbbell; size?: "normal" | "large" }) {
  return <div className={`${size === "large" ? "h-16 w-16" : "h-11 w-11"} grid place-items-center rounded-2xl border border-blue-500/35 bg-blue-500/10 text-blue-400 shadow-[inset_0_0_24px_rgba(59,130,246,0.14)]`}><Icon className={size === "large" ? "h-9 w-9" : "h-6 w-6"} /></div>;
}

function ReadinessDial({ value }: { value: number }) {
  const arcPath = "M 24 104 C 30 32, 130 32, 136 104";
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 160 140" aria-hidden="true">
        <defs>
          <linearGradient id="readiness-blue" x1="24" y1="104" x2="136" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2f7dff" />
            <stop offset="1" stopColor="#4f91ff" />
          </linearGradient>
          <filter id="readiness-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={arcPath} pathLength="100" fill="none" stroke="rgba(55,65,81,0.72)" strokeWidth="13" strokeLinecap="round" />
        <path d={arcPath} pathLength="100" fill="none" stroke="url(#readiness-blue)" strokeWidth="13" strokeLinecap="round" strokeDasharray={`${Math.min(100, Math.max(0, value))} 100`} filter="url(#readiness-glow)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-12 text-center">
        <div className="text-[2.85rem] font-black leading-[0.86] tracking-tight">{value}</div>
        <div className="mt-2 text-[1.28rem] leading-none text-slate-400">/100</div>
        <div className="mt-2 text-[1rem] leading-none text-slate-400">readiness</div>
      </div>
    </div>
  );
}

function WeekBars() {
  const bars = [34, 46, 42, 56, 64, 66, 88];
  return (
    <div className="flex h-28 items-end justify-between gap-4">
      {bars.map((height, index) => (
        <div key={index} className="flex flex-col items-center gap-2">
          <div className={`w-8 rounded-lg ${index === bars.length - 1 ? "bg-blue-500" : "bg-slate-600/70"}`} style={{ height }} />
          <div className={`text-lg ${index === bars.length - 1 ? "font-black text-blue-400" : "text-slate-400"}`}>{"MTWTFSS"[index]}</div>
        </div>
      ))}
    </div>
  );
}

function StatusRow({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: "green" | "yellow" }) {
  const color = tone === "green" ? "text-emerald-400 bg-emerald-500/15" : "text-yellow-300 bg-yellow-500/10";
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <div>
        <div className="text-lg font-bold">{label}</div>
        <div className="text-sm text-slate-400">{sub ?? "Low"}</div>
      </div>
      <span className={`rounded-full px-4 py-1.5 font-bold ${color}`}>{value}</span>
    </div>
  );
}

function MiniDial({ value, label }: { value: string; label: string }) {
  return (
    <div className="grid h-24 w-24 place-items-center rounded-full border-[10px] border-blue-500/90 border-b-slate-700 border-r-blue-500/80">
      <div className="text-center">
        <div className="text-3xl font-black">{value}</div>
        <div className="text-xs text-slate-300">{label}</div>
      </div>
    </div>
  );
}
