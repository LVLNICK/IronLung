import { MobileCard } from "../components/MobilePrimitives";
import { PageIntro, PrList, RankedBars, StrengthRows, type AnalyzerPageProps } from "./AnalyzerShared";

export function StrengthPage({ snapshot, analyzer, onOpenSync }: AnalyzerPageProps) {
  return (
    <div className="space-y-4">
      <PageIntro kicker="Strength" title="Best lifts" body="Top estimated 1RM, max weight, recent PRs, plateau candidates, and improving exercises." />
      <MobileCard>
        <div className="mb-3 font-bold">Top by estimated 1RM</div>
        <StrengthRows rows={analyzer.strengthRows.slice(0, 8)} unit={snapshot.settings.unitPreference} onOpenSync={onOpenSync} />
      </MobileCard>
      <MobileCard>
        <div className="mb-3 font-bold">Top by max weight</div>
        <StrengthRows rows={analyzer.maxWeightRows.slice(0, 6)} unit={snapshot.settings.unitPreference} metric="max" onOpenSync={onOpenSync} />
      </MobileCard>
      <MobileCard>
        <div className="mb-3 font-bold">Major / medium PRs</div>
        <PrList snapshot={snapshot} prs={analyzer.recentPrs.slice(0, 6)} />
      </MobileCard>
      <MobileCard>
        <div className="mb-3 font-bold">Plateau candidates</div>
        <RankedBars rows={analyzer.plateauRows.map((row) => ({ label: row.exerciseName, value: Math.max(1, Math.abs(row.strengthTrend)), meta: "plateau signal" })).slice(0, 5)} unit="" />
        {!analyzer.plateauRows.length && <p className="text-sm text-white/55">No plateau candidates in this range.</p>}
      </MobileCard>
      <MobileCard>
        <div className="mb-3 font-bold">Fastest improving</div>
        <RankedBars rows={analyzer.improvingRows.map((row) => ({ label: row.exerciseName, value: row.strengthTrend, meta: "trend" })).slice(0, 5)} unit="" />
      </MobileCard>
      <MobileCard>
        <div className="mb-3 font-bold">All non-baseline PRs</div>
        <PrList snapshot={snapshot} prs={analyzer.strengthPrs.slice(0, 8)} />
      </MobileCard>
    </div>
  );
}
