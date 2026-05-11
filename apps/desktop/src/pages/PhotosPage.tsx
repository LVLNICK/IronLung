import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, FolderDown, FolderUp, Scale, Sparkles, Trash2 } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { BodyAnalysis, ProgressPhoto } from "@ironlog/core";
import { Card, MetricCard, SectionHeader } from "../components/cards/Card";
import { Button, IconButton, Input, Select, TextArea } from "../components/forms/controls";
import { ScreenShell } from "../components/layout/ScreenShell";
import { EmptyState } from "../components/empty-states/EmptyState";
import { ConfirmModal } from "../components/modals/ConfirmModal";
import { StatRows } from "../components/tables/AnalyticsTable";
import { tooltipStyle } from "../components/charts/ChartPrimitives";
import { shortDate, todayIso } from "../lib/format";
import { useIronLogStore } from "../lib/store";

const safetyText = "This is an experimental progress metric. It is not a medical diagnosis, body-fat measurement, or attractiveness rating.";

export function PhotosPage() {
  const state = useIronLogStore();
  const [poseType, setPoseType] = useState<ProgressPhoto["poseType"]>("front");
  const [bodyweight, setBodyweight] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [lightingTag, setLightingTag] = useState("same room");
  const [pumpTag, setPumpTag] = useState("no pump");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [analyzingId, setAnalyzingId] = useState("");
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const latestAnalysis = [...state.analyses].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const trend = state.analyses
    .map((analysis) => {
      const photo = state.photos.find((item) => item.id === analysis.progressPhotoId);
      return { date: shortDate(photo?.capturedAt ?? analysis.createdAt), score: Math.round(analysis.score), confidence: Math.round(analysis.confidence * 100), bodyweight: photo?.bodyweight ?? null };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const selectedPosePhotos = state.photos.filter((photo) => photo.poseType === poseType).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const beforeAfter = { before: selectedPosePhotos[0], after: selectedPosePhotos.at(-1) };

  useEffect(() => () => stopCamera(), []);

  function photoFields() {
    return {
      poseType,
      age: age ? Number(age) : null,
      height: height ? Number(height) : null,
      bodyweight: bodyweight ? Number(bodyweight) : null,
      lightingTag,
      pumpTag,
      notes: notes.trim() || undefined,
      capturedAt: todayIso()
    };
  }

  function handleUpload(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.addPhoto({ imagePath: String(reader.result), ...photoFields() });
      setStatus("Photo added locally. Analysis runs only after explicit consent.");
    };
    reader.onerror = () => setStatus("Could not read the selected photo.");
    reader.readAsDataURL(file);
  }

  async function openCamera() {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      window.setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch {
      setCameraError("Camera access is unavailable or was denied.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    state.addPhoto({ imagePath: canvas.toDataURL("image/jpeg", 0.9), ...photoFields() });
    setStatus("Camera photo added locally.");
    stopCamera();
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  async function analyze(photoId: string) {
    try {
      setAnalyzingId(photoId);
      setStatus("");
      await state.analyzePhoto(photoId, true);
      setStatus("Local analysis complete.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Photo analysis failed.");
    } finally {
      setAnalyzingId("");
    }
  }

  return (
    <ScreenShell title="Photos" subtitle="Local progress photos, same-pose comparisons, quality checks, and explicit opt-in analysis.">
      <Card className="border-electric bg-electric-muted">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-electric">Privacy-safe progress photos</div>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-obsidian-muted">{safetyText}</p>
            <p className="mt-1 max-w-4xl text-sm leading-relaxed text-obsidian-subtle">Photos stay local by default. IronLog does not upload photos, compare you against other users, or rate attractiveness.</p>
          </div>
          <Button variant="danger" icon={Trash2} onClick={() => setDeleteAllOpen(true)}>Delete all photo data</Button>
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Photos" value={String(state.photos.length)} hint="local timeline" />
        <MetricCard label="Analyses" value={String(state.analyses.length)} hint="explicit consent" />
        <MetricCard label="Progress Photo Index" value={latestAnalysis ? String(Math.round(latestAnalysis.score)) : "--"} hint="0-100 private index" />
        <MetricCard label="Confidence" value={latestAnalysis ? `${Math.round(latestAnalysis.confidence * 100)}%` : "--"} hint={latestAnalysis?.modelVersion ?? "stub-v0"} />
      </div>

      <Card>
        <SectionHeader title="Upload or Capture" icon={Camera} />
        <div className="grid grid-cols-[.8fr_.75fr_.75fr_.9fr_1fr_.9fr_auto_auto] gap-3">
          <Select value={poseType} onChange={(value) => setPoseType(value as ProgressPhoto["poseType"])}>
            <option value="front">Front</option>
            <option value="side">Side</option>
            <option value="back">Back</option>
            <option value="other">Other</option>
          </Select>
          <Input placeholder="Age" value={age} onChange={setAge} />
          <Input placeholder="Height in" value={height} onChange={setHeight} />
          <Input placeholder={`Weight ${state.unitPreference}`} value={bodyweight} onChange={setBodyweight} />
          <Input placeholder="Lighting tag" value={lightingTag} onChange={setLightingTag} />
          <Select value={pumpTag} onChange={setPumpTag}>
            <option value="no pump">No pump</option>
            <option value="pump">Pump</option>
            <option value="unknown">Unknown</option>
          </Select>
          <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-electric px-4 text-sm font-bold text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] transition-colors hover:bg-blue-500">
            <FolderUp className="h-4 w-4" />
            Upload
            <input className="hidden" type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files?.[0])} />
          </label>
          <Button variant="ghost" icon={Camera} onClick={openCamera}>Camera</Button>
        </div>
        <div className="mt-3">
          <TextArea placeholder="Photo notes, conditions, or pose reminders" value={notes} onChange={setNotes} />
        </div>
        {(status || cameraError) && <div className="mt-3 text-sm text-obsidian-muted">{status || cameraError}</div>}
        {cameraOpen && (
          <div className="mt-4 overflow-hidden rounded-xl border border-obsidian bg-obsidian-700">
            <video ref={videoRef} autoPlay playsInline muted className="max-h-[380px] w-full bg-obsidian-900 object-contain" />
            <div className="flex justify-end gap-2 p-3">
              <Button variant="ghost" onClick={stopCamera}>Close</Button>
              <Button icon={Camera} onClick={capturePhoto}>Capture</Button>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-[1fr_420px] gap-5">
        <Card>
          <SectionHeader title="Timeline" icon={Camera} />
          {state.photos.length ? (
            <div className="grid grid-cols-3 gap-4">
              {[...state.photos].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)).map((photo) => {
                const analysis = [...state.analyses].reverse().find((item) => item.progressPhotoId === photo.id);
                return <PhotoCard key={photo.id} photo={photo} analysis={analysis} analyzing={analyzingId === photo.id} onAnalyze={analyze} onDelete={setDeletePhotoId} unit={state.unitPreference} />;
              })}
            </div>
          ) : (
            <EmptyState icon={Camera} title="No photos yet" body="Upload a front, side, back, or other progress photo. Analysis stays local and opt-in." />
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <SectionHeader title="Same-Pose Compare" icon={Scale} />
            {beforeAfter.before && beforeAfter.after ? (
              <div className="grid grid-cols-2 gap-3">
                <CompareImage label="Before" photo={beforeAfter.before} />
                <CompareImage label="After" photo={beforeAfter.after} />
              </div>
            ) : (
              <EmptyState icon={Scale} title="Need two matching poses" body="Use the pose selector above to compare the earliest and latest photo in that pose." />
            )}
          </Card>
          <Card>
            <SectionHeader title="Progress Photo Index Trend" icon={Sparkles} />
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={trend}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.35)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.35)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Line dataKey="score" name="Progress Photo Index" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            {latestAnalysis && <QualitySignals analysis={latestAnalysis} />}
          </Card>
          <Card>
            <SectionHeader title="Retake Guidance" icon={Camera} />
            <div className="space-y-2 text-sm leading-relaxed text-obsidian-muted">
              <p>Use the same room, distance, lens, pose, lighting, and time of day when possible.</p>
              <p>Tag pump/no pump and bodyweight so the Progress Photo Index trend is easier to interpret.</p>
              <p>Review quality signals before comparing photos across weeks.</p>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <SectionHeader title="Export Notes" icon={FolderDown} />
        <p className="text-sm leading-relaxed text-obsidian-muted">Photo export is handled through Data & Settings. Metadata exports as JSON; image files remain local references unless you manually copy them into your backup folder.</p>
      </Card>
      {deletePhotoId && (
        <ConfirmModal
          title="Delete progress photo?"
          body="This removes the local photo record and its Progress Photo Index analysis from IronLog storage."
          confirmLabel="Delete photo"
          onCancel={() => setDeletePhotoId(null)}
          onConfirm={() => { state.deletePhoto(deletePhotoId); setDeletePhotoId(null); }}
        />
      )}
      {deleteAllOpen && (
        <ConfirmModal
          title="Delete all photo data?"
          body="This removes every local progress photo record and analysis from IronLog storage. Workout data stays intact."
          confirmLabel="Delete all photos"
          onCancel={() => setDeleteAllOpen(false)}
          onConfirm={() => { state.deleteAllPhotoData(); setDeleteAllOpen(false); }}
        />
      )}
    </ScreenShell>
  );
}

function PhotoCard({ photo, analysis, analyzing, onAnalyze, onDelete, unit }: { photo: ProgressPhoto; analysis?: BodyAnalysis; analyzing: boolean; onAnalyze: (id: string) => void; onDelete: (id: string) => void; unit: string }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-obsidian bg-obsidian-700 transition hover:border-electric">
      <div className="relative">
        <img src={photo.imagePath} alt={`${photo.poseType} progress`} className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
        {analysis && <div className="absolute right-3 top-3 rounded-md bg-electric-muted px-3 py-1 text-[0.7rem] font-bold text-electric">PPI {Math.round(analysis.score)}</div>}
      </div>
      <div className="space-y-3 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="capitalize text-white">{photo.poseType}</span>
          <span className="text-obsidian-subtle">{shortDate(photo.capturedAt)}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-obsidian-subtle">
          <span className="rounded-md border border-obsidian px-2 py-1 font-mono">{photo.bodyweight ? `${photo.bodyweight} ${unit}` : "weight missing"}</span>
          <span className="rounded-md border border-obsidian px-2 py-1">{photo.lightingTag || "lighting missing"}</span>
          <span className="rounded-md border border-obsidian px-2 py-1">{photo.pumpTag || "pump tag missing"}</span>
        </div>
        {analysis ? (
          <div className="text-electric">Progress Photo Index {Math.round(analysis.score)} - {Math.round(analysis.confidence * 100)}% confidence</div>
        ) : (
          <Button disabled={analyzing} icon={Sparkles} onClick={() => onAnalyze(photo.id)}>{analyzing ? "Analyzing..." : "Analyze with consent"}</Button>
        )}
        <div className="flex justify-end">
          <IconButton label="Delete photo" icon={Trash2} variant="danger" onClick={() => onDelete(photo.id)} />
        </div>
      </div>
    </div>
  );
}

