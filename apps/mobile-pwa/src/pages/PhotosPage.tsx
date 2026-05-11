import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle, ChevronRight, Info, Lock, Plus, ShieldCheck, TrendingUp } from "lucide-react";
import type { MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel } from "../features/analytics/mobileAnalytics";
import { EmptyMobileState, GlassCard, IconTile, MobileHeader, MobilePage, MobilePrimaryButton, SectionTitle, StatusPill } from "../components/MobilePrimitives";
import { BrandHeader } from "./HomePage";

type PhotoPanel = "none" | "how" | "guidance" | "timeline" | "selected";

export function PhotosPage(_: { snapshot: MobileSnapshot; analyzer: MobileAnalyzerModel }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<PhotoPanel>("none");
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState("");
  const hasPhotoPreview = Boolean(selectedPhotoUrl);

  useEffect(() => () => {
    if (selectedPhotoUrl) URL.revokeObjectURL(selectedPhotoUrl);
  }, [selectedPhotoUrl]);

  return (
    <MobilePage>
      <BrandHeader />
      <MobileHeader title="Photos" subtitle="Private progress tracking. Photos stay on your device." action={<button onClick={() => setPanel(panel === "how" ? "none" : "how")} className="min-h-[44px] shrink-0 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300">How it works</button>} />

      {panel === "how" && (
        <InfoPanel title="Local-only photo analysis" body="IronLog does not upload progress photos. Mobile currently previews selected files locally; desktop remains the permanent photo analysis source." />
      )}

      <GlassCard className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3 p-4 min-[400px]:grid-cols-[2.75rem_1fr_8.75rem]">
        <IconTile icon={Lock} />
        <div className="min-w-0">
          <div className="text-xl font-black text-blue-300">Private & local</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">Photos never leave your device. Analysis runs only after consent.</p>
        </div>
        <MobilePrimaryButton onClick={() => fileInputRef.current?.click()} className="col-span-2 flex items-center justify-center gap-2 min-[400px]:col-span-1">
          Add Photo <Plus className="h-5 w-5" />
        </MobilePrimaryButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (selectedPhotoUrl) URL.revokeObjectURL(selectedPhotoUrl);
            setSelectedPhoto(file.name);
            setSelectedPhotoUrl(URL.createObjectURL(file));
            setPanel("selected");
          }}
        />
      </GlassCard>

      {panel === "selected" && selectedPhoto && (
        <InfoPanel title="Photo selected on this phone" body={`${selectedPhoto} is held by the browser file picker for this session only. It is not uploaded or permanently analyzed by the mobile PWA yet.`} />
      )}

      {!hasPhotoPreview ? (
        <EmptyMobileState icon={Camera} title="No mobile photo cache yet" body="Start with front, side, and back photos. Keep the same lighting, distance, pose, and time of day. No cloud upload is used." />
      ) : (
        <>
          <GlassCard className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-black">Same-pose comparison</h2>
              <Info className="h-5 w-5 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <PhotoCompare title="Before" ppi="No baseline" />
              <PhotoCompare title="Selected" ppi="Preview" active imageUrl={selectedPhotoUrl} />
            </div>
            <button onClick={() => setPanel("guidance")} className="mt-4 grid w-full grid-cols-[2.75rem_minmax(0,1fr)_1.25rem] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left">
              <TrendingUp className="h-7 w-7 text-blue-400" />
              <div className="min-w-0">
                <div className="text-lg font-black">Change summary</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-400">Permanent PPI scoring requires desktop analysis data.</div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </button>
          </GlassCard>

          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="p-4">
              <h2 className="text-base font-black">Progress Photo Index</h2>
              <LineMini />
              <div className="font-mono text-[2.8rem] font-black leading-none text-blue-400">--</div>
              <div className="mt-1 text-sm text-slate-400">Awaiting analysis</div>
            </GlassCard>
            <GlassCard className="p-4">
              <h2 className="text-base font-black">Retake checklist</h2>
              <Checklist label="Same pose" value="needed" warn />
              <Checklist label="Lighting" value="check" warn />
              <Checklist label="Framing" value="check" warn />
              <Checklist label="Pump tag" value="missing" warn />
              <Checklist label="Bodyweight" value="optional" />
              <button onClick={() => setPanel(panel === "guidance" ? "none" : "guidance")} className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-blue-400">View guidance <ChevronRight className="h-5 w-5" /></button>
            </GlassCard>
          </div>
        </>
      )}

      {panel === "guidance" && (
        <InfoPanel title="Retake guidance" body="Use the same camera height, distance, pose, lighting, pump tag, and bodyweight timing each time. PPI is an experimental progress metric, not a medical or attractiveness score." />
      )}

      <GlassCard className="p-4">
        <SectionTitle label="Photo timeline" action="View all" onAction={() => setPanel(panel === "timeline" ? "none" : "timeline")} />
        {hasPhotoPreview ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            <TimelineThumb date="Selected" ppi="Preview" active />
            {["Previous", "Older", "Archive"].map((date) => <TimelineThumb key={date} date={date} />)}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-400">No cached timeline entries on this phone yet.</p>
        )}
      </GlassCard>
      {panel === "timeline" && <InfoPanel title="Timeline cache" body="The mobile PWA shows only local or imported metadata. It does not fetch photos from a server." />}

      <div className="flex items-center gap-3 px-2 text-sm leading-relaxed text-slate-400">
        <ShieldCheck className="h-5 w-5 shrink-0 text-blue-400" />
        <span>By adding photos, you agree to local analysis only.</span>
        <button onClick={() => setPanel("how")} className="shrink-0 text-blue-400">Learn more</button>
      </div>
    </MobilePage>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return <GlassCard className="border-blue-500/30 bg-blue-500/10 p-4"><div className="text-sm font-black uppercase tracking-wider text-blue-400">{title}</div><p className="mt-2 text-sm leading-relaxed text-slate-300">{body}</p></GlassCard>;
}

