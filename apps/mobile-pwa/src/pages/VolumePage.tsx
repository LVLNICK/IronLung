import { AlertTriangle } from "lucide-react";
import { MobileCard } from "../components/MobilePrimitives";
import { PageIntro, RankedBars, StatPill, formatSigned, type AnalyzerPageProps } from "./AnalyzerShared";

export function VolumePage({ snapshot, analyzer }: AnalyzerPageProps) {
  return (
    <div className="space-y-4">
      <PageIntro kicker="Volume" title="Workload trend" body="Weekly volume, daily workload, current period comparison, top exercises, and workload warnings." />
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Vs previous" value={`${formatSigned(analyzer.summary.comparison.volumeDeltaPercent)}%`} />
        <StatPill label="Sets delta" value={`${formatSigned(analyzer.summary.comparison.setsDeltaPercent)}%`} />
      </div>
      <MobileCard>
        <div className="mb-3 font-bold">Weekly volume</div>
        <RankedBars rows={analyzer.weeklyRows.slice(0, 8)} unit={snapshot.settings.unitPreference} />
      </MobileCard>
      <MobileCard>
        <div className="mb-3 font-bold">Daily volume</div>
        <RankedBars rows={analyzer.dailyRows.slice(0, 14)} unit={snapshot.settings.unitPreference} />
      </MobileCard>
      <MobileCard>
        <div className="mb-3 font-bold">Top exercises by volume</div>
        <RankedBars rows={analyzer.topExerciseVolumeRows.slice(0, 8)} unit={snapshot.settings.unitPreference} />
      </MobileCard>
      <MobileCard>
        <div className="mb-3 flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4 text-yellow-300" />Warnings</div>
        <p className="text-sm leading-relaxed text-white/60">{analyzer.fatigueWarning}</p>
      </MobileCard>
    </div>
  );
}