function CompareImage({ label, photo }: { label: string; photo: ProgressPhoto }) {
  return (
    <div className="overflow-hidden rounded-xl border border-obsidian bg-obsidian-700">
      <img src={photo.imagePath} alt={`${label} ${photo.poseType}`} className="h-56 w-full object-cover" />
      <div className="p-3 text-sm">
        <div className="font-medium">{label}</div>
        <div className="text-obsidian-subtle">{shortDate(photo.capturedAt)}</div>
      </div>
    </div>
  );
}

function QualitySignals({ analysis }: { analysis: BodyAnalysis }) {
  const quality = (analysis.measurementsJson.photoQualitySignals ?? {}) as Record<string, number>;
  const rows: Array<[string, string]> = [
    ["Exposure", quality.exposureBalance === undefined ? "--" : String(Math.round(quality.exposureBalance))],
    ["Sharpness", quality.sharpness === undefined ? "--" : String(Math.round(quality.sharpness))],
    ["Framing", quality.centerBalance === undefined ? "--" : String(Math.round(quality.centerBalance))],
    ["Contrast", quality.contrast === undefined ? "--" : String(Math.round(quality.contrast))]
  ];
  const warnings = useMemo(() => analysis.warningsJson.slice(0, 4), [analysis.warningsJson]);
  return (
    <div className="mt-4 space-y-4">
      <StatRows rows={rows} />
      <div className="rounded-xl border border-obsidian bg-obsidian-700 p-3 text-sm leading-relaxed text-obsidian-muted">
        {warnings.length ? warnings.map((warning) => <p key={warning}>{warning}</p>) : <p>No analysis warnings.</p>}
      </div>
    </div>
  );
}
