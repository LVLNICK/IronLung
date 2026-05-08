import { useRef, useState } from "react";
import { ChevronRight, Info, Lock, Plus, ShieldCheck, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";
import type { MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel } from "../features/analytics/mobileAnalytics";
import { BrandHeader, GlassCard } from "./HomePage";

type PhotoPanel = "none" | "how" | "guidance" | "timeline" | "selected";

export function PhotosPage(_: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<PhotoPanel>("none");
  const [selectedPhoto, setSelectedPhoto] = useState("");

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <BrandHeader />
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.8rem] font-black leading-tight min-[400px]:text-[2rem]">Photos</h1>
          <p className="text-base text-slate-400 min-[400px]:text-lg">Private progress tracking. Photos stay on your device.</p>
        </div>
        <button onClick={() => setPanel(panel === "how" ? "none" : "how")} className="shrink-0 rounded-full border border-blue-500/40 px-4 py-2 text-blue-400">How it works</button>
      </header>
      {panel === "how" && (
        <InfoPanel title="How photo analysis works" body="IronLung Analyzer can display cached photo metrics from your desktop seed. Mobile photo upload here is local-only preview and does not upload anything." />
      )}
      <GlassCard className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 p-4 min-[400px]:grid-cols-[2rem_1fr_8.5rem] min-[400px]:gap-4 min-[400px]:p-5">
        <Lock className="h-8 w-8 text-blue-400" />
        <div className="min-w-0"><div className="text-lg font-black text-blue-400 min-[400px]:text-xl">Private & local</div><p className="text-sm text-slate-400 min-[400px]:text-base">Your photos never leave your device. Analysis runs after your consent.</p></div>
        <button onClick={openFilePicker} className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-500 text-base font-black min-[400px]:col-span-1 min-[400px]:h-14 min-[400px]:text-lg">Add Photo <Plus className="h-5 w-5" /></button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setSelectedPhoto(file.name);
            setPanel("selected");
          }}
        />
      </GlassCard>
      {panel === "selected" && selectedPhoto && (
        <InfoPanel title="Photo selected locally" body={`${selectedPhoto} is selected on this phone only. Permanent photo storage and analysis still run through the desktop photo workflow.`} />
      )}
      <GlassCard className="p-4">
        <div className="mb-3 flex justify-between"><h2 className="text-lg font-black min-[400px]:text-xl">Same-pose comparison</h2><Info className="text-slate-300" /></div>
        <div className="grid grid-cols-2 gap-3">
          <PhotoCompare title="Before - Jan 08" ppi="PPI 61" />
          <PhotoCompare title="After - May 08" ppi="PPI 74" active />
        </div>
        <button onClick={() => setPanel("guidance")} className="mt-4 grid w-full grid-cols-[2.4rem_minmax(0,1fr)_1.25rem] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left min-[400px]:grid-cols-[3rem_1fr_1.5rem] min-[400px]:gap-4 min-[400px]:p-4">
          <TrendingUp className="h-8 w-8 text-blue-400" />
          <div className="min-w-0"><div className="text-lg font-black min-[400px]:text-xl">Change summary</div><div className="text-sm text-emerald-400 min-[400px]:text-base">+13 PPI, +8 lb bodyweight, quality matched: 92%</div></div>
          <ChevronRight />
        </button>
      </GlassCard>
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <h2 className="text-base font-black min-[400px]:text-lg">Progress photo index</h2>
          <LineMini />
          <div className="text-[2.35rem] font-black leading-none text-blue-400 min-[400px]:text-[3rem]">74</div>
          <div className="flex justify-between gap-2 text-sm"><span className="text-slate-400">PPI SCORE</span><span className="text-emerald-400">+13 vs Jan 08</span></div>
        </GlassCard>
        <GlassCard className="p-4">
          <h2 className="text-base font-black min-[400px]:text-lg">Retake quality checklist</h2>
          <Checklist label="Same pose" value="matched" />
          <Checklist label="Lighting" value="good" />
          <Checklist label="Framing" value="good" />
          <Checklist label="Pump tag" value="missing" warn />
          <Checklist label="Bodyweight" value="logged" />
          <button onClick={() => setPanel(panel === "guidance" ? "none" : "guidance")} className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-blue-400">View guidance <ChevronRight /></button>
        </GlassCard>
      </div>
      {panel === "guidance" && (
        <InfoPanel title="Retake guidance" body="Use the same pose, camera height, distance, lighting, pump tag, and bodyweight entry each time. This keeps PPI trend changes more comparable." />
      )}
      <GlassCard className="p-4">
        <div className="mb-4 flex justify-between gap-2"><h2 className="text-base font-black min-[400px]:text-lg">Your photo timeline</h2><button onClick={() => setPanel(panel === "timeline" ? "none" : "timeline")} className="shrink-0 text-blue-400">View all</button></div>
        <div className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-6">
          {["Jan 08", "May 08", "Apr 24", "Apr 10", "Mar 27", "Mar 13"].map((date, index) => <TimelineThumb key={date} date={date} active={index === 1} ppi={index === 1 ? "PPI 74" : index === 0 ? "PPI 61" : ""} />)}
        </div>
      </GlassCard>
      {panel === "timeline" && (
        <InfoPanel title="Full cached timeline" body="All available cached photo entries are shown. Import a fresh desktop seed after adding new desktop photos." />
      )}
      <div className="flex items-center gap-3 px-2 text-sm text-slate-400"><ShieldCheck className="h-5 w-5 text-blue-400" />By adding photos, you agree to local analysis only. <button onClick={() => setPanel("how")} className="text-blue-400">Learn more</button></div>
    </div>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return <GlassCard className="border-blue-500/30 bg-blue-500/10 p-4"><div className="text-sm font-black uppercase tracking-wider text-blue-400">{title}</div><p className="mt-2 text-sm leading-relaxed text-slate-300">{body}</p></GlassCard>;
}

