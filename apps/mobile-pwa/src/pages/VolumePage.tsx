import { AlertTriangle } from "lucide-react";
import { MobileCard } from "../components/MobilePrimitives";
import { CompactProgressRows, MiniBarChart, PageIntro, RankedBars, StatPill, WidgetTitle, formatSigned, type AnalyzerPageProps } from "./AnalyzerShared";

export function VolumePage({ snapshot, analyzer, onOpenSync }: AnalyzerPageProps) {
  return (
    <div className="space-y-4">
      <PageIntro kicker="Volume" title="Workload trend" body="Weekly volume, daily workload, current period comparison, top exercises, and workload warnings." />
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Vs previous" value={`${formatSigned(analyzer.summary.comparison.volumeDeltaPercent)}%`} />
        <StatPill label="Sets delta" value={`${formatSigned(analyzer.summary.comparison.setsDeltaPercent)}%`} />
      </div>
      <MobileCard>
        <WidgetTitle meta={snapshot.settings.unitPreference}>Weekly volume</WidgetTitle>
        <MiniBarChart rows={analyzer.weeklyRows} caption="Weekly total volume. Each bar is one week; taller bars mean more total weight moved that week." />
        <CompactProgressRows rows={analyzer.weeklyRows.slice(0, 8)} unit={snapshot.settings.unitPreference} onOpenSync={onOpenSync} caption="Weekly workload ranked inside this range. Longer bars mean higher total weekly volume." />
      </MobileCard>
      <MobileCard>
        <WidgetTitle meta={snapshot.settings.unitPreference}>Daily volume</WidgetTitle>
        <RankedBars rows={analyzer.dailyRows.slice(0, 14)} unit={snapshot.settings.unitPreference} onOpenSync={onOpenSync} caption="Daily workload ranked by volume. Longer bars mean more total weight moved that day." />
      </MobileCard>
      <MobileCard>
        <WidgetTitle meta={snapshot.settings.unitPreference}>Top exercises by volume</WidgetTitle>
        <CompactProgressRows rows={analyzer.topExerciseVolumeRows.slice(0, 8)} unit={snapshot.settings.unitPreference} onOpenSync={onOpenSync} caption="Exercise workload ranked by volume. Longer bars mean that exercise contributed more total volume." />
      </MobileCard>
      <MobileCard>
        <WidgetTitle>Warnings</WidgetTitle>
        <div className="mb-3 flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4 text-yellow-300" />Recovery / fatigue</div>
        <p className="text-sm leading-relaxed text-white/60">{analyzer.fatigueWarning}</p>
      </MobileCard>
    </div>
  );
}
