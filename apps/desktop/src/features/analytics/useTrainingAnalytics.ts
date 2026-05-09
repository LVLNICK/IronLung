import { useMemo } from "react";
import { buildTrainingAnalytics, buildTrainingIntelligence, type DateRangePreset } from "@ironlung/core";
import { buildAnalyticsSnapshot } from "../../lib/analytics";
import { useIronLungStore } from "../../lib/store";

export function useTrainingAnalytics(range: DateRangePreset = "30d") {
  const state = useIronLungStore();
  return useMemo(() => {
    const dataset = {
      exercises: state.exercises,
      sessions: state.sessions,
      sessionExercises: state.sessionExercises,
      setLogs: state.setLogs,
      personalRecords: state.personalRecords,
      trainingGoal: state.trainingGoal,
      trainingBlocks: state.trainingBlocks,
      currentTrainingBlockId: state.currentTrainingBlockId
    };
    return {
      core: buildTrainingAnalytics(dataset, range),
      intelligence: buildTrainingIntelligence(dataset, range),
      desktop: buildAnalyticsSnapshot({ ...dataset, photos: state.photos, analyses: state.analyses })
    };
  }, [range, state.exercises, state.sessions, state.sessionExercises, state.setLogs, state.personalRecords, state.trainingGoal, state.trainingBlocks, state.currentTrainingBlockId, state.photos, state.analyses]);
}