function PhotoCompare({ title, ppi, active, imageUrl }: { title: string; ppi: string; active?: boolean; imageUrl?: string }) {
  return (
    <div className={`rounded-2xl border p-2 ${active ? "border-blue-500/65 bg-blue-500/10" : "border-white/10 bg-black/10"}`}>
      <div className="mb-2 flex items-center justify-between gap-2 text-[0.68rem] font-black uppercase tracking-wide">
        <span>{title}</span><StatusPill tone={active ? "blue" : "slate"}>{ppi}</StatusPill>
      </div>
      <PhotoFigure imageUrl={imageUrl} />
    </div>
  );
}

function PhotoFigure({ imageUrl }: { imageUrl?: string }) {
  if (imageUrl) return <img src={imageUrl} alt="Selected local progress preview" className="h-40 w-full rounded-xl border border-white/5 object-cover" />;
  return (
    <div className="relative h-40 overflow-hidden rounded-xl border border-white/5 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[length:22px_22px]">
      <div className="absolute left-1/2 top-5 h-7 w-7 -translate-x-1/2 rounded-full bg-slate-500" />
      <div className="absolute left-1/2 top-12 h-20 w-12 -translate-x-1/2 rounded-[2rem] bg-blue-500/60" />
      <div className="absolute left-[30%] top-16 h-[4.5rem] w-4 rotate-[20deg] rounded-full bg-blue-500/45" />
      <div className="absolute right-[30%] top-16 h-[4.5rem] w-4 -rotate-[20deg] rounded-full bg-blue-500/45" />
      <div className="absolute left-[42%] top-28 h-[4.5rem] w-4 rotate-12 rounded-full bg-blue-500/45" />
      <div className="absolute right-[42%] top-28 h-[4.5rem] w-4 -rotate-12 rounded-full bg-blue-500/45" />
    </div>
  );
}

function LineMini() {
  return <svg className="my-4 h-28 w-full overflow-visible" viewBox="0 0 180 90"><path d="M8 72 L45 62 L82 55 L116 47 L148 36 L174 25" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" /><path d="M8 72 L45 62 L82 55 L116 47 L148 36 L174 25 L174 90 L8 90Z" fill="rgba(59,130,246,.12)" /></svg>;
}

function Checklist({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return <div className="mt-3 flex items-center justify-between gap-2 text-sm"><span className="flex items-center gap-2">{warn ? <AlertTriangle className="h-5 w-5 text-yellow-300" /> : <CheckCircle className="h-5 w-5 text-emerald-400" />}{label}</span><span className={warn ? "text-yellow-300" : "text-emerald-400"}>{value}</span></div>;
}

function TimelineThumb({ date, ppi, active }: { date: string; ppi?: string; active?: boolean }) {
  return <div className="w-24 shrink-0 text-center"><div className={`rounded-xl border ${active ? "border-blue-500" : "border-white/10"} p-1`}><PhotoFigure /></div><div className="mt-2 text-sm text-slate-300">{date}</div>{ppi && <div className="mx-auto mt-1 rounded-full bg-blue-500 px-2 py-1 text-xs font-bold text-white">{ppi}</div>}</div>;
}
