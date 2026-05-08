import { MobileCard } from "../components/MobilePrimitives";
import { CompactProgressRows, MiniBarChart, PageIntro, RankedBars, StatPill, WidgetTitle, type AnalyzerPageProps } from "./AnalyzerShared";

export function MusclesPage({ snapshot, analyzer, onOpenSync }: AnalyzerPageProps) {
  const balance = analyzer.summary.balance;
  return (
    <div className="space-y-4">
      <PageIntro kicker="Muscles" title="Volume balance" body="Muscle volume is distributed based on exercise contribution estimates." />
      <MobileCard>
        <WidgetTitle>Muscle balance score</WidgetTitle>
        <div className="font-mono text-4xl font-black text-white">{balance.overall}/100</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <StatPill label="Push / pull" value={`${balance.pushPull}/100`} />
          <StatPill label="Upper / lower" value={`${balance.upperLower}/100`} />
          <StatPill label="Chest / back" value={`${balance.chestBack}/100`} />
          <StatPill label="Quad / ham" value={`${balance.quadHamstring}/100`} />
        </div>
      </MobileCard>
      <MobileCard>
        <WidgetTitle meta={snapshot.settings.unitPreference}>Top muscles</WidgetTitle>
        <MiniBarChart rows={analyzer.topMuscleRows} caption="Top muscles by distributed volume. Taller bars mean more estimated work for that muscle." />
        <CompactProgressRows rows={analyzer.topMuscleRows} unit={snapshot.settings.unitPreference} onOpenSync={onOpenSync} caption="Muscle volume is distributed by exercise contribution estimates. Longer bars mean more estimated work." />
      </MobileCard>
      <MobileCard>
        <WidgetTitle>Neglected muscles</WidgetTitle>
        <RankedBars rows={analyzer.neglectedMuscles} unit={snapshot.settings.unitPreference} invert onOpenSync={onOpenSync} caption="Lowest trained muscles with nonzero volume. Longer bars still mean more volume, so the shortest rows are most neglected." />
      </MobileCard>
      <MobileCard>
        <WidgetTitle>Muscle drilldown</WidgetTitle>
        <RankedBars rows={analyzer.muscleRows} unit={snapshot.settings.unitPreference} onOpenSync={onOpenSync} caption="All muscles ranked by distributed volume. Longer bars mean more estimated work in the selected range." />
      </MobileCard>
    </div>
  );
}