function PhotoCompare({ title, ppi, active }: { title: string; ppi: string; active?: boolean }) {
  return <div className="rounded-2xl border border-white/10 bg-black/10 p-2 min-[400px]:p-3"><div className="mb-3 flex justify-between gap-2 text-[0.68rem] font-black uppercase min-[400px]:text-sm"><span>{title}</span><span className={`shrink-0 rounded-full px-2 py-1 min-[400px]:px-3 ${active ? "bg-blue-500" : "bg-slate-700"}`}>{ppi}</span></div><PhotoFigure /></div>;
}

function PhotoFigure() {
  return <div className="relative h-40 overflow-hidden rounded-xl border border-white/5 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[length:22px_22px] min-[400px]:h-56"><div className="absolute left-1/2 top-5 h-7 w-7 -translate-x-1/2 rounded-full bg-slate-500 min-[400px]:h-9 min-[400px]:w-9" /><div className="absolute left-1/2 top-12 h-20 w-12 -translate-x-1/2 rounded-[2rem] bg-blue-500/60 min-[400px]:top-14 min-[400px]:h-24 min-[400px]:w-16" /><div className="absolute left-[31%] top-16 h-20 w-4 rotate-[20deg] rounded-full bg-blue-500/55 min-[400px]:top-20 min-[400px]:h-24 min-[400px]:w-5" /><div className="absolute right-[31%] top-16 h-20 w-4 -rotate-[20deg] rounded-full bg-blue-500/55 min-[400px]:top-20 min-[400px]:h-24 min-[400px]:w-5" /><div className="absolute left-[42%] top-28 h-20 w-4 rotate-12 rounded-full bg-blue-500/55 min-[400px]:top-32 min-[400px]:h-24 min-[400px]:w-5" /><div className="absolute right-[42%] top-28 h-20 w-4 -rotate-12 rounded-full bg-blue-500/55 min-[400px]:top-32 min-[400px]:h-24 min-[400px]:w-5" /></div>;
}

function LineMini() {
  return <svg className="my-4 h-32 w-full overflow-visible" viewBox="0 0 180 90"><path d="M8 72 L45 60 L82 48 L116 45 L148 29 L174 16" fill="none" stroke="#3b82f6" strokeWidth="3" /><path d="M8 72 L45 60 L82 48 L116 45 L148 29 L174 16 L174 90 L8 90Z" fill="rgba(59,130,246,.12)" />{[8,45,82,116,148,174].map((x,i)=><circle key={x} cx={x} cy={[72,60,48,45,29,16][i]} r="4" fill="#3b82f6" />)}</svg>;
}

function Checklist({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return <div className="mt-3 flex items-center justify-between gap-2"><span className="flex items-center gap-2">{warn ? <AlertTriangle className="h-5 w-5 text-yellow-300" /> : <CheckCircle className="h-5 w-5 text-emerald-400" />}{label}</span><span className={warn ? "text-yellow-300" : "text-emerald-400"}>{value}</span></div>;
}

function TimelineThumb({ date, ppi, active }: { date: string; ppi?: string; active?: boolean }) {
  return <div className="text-center"><div className={`rounded-xl border ${active ? "border-blue-500" : "border-white/10"} p-1`}><PhotoFigure /></div><div className="mt-2 text-sm text-slate-300">{date}</div>{ppi && <div className={`mx-auto mt-1 rounded-full px-2 py-1 text-xs ${active ? "bg-blue-500 text-white" : "bg-slate-700"}`}>{ppi}</div>}</div>;
}
