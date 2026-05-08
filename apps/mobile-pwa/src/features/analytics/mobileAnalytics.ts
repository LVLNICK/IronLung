import {
  buildTrainingAnalytics,
  estimatedOneRepMax,
  setVolume,
  resolveMuscleContributions,
  type AnalyticsDataset,
  type AnalyticsSummary,
  type DateRangePreset,
  type PersonalRecord,
  type PRImportance
} from "@ironlung/core";
import type { MobileSnapshot } from "../../data/mobileRepository";

export type MobileRangePreset = DateRangePreset | "block";

export interface RankedValue {
  label: string;
  value: number;
  meta?: string;
}

export interface MobileStrengthRow {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: string;
  maxWeight: number;
  estimatedOneRm: number;
  bestSet: string;
  plateau: boolean;
  strengthTrend: number;
}

export interface MobileAnalyzerModel {
  summary: AnalyticsSummary;
  currentBlockName: string;
  topInsight: string;
  weakPoint: string;
  fatigueWarning: string;
  bestRecentLift: string;
  mostTrainedMuscle: string;
  leastTrainedMuscle: string;
  recentPrs: PersonalRecord[];
  strengthPrs: PersonalRecord[];
  prsByType: RankedValue[];
  prsByImportance: RankedValue[];
  allTimeBestPrs: PersonalRecord[];
  strengthRows: MobileStrengthRow[];
  maxWeightRows: MobileStrengthRow[];
  plateauRows: MobileStrengthRow[];
  improvingRows: MobileStrengthRow[];
  dailyRows: RankedValue[];
  weeklyRows: RankedValue[];
  topExerciseVolumeRows: RankedValue[];
  topMuscleRows: RankedValue[];
  muscleRows: RankedValue[];
  neglectedMuscles: RankedValue[];
}

export function buildMobileAnalyzer(snapshot: MobileSnapshot, range: MobileRangePreset = "30d", muscleFilter = "all"): MobileAnalyzerModel {
  const dataset = toAnalyticsDataset(snapshot, range, muscleFilter);
  const summary = buildTrainingAnalytics(dataset, range === "block" ? "all" : range);
  const strengthRows = summary.exerciseMetrics
    .map((metric) => ({
      exerciseId: metric.exerciseId,
      exerciseName: metric.name,
      primaryMuscle: metric.primaryMuscle,
      maxWeight: metric.maxWeight,
      estimatedOneRm: metric.estimatedOneRepMax,
      bestSet: bestSetLabel(snapshot, metric.exerciseId),
      plateau: metric.plateau,
      strengthTrend: metric.strengthTrend
    }))
    .sort((a, b) => b.estimatedOneRm - a.estimatedOneRm);

  const strengthPrs = nonBaselinePrs(dataset.personalRecords)
    .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt));
  const recentPrs = strengthPrs;
  const muscleRows = summary.muscleVolume.map((metric) => ({
    label: metric.muscle,
    value: metric.volume,
    meta: formatRelatedSets(metric.sets)
  }));
  const topMuscle = muscleRows[0];
  const leastMuscle = [...muscleRows].reverse().find((row) => row.value > 0);
  const currentBlock = currentBlockLabel(snapshot);
  const fatigue = summary.fatigueFlags[0];
  const weak = summary.weakPoints[0];
  const insight = summary.insights[0] ?? summary.recommendations[0];

  return {
    summary,
    currentBlockName: currentBlock,
    topInsight: insight ? `${insight.title}: ${insight.detail}` : "Import a desktop analytics seed to unlock training insights.",
    weakPoint: weak ? `${weak.title}: ${weak.detail}` : leastMuscle ? `${leastMuscle.label} has the lowest tracked volume in this range.` : "No weak point detected yet.",
    fatigueWarning: fatigue ? `${fatigue.muscle}: ${fatigue.detail}` : "No recovery/fatigue warning detected from imported data.",
    bestRecentLift: bestRecentLiftLabel(snapshot, dataset.personalRecords),
    mostTrainedMuscle: topMuscle ? `${topMuscle.label} (${formatNumber(topMuscle.value)})` : "No muscle volume yet",
    leastTrainedMuscle: leastMuscle ? `${leastMuscle.label} (${formatNumber(leastMuscle.value)})` : "No muscle volume yet",
    recentPrs,
    strengthPrs,
    prsByType: groupPrs(strengthPrs, (record) => formatPr(record.type)),
    prsByImportance: groupPrs(strengthPrs, (record) => record.importance ?? "small"),
    allTimeBestPrs: bestPrsByExerciseAndType(dataset.personalRecords),
    strengthRows,
    maxWeightRows: [...strengthRows].sort((a, b) => b.maxWeight - a.maxWeight),
    plateauRows: strengthRows.filter((row) => row.plateau),
    improvingRows: [...strengthRows].filter((row) => row.strengthTrend > 0).sort((a, b) => b.strengthTrend - a.strengthTrend),
    dailyRows: summary.dailyVolume.map((row) => ({ label: shortDate(row.date), value: row.volume, meta: formatCountWithUnit(row.sets, "set") })).reverse(),
    weeklyRows: summary.weeklyVolume.map((row) => ({ label: `Week ${shortDate(row.weekStart)}`, value: row.volume, meta: formatCountWithUnit(row.sessions, "session") })).reverse(),
    topExerciseVolumeRows: summary.exerciseMetrics.map((metric) => ({ label: metric.name, value: metric.volume, meta: formatCountWithUnit(metric.sets, "set") })).sort((a, b) => b.value - a.value),
    topMuscleRows: muscleRows.slice(0, 6),
    muscleRows,
    neglectedMuscles: [...muscleRows].filter((row) => row.value > 0).sort((a, b) => a.value - b.value).slice(0, 6)
  };
}

