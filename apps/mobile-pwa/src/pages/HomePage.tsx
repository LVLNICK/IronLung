import { MobileCard } from "../components/MobilePrimitives";
import { InsightLine, PrList, StatPill, formatNumber, type AnalyzerPageProps } from "./AnalyzerShared";

export function HomePage({ snapshot, analyzer }: AnalyzerPageProps) {
  return (
    <div className="space-y-4">
      <MobileCard>
        <div className="text-sm font-bold uppercase tracking-wider text-electricText">IronLung Analyzer</div>
        <h1 className="mt-1 text-3xl font-black">Training overview</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">Offline phone-local training analytics companion for IronLung Desktop.</p>
      </MobileCard>
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
