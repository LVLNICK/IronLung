import { Database } from "lucide-react";
import { EmptyState, MobileCard } from "../components/MobilePrimitives";
import { InsightLine, PrList, StatPill, formatNumber, importedDataStatus, type AnalyzerPageProps } from "./AnalyzerShared";

export function HomePage({ snapshot, analyzer, onOpenSync }: AnalyzerPageProps) {
  const status = importedDataStatus(snapshot);
  return (
    <div className="space-y-4">
      <MobileCard>
        <div className="text-sm font-bold uppercase tracking-wider text-electricText">IronLung Analyzer</div>
        <h1 className="mt-1 text-3xl font-black">Training overview</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">Offline phone-local training analytics companion for IronLung Desktop.</p>
        <div className="mt-3 rounded-xl border border-line bg-panelSoft p-3 text-xs leading-relaxed text-white/60">
          <span className="font-bold text-white">{status.label}</span>
          {status.warning && <div className="mt-1 text-yellow-200">{status.warning}</div>}
        </div>
      </MobileCard>
      {status.isEmpty && <EmptyState icon={Database} title="Import desktop data" body="IronLung Analyzer is read-only. Import a desktop seed bundle to view analytics offline on this phone." actionLabel="Import Desktop Data" onAction={onOpenSync} />}
      <div className="grid grid-cols-3 gap-2">
        <StatPill label="Workouts" value={formatNumber(analyzer.summary.totals.sessions)} />
        <StatPill label="Sets" value={formatNumber(analyzer.summary.totals.sets)} />
        <StatPill label="Volume" value={formatNumber(analyzer.summary.totals.volume)} />
      </div>
      <MobileCard>
        <div className="mb-3 font-bold">What is happening</div>
        <InsightLine label="Top insight" value={analyzer.topInsight} />
        <InsightLine label="Weak point" value={analyzer.weakPoint} />
        <InsightLine label="Recovery" value={analyzer.fatigueWarning} />
      </MobileCard>
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Current block" value={analyzer.currentBlockName} />
        <StatPill label="Best recent lift" value={analyzer.bestRecentLift} />
        <StatPill label="Most trained" value={analyzer.mostTrainedMuscle} />
        <StatPill label="Least trained" value={analyzer.leastTrainedMuscle} />
      </div>
      <MobileCard>
        <div className="mb-3 font-bold">Recent meaningful PRs</div>
        <PrList snapshot={snapshot} prs={analyzer.recentPrs.slice(0, 5)} />
      </MobileCard>
    </div>
  );
}
