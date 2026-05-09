import { estimatedOneRepMax, round, setVolume } from "./calculations";
import {
  buildTrainingAnalytics,
  type AnalyticsDataset,
  type AnalyticsSummary,
  type DateRangePreset,
  type FatigueFlag,
  type SmartInsight
} from "./analytics";
import type { TrainingGoal } from "./types";

export type ForecastType = "next_e1rm" | "weekly_volume" | "pr_likelihood" | "plateau_risk" | "fatigue_risk";
export type RecommendationCategory = "strength" | "hypertrophy" | "recovery" | "consistency" | "balance" | "general";
export type RecommendationPriority = "high" | "medium" | "low";

export interface StatisticalForecast {
  id: string;
  type: ForecastType;
  targetId?: string;
  targetName: string;
  value: number;
  lowerBound?: number;
  upperBound?: number;
  unit: string;
  confidence: number;
  sampleSize: number;
  method: "linear_trend" | "moving_average" | "rule_score";
  detail: string;
}

export interface TrainingRecommendation {
  id: string;
  title: string;
  detail: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  evidence: string[];
  suggestedAction: string;
}

export interface DeterministicAnalystReport {
  readinessScore: number;
  focus: string;
  bestImprovement: string;
  weakPoint: string;
  recoveryConcern: string;
  positives: SmartInsight[];
  warnings: SmartInsight[];
}

export interface TrainingIntelligence {
  summary: AnalyticsSummary;
  analyst: DeterministicAnalystReport;
  forecasts: StatisticalForecast[];
  recommendations: TrainingRecommendation[];
}

export function buildTrainingIntelligence(dataset: AnalyticsDataset, preset: DateRangePreset = "30d", now = new Date()): TrainingIntelligence {
  const summary = buildTrainingAnalytics(dataset, preset, now);
  const forecasts = buildStatisticalForecasts(dataset, summary);
  const analyst = buildDeterministicAnalystReport(summary, forecasts);
  const recommendations = buildPersonalRecommendations(summary, forecasts, dataset.trainingGoal ?? "general_fitness");
  return { summary, analyst, forecasts, recommendations };
}

export function buildDeterministicAnalystReport(summary: AnalyticsSummary, forecasts: StatisticalForecast[] = []): DeterministicAnalystReport {
  const warnings = [...summary.weakPoints, ...summary.insights.filter((item) => item.severity === "high" || item.severity === "medium")].slice(0, 6);
  const positives = summary.insights.filter((item) => item.severity === "positive").slice(0, 4);
  const topPr = summary.prGroups[0];
  const topForecast = forecasts.find((forecast) => forecast.type === "pr_likelihood" && forecast.value >= 60);
  const fatigue = summary.fatigueFlags[0];
  const balancePenalty = Math.max(0, 85 - summary.balance.overall) * 0.28;
  const fatiguePenalty = summary.fatigueFlags.reduce((total, flag) => total + (flag.severity === "high" ? 12 : flag.severity === "medium" ? 7 : 2), 0);
  const volumePenalty = summary.comparison.volumeDeltaPercent > 35 ? 10 : summary.comparison.volumeDeltaPercent < -30 ? 8 : 0;
  const readinessScore = clamp(round(88 - balancePenalty - fatiguePenalty - volumePenalty + Math.min(8, summary.totals.activeDays)), 0, 100);

  return {
    readinessScore,
    focus: summary.recommendations[0]?.title ?? topForecast?.detail ?? "Keep building consistent, user-created training data.",
    bestImprovement: positives[0]?.title ?? (topPr ? `${topPr.type.replace(/_/g, " ")} PRs are leading recent progress.` : "No standout improvement detected yet."),
    weakPoint: summary.weakPoints[0]?.detail ?? "No major weak point detected in the selected range.",
    recoveryConcern: fatigue ? fatigue.detail : "No recovery/fatigue warning detected from current workload signals.",
    positives,
    warnings
  };
}