export function availableMuscles(snapshot: MobileSnapshot): string[] {
  const muscles = new Set<string>();
  for (const exercise of snapshot.exercises.filter((row) => !row.deletedAt)) {
    for (const contribution of resolveMuscleContributions(exercise)) {
      if (contribution.muscle) muscles.add(contribution.muscle);
    }
  }
  return [...muscles].sort();
}

function toAnalyticsDataset(snapshot: MobileSnapshot, range: MobileRangePreset, muscleFilter: string): AnalyticsDataset {
  const currentBlockId = resolveCurrentBlockId(snapshot);
  const exercises = snapshot.exercises.filter((row) => !row.deletedAt);
  const exerciseIds = new Set(exercises.filter((exercise) => muscleFilter === "all" || exerciseContributesToMuscle(exercise, muscleFilter)).map((exercise) => exercise.id));
  const sessions = snapshot.sessions.filter((row) => !row.deletedAt && isAnalyticsSession(row) && (range !== "block" || !currentBlockId || row.trainingBlockId === currentBlockId));
  const sessionIds = new Set(sessions.map((session) => session.id));
  const sessionExercises = snapshot.sessionExercises.filter((row) => !row.deletedAt && sessionIds.has(row.workoutSessionId) && exerciseIds.has(row.exerciseId));
  const rowIds = new Set(sessionExercises.map((row) => row.id));
  return {
    exercises,
    sessions,
    sessionExercises,
    setLogs: snapshot.setLogs.filter((row) => !row.deletedAt && rowIds.has(row.workoutSessionExerciseId)),
    personalRecords: snapshot.personalRecords.filter((row) => !row.deletedAt && exerciseIds.has(row.exerciseId)),
    trainingGoal: "general_fitness",
    trainingBlocks: snapshot.trainingBlocks.filter((row) => !row.deletedAt),
    currentTrainingBlockId: currentBlockId
  };
}

function bestSetLabel(snapshot: MobileSnapshot, exerciseId: string): string {
  const rowIds = new Set(snapshot.sessionExercises.filter((row) => row.exerciseId === exerciseId && !row.deletedAt).map((row) => row.id));
  const best = snapshot.setLogs
    .filter((set) => !set.deletedAt && rowIds.has(set.workoutSessionExerciseId))
    .sort((a, b) => estimatedOneRepMax(b.weight, b.reps) - estimatedOneRepMax(a.weight, a.reps))[0];
  return best ? `${formatNumber(best.weight)}x${best.reps}` : "n/a";
}

function bestRecentLiftLabel(snapshot: MobileSnapshot, records: PersonalRecord[]): string {
  const best = nonBaselinePrs(records).sort((a, b) => b.achievedAt.localeCompare(a.achievedAt))[0];
  const exercise = snapshot.exercises.find((item) => item.id === best?.exerciseId);
  return best ? `${exercise?.name ?? "Exercise"} ${formatPr(best.type)} ${formatNumber(best.value)} ${best.unit}` : "No meaningful PR imported yet";
}

function nonBaselinePrs(records: PersonalRecord[]): PersonalRecord[] {
  const allowed = new Set<PRImportance>(["major", "medium", "small"]);
  return records.filter((record) => allowed.has((record.importance ?? "small") as PRImportance));
}

function groupPrs(records: PersonalRecord[], label: (record: PersonalRecord) => string): RankedValue[] {
  const counts = new Map<string, number>();
  for (const record of records) counts.set(label(record), (counts.get(label(record)) ?? 0) + 1);
  return [...counts.entries()].map(([key, value]) => ({ label: key, value })).sort((a, b) => b.value - a.value);
}

function bestPrsByExerciseAndType(records: PersonalRecord[]): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();
  for (const record of nonBaselinePrs(records)) {
    const key = `${record.exerciseId}|${record.type}`;
    const current = best.get(key);
    if (!current || record.value > current.value) best.set(key, record);
  }
  return [...best.values()].sort((a, b) => b.value - a.value).slice(0, 12);
}

function exerciseContributesToMuscle(exercise: MobileSnapshot["exercises"][number], muscle: string): boolean {
  return resolveMuscleContributions(exercise).some((contribution) => contribution.muscle === muscle);
}

function isAnalyticsSession(session: MobileSnapshot["sessions"][number]): boolean {
  return Boolean(session.finishedAt) || session.importSource === "mobile-pwa";
}

function resolveCurrentBlockId(snapshot: MobileSnapshot): string | null {
  const open = snapshot.trainingBlocks.filter((block) => !block.deletedAt && !block.endedAt).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  return open?.id ?? null;
}

function currentBlockLabel(snapshot: MobileSnapshot): string {
  const id = resolveCurrentBlockId(snapshot);
  return snapshot.trainingBlocks.find((block) => block.id === id)?.name ?? "No current block";
}

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatPr(type: string): string {
  return type.replace(/_/g, " ");
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString();
}

function formatCountWithUnit(value: number, unit: string): string {
  const rounded = Math.round(value);
  return `${rounded.toLocaleString()} ${unit}${rounded === 1 ? "" : "s"}`;
}

function formatRelatedSets(value: number): string {
  const rounded = Math.round(value);
  if (value > 0 && rounded === 0) return "less than 1 related set";
  return `${rounded.toLocaleString()} related set${rounded === 1 ? "" : "s"}`;
}
