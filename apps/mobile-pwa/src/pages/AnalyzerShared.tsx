import { BarChart3, Trophy } from "lucide-react";
import { EmptyState, MobileCard, StatPill } from "../components/MobilePrimitives";
import type { MobileSnapshot } from "../data/mobileRepository";
import type { MobileAnalyzerModel, RankedValue } from "../features/analytics/mobileAnalytics";

export type AnalyzerPageProps = {
  snapshot: MobileSnapshot;
  analyzer: MobileAnalyzerModel;
  onOpenSync: () => void;
};

export function PageIntro({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <MobileCard>
      <div className="text-sm font-bold uppercase tracking-wider text-electricText">{kicker}</div>
      <h1 className="mt-1 text-3xl font-black">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{body}</p>
    </MobileCard>
  );
}

export function InsightLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-line py-3 last:border-0">
      <div className="text-xs font-bold uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 text-sm leading-relaxed text-white/75">{value}</div>
    </div>
  );
}

export function StrengthRows({ rows, unit, metric = "e1rm", onOpenSync }: { rows: MobileAnalyzerModel["strengthRows"]; unit: string; metric?: "e1rm" | "max"; onOpenSync?: () => void }) {
  if (!rows.length) return <EmptyState icon={Trophy} title="No strength data" body="Import a desktop seed bundle to analyze your lifts offline." actionLabel="Import Desktop Data" onAction={onOpenSync} />;
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.exerciseId} className="rounded-xl border border-line bg-panelSoft p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-bold">{row.exerciseName}</div>
              <div className="mt-1 text-xs text-white/45">{row.primaryMuscle}</div>
            </div>
            <div className="text-right font-mono text-lg font-black">{formatNumber(metric === "max" ? row.maxWeight : row.estimatedOneRm)}{unit}</div>
          </div>
          <div className="mt-2 text-xs text-white/55">Best set: {row.bestSet}</div>
        </div>
      ))}
    </div>
  );
}

export function RankedBars({ rows, unit, invert = false, onOpenSync }: { rows: RankedValue[]; unit: string; invert?: boolean; onOpenSync?: () => void }) {
  if (!rows.length) return <EmptyState icon={BarChart3} title="No data yet" body="Import a desktop seed bundle to view analyzer charts offline." actionLabel="Import Desktop Data" onAction={onOpenSync} />;
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border border-line bg-panelSoft p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold">{row.label}</div>
              {row.meta && <div className="mt-0.5 text-xs text-white/40">{row.meta}</div>}
            </div>
            <div className="font-mono text-xs text-white/60">{formatNumber(row.value)} {unit}</div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full ${invert ? "bg-yellow-300" : "bg-electric"}`} style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PrList({ snapshot, prs }: { snapshot: MobileSnapshot; prs: MobileAnalyzerModel["recentPrs"] }) {
  if (!prs.length) return <EmptyState icon={Trophy} title="No meaningful PRs" body="Baseline PRs are hidden from top mobile screens." />;
  return (
    <div className="space-y-2">
      {prs.map((record) => {
        const exercise = snapshot.exercises.find((item) => item.id === record.exerciseId);
        return (
          <div key={record.id} className="rounded-xl border border-electric bg-electric/10 p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white/50">{exercise?.name ?? "Exercise"} - {record.importance ?? "small"}</div>
            <div className="mt-1 font-mono text-lg font-black">{formatPr(record.type)} - {formatNumber(record.value)} {record.unit}</div>
            <div className="text-xs text-white/45">{new Date(record.achievedAt).toLocaleDateString()}</div>
          </div>
        );
      })}
    </div>
  );
}

export { StatPill };

export function importedDataStatus(snapshot: MobileSnapshot): { label: string; warning: string | null; isEmpty: boolean } {
  const importedAt = snapshot.settings.lastImportedAt;
  const isEmpty = snapshot.sessions.filter((session) => !session.deletedAt).length === 0 && snapshot.setLogs.filter((set) => !set.deletedAt).length === 0;
  if (!importedAt) return { label: "Never imported", warning: "No desktop seed has been imported on this phone yet.", isEmpty };
  const importedDate = new Date(importedAt);
  if (Number.isNaN(importedDate.getTime())) return { label: "Import date unknown", warning: "Analyzer cache import date is invalid.", isEmpty };
  const ageDays = Math.floor((Date.now() - importedDate.getTime()) / 86_400_000);
  const label = `Last imported ${importedDate.toLocaleDateString()}`;
  const warning = ageDays > 14 ? `Analyzer cache may be outdated. Last desktop import was ${ageDays} days ago.` : null;
  return { label, warning, isEmpty };
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString();
}

export function formatSigned(value: number): string {
  return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

function formatPr(type: string): string {
  return type.replace(/_/g, " ");
}