export function buildStatisticalForecasts(dataset: AnalyticsDataset, summary = buildTrainingAnalytics(dataset)): StatisticalForecast[] {
  const forecasts: StatisticalForecast[] = [];
  forecasts.push(...exerciseStrengthForecasts(dataset));
  forecasts.push(...prLikelihoodForecasts(summary, forecasts));
  forecasts.push(...plateauRiskForecasts(summary));
  forecasts.push(...weeklyVolumeForecasts(summary));
  forecasts.push(...fatigueRiskForecasts(summary.fatigueFlags));
  return forecasts.sort((a, b) => b.confidence - a.confidence || b.value - a.value);
}

export function buildPersonalRecommendations(summary: AnalyticsSummary, forecasts: StatisticalForecast[], goal: TrainingGoal = summary.trainingGoal): TrainingRecommendation[] {
  const recs: TrainingRecommendation[] = [];
  const prCandidate = forecasts.find((forecast) => forecast.type === "pr_likelihood" && forecast.value >= 55);
  const plateau = forecasts.find((forecast) => forecast.type === "plateau_risk" && forecast.value >= 60);
  const fatigue = forecasts.find((forecast) => forecast.type === "fatigue_risk" && forecast.value >= 60);
  const weakPoint = summary.weakPoints[0];

  if (goal === "strength" || goal === "powerbuilding") {
    if (prCandidate) recs.push(recommendation("pr-window", "Best PR window", prCandidate.detail, "strength", "medium", [confidenceText(prCandidate), sampleText(prCandidate)], "Use this as a top-set readiness signal, not a guaranteed outcome."));
    if (plateau) recs.push(recommendation("plateau-review", "Review plateau candidate", plateau.detail, "strength", "high", [confidenceText(plateau), sampleText(plateau)], "Check load jumps, rep range, RPE, and recovery for this lift."));
  }

  if (goal === "hypertrophy" || goal === "lean_bulk" || goal === "powerbuilding") {
    const volume = forecasts.find((forecast) => forecast.type === "weekly_volume");
    if (volume) recs.push(recommendation("volume-trajectory", "Weekly volume trajectory", volume.detail, "hypertrophy", priorityFromDelta(summary.comparison.volumeDeltaPercent), [confidenceText(volume), `Current period volume delta: ${summary.comparison.volumeDeltaPercent}%`], "Keep volume progression gradual and use muscle balance to decide where it goes."));
  }

  if (goal === "cutting" && summary.comparison.volumeDeltaPercent <= -20) {
    recs.push(recommendation("cutting-retention", "Watch strength retention", "Volume is meaningfully down while cutting-style goals usually need consistency and fatigue management.", "consistency", "medium", [`Volume delta: ${summary.comparison.volumeDeltaPercent}%`], "Prioritize consistent hard-but-manageable work over chasing every small PR."));
  }

  if (fatigue) recs.push(recommendation("fatigue-management", "Recovery warning", fatigue.detail, "recovery", "high", [confidenceText(fatigue), sampleText(fatigue)], "Treat this as a workload review signal; it is not medical advice."));
  if (weakPoint) recs.push(recommendation("weak-point", weakPoint.title, weakPoint.detail, "balance", weakPoint.severity === "high" ? "high" : "medium", [weakPoint.metric ?? "Detected from distributed muscle volume"], weakPoint.recommendation ?? "Use your own exercise selection to address this target."));

  if (!recs.length) {
    recs.push(recommendation("general-build-data", "Keep building signal quality", "Not enough strong statistical signals exist yet, so consistency and clean logging matter most.", "general", "low", [`Sessions: ${summary.totals.sessions}`, `Sets: ${summary.totals.sets}`], "Log complete sets with weight, reps, RPE, and dates so forecasts become more useful."));
  }

  return dedupeRecommendations(recs).slice(0, 8);
}

