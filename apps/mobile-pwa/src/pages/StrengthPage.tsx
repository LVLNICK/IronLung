import { MobileCard } from "../components/MobilePrimitives";
import { MiniBarChart, PageIntro, PrList, RankedBars, StrengthRows, WidgetTitle, type AnalyzerPageProps } from "./AnalyzerShared";

export function StrengthPage({ snapshot, analyzer, onOpenSync }: AnalyzerPageProps) {
  return (
    <div className="space-y-4">
      <PageIntro kicker="Strength" title="Best lifts" body="Top estimated 1RM, max weight, recent PRs, plateau candidates, and improving exercises." />
      <MobileCard>
        <WidgetTitle meta={snapshot.settings.unitPreference}>Top by estimated 1RM</WidgetTitle>
        <MiniBarChart rows={analyzer.strengthRows.map((row) => ({ label: row.exerciseName, value: row.estimatedOneRm }))} />
        <StrengthRows rows={analyzer.strengthRows.slice(0, 8)} unit={snapshot.settings.unitPreference} onOpenSync={onOpenSync} />
      </MobileCard>
      <MobileCard>
        <WidgetTitle meta={snapshot.settings.unitPreference}>Top by max weight</WidgetTitle>
        <StrengthRows rows={analyzer.maxWeightRows.slice(0, 6)} unit={snapshot.settings.unitPreference} metric="max" onOpenSync={onOpenSync} />
      </MobileCard>
      <MobileCard>
        <WidgetTitle>Major / medium PRs</WidgetTitle>
        <PrList snapshot={snapshot} prs={analyzer.recentPrs.slice(0, 6)} />
      </MobileCard>
      <MobileCard>
        <WidgetTitle>Plateau candidates</WidgetTitle>
        <RankedBars rows={analyzer.plateauRows.map((row) => ({ label: row.exerciseName, value: Math.max(1, Math.abs(row.strengthTrend)), meta: "plateau signal" })).slice(0, 5)} unit="" />
        {!analyzer.plateauRows.length && <p className="text-sm text-white/55">No plateau candidates in this range.</p>}
      </MobileCard>
      <MobileCard>
        <WidgetTitle>Fastest improving</WidgetTitle>
        <RankedBars rows={analyzer.improvingRows.map((row) => ({ label: row.exerciseName, value: row.strengthTrend, meta: "trend" })).slice(0, 5)} unit="" />
      </MobileCard>
      <MobileCard>
        <WidgetTitle>All non-baseline PRs</WidgetTitle>
        <PrList snapshot={snapshot} prs={analyzer.strengthPrs.slice(0, 8)} />
      </MobileCard>
    </div>
  );
}