function exerciseStrengthForecasts(dataset: AnalyticsDataset): StatisticalForecast[] {
  const exerciseById = new Map(dataset.exercises.map((exercise) => [exercise.id, exercise]));
  const sessionById = new Map(dataset.sessions.map((session) => [session.id, session]));
  const rowById = new Map(dataset.sessionExercises.map((row) => [row.id, row]));
  const pointsByExercise = new Map<string, Array<{ date: string; value: number }>>();

  for (const set of dataset.setLogs.filter((row) => row.isCompleted)) {
    const row = rowById.get(set.workoutSessionExerciseId);
    const session = row ? sessionById.get(row.workoutSessionId) : undefined;
    if (!row || !session) continue;
    const points = pointsByExercise.get(row.exerciseId) ?? [];
    points.push({ date: session.startedAt, value: estimatedOneRepMax(set.weight, set.reps) });
    pointsByExercise.set(row.exerciseId, points);
  }

  return [...pointsByExercise.entries()].flatMap(([exerciseId, points]) => {
    const exercise = exerciseById.get(exerciseId);
    const bestBySession = bestValuesByDate(points).slice(-8);
    if (!exercise || bestBySession.length < 3) return [];
    const values = bestBySession.map((point) => point.value);
    const trend = linearTrend(values);
    const next = round(Math.max(0, trend.next));
    const spread = Math.max(2.5, trend.residualStdDev, next * 0.015);
    return [{
      id: `forecast-e1rm-${exerciseId}`,
      type: "next_e1rm" as const,
      targetId: exerciseId,
      targetName: exercise.name,
      value: next,
      lowerBound: round(Math.max(0, next - spread)),
      upperBound: round(next + spread),
      unit: "estimated 1RM",
      confidence: confidenceFromSample(bestBySession.length, trend.r2),
      sampleSize: bestBySession.length,
      method: "linear_trend" as const,
      detail: `${exercise.name} next-session estimated 1RM forecast is ${next} (${round(Math.max(0, next - spread))}-${round(next + spread)} range).`
    }];
  });
}

function prLikelihoodForecasts(summary: AnalyticsSummary, forecasts: StatisticalForecast[]): StatisticalForecast[] {
  const e1rmForecasts = forecasts.filter((forecast) => forecast.type === "next_e1rm");
  const metricByExercise = new Map(summary.exerciseMetrics.map((metric) => [metric.exerciseId, metric]));
  return e1rmForecasts.map((forecast) => {
    const currentBest = metricByExercise.get(forecast.targetId ?? "")?.estimatedOneRepMax ?? forecast.value;
    const margin = currentBest > 0 ? ((forecast.upperBound ?? forecast.value) - currentBest) / currentBest : 0;
    const score = clamp(round(45 + margin * 650 + forecast.confidence * 0.22), 0, 100);
    return {
      id: `forecast-pr-${forecast.targetId}`,
      type: "pr_likelihood" as const,
      targetId: forecast.targetId,
      targetName: forecast.targetName,
      value: score,
      unit: "score",
      confidence: forecast.confidence,
      sampleSize: forecast.sampleSize,
      method: "rule_score" as const,
      detail: `${forecast.targetName} has a ${score}/100 PR likelihood signal from recent estimated 1RM trend.`
    };
  }).filter((forecast) => forecast.value >= 35);
}

function plateauRiskForecasts(summary: AnalyticsSummary): StatisticalForecast[] {
  return summary.exerciseMetrics
    .filter((exercise) => exercise.sessions >= 4)
    .map((exercise) => {
      const score = clamp(round((exercise.plateau ? 62 : 30) + Math.max(0, -(exercise.strengthTrend)) * 1.6 + Math.min(25, (exercise.sessionsSincePr ?? 0) * 5)), 0, 100);
      return {
        id: `forecast-plateau-${exercise.exerciseId}`,
        type: "plateau_risk" as const,
        targetId: exercise.exerciseId,
        targetName: exercise.name,
        value: score,
        unit: "score",
        confidence: confidenceFromSample(exercise.sessions, exercise.plateau ? 0.55 : 0.25),
        sampleSize: exercise.sessions,
        method: "rule_score" as const,
        detail: `${exercise.name} plateau risk is ${score}/100 based on recent strength trend and sessions since PR.`
      };
    })
    .filter((forecast) => forecast.value >= 45);
}

function weeklyVolumeForecasts(summary: AnalyticsSummary): StatisticalForecast[] {
  const values = summary.weeklyVolume.map((row) => row.volume).slice(-8);
  if (values.length < 2) return [];
  const trend = values.length >= 3 ? linearTrend(values) : { next: average(values), r2: 0.2, residualStdDev: Math.abs(values[values.length - 1] - values[0]) };
  const next = round(Math.max(0, trend.next));
  const spread = Math.max(0, trend.residualStdDev);
  return [{
    id: "forecast-weekly-volume",
    type: "weekly_volume",
    targetName: "Weekly volume",
    value: next,
    lowerBound: round(Math.max(0, next - spread)),
    upperBound: round(next + spread),
    unit: "volume",
    confidence: confidenceFromSample(values.length, trend.r2),
    sampleSize: values.length,
    method: values.length >= 3 ? "linear_trend" : "moving_average",
    detail: `Next weekly volume forecast is ${next} (${round(Math.max(0, next - spread))}-${round(next + spread)} range).`
  }];
}

function fatigueRiskForecasts(flags: FatigueFlag[]): StatisticalForecast[] {
  return flags.map((flag) => {
    const score = flag.severity === "high" ? 85 : flag.severity === "medium" ? 65 : 40;
    return {
      id: `forecast-fatigue-${flag.muscle}`,
      type: "fatigue_risk" as const,
      targetName: flag.muscle,
      value: score,
      unit: "score",
      confidence: flag.severity === "high" ? 74 : 62,
      sampleSize: flag.recentSets,
      method: "rule_score" as const,
      detail: `${flag.muscle} fatigue risk is ${score}/100 from ${flag.recentSets} related sets and ${flag.recentHardSets} hard-set estimates.`
    };
  });
}

function bestValuesByDate(points: Array<{ date: string; value: number }>) {
  const byDate = new Map<string, number>();
  for (const point of points) {
    const key = point.date.slice(0, 10);
    byDate.set(key, Math.max(byDate.get(key) ?? 0, point.value));
  }
  return [...byDate.entries()].map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
}

function linearTrend(values: number[]) {
  const n = values.length;
  const xs = values.map((_, index) => index);
  const xMean = average(xs);
  const yMean = average(values);
  const denominator = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
  const slope = denominator === 0 ? 0 : xs.reduce((sum, x, index) => sum + (x - xMean) * (values[index] - yMean), 0) / denominator;
  const intercept = yMean - slope * xMean;
  const predictions = xs.map((x) => intercept + slope * x);
  const residuals = values.map((value, index) => value - predictions[index]);
  const residualStdDev = Math.sqrt(average(residuals.map((value) => value ** 2)));
  const totalVariance = values.reduce((sum, value) => sum + (value - yMean) ** 2, 0);
  const residualVariance = residuals.reduce((sum, value) => sum + value ** 2, 0);
  const r2 = totalVariance === 0 ? 0 : clamp(1 - residualVariance / totalVariance, 0, 1);
  return { slope: round(slope), next: round(intercept + slope * n), r2: round(r2), residualStdDev: round(residualStdDev) };
}

function confidenceFromSample(sampleSize: number, fitQuality: number) {
  const sampleScore = Math.min(70, sampleSize * 9);
  const fitScore = clamp(fitQuality, 0, 1) * 30;
  return clamp(round(sampleScore + fitScore), 10, 95);
}

function recommendation(id: string, title: string, detail: string, category: RecommendationCategory, priority: RecommendationPriority, evidence: string[], suggestedAction: string): TrainingRecommendation {
  return { id, title, detail, category, priority, evidence, suggestedAction };
}

function priorityFromDelta(delta: number): RecommendationPriority {
  return Math.abs(delta) >= 25 ? "high" : Math.abs(delta) >= 12 ? "medium" : "low";
}

function confidenceText(forecast: StatisticalForecast) {
  return `Confidence: ${forecast.confidence}/100`;
}

function sampleText(forecast: StatisticalForecast) {
  return `Sample size: ${forecast.sampleSize}`;
}

function dedupeRecommendations(items: TrainingRecommendation[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
