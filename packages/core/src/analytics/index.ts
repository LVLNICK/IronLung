import {
  estimatedOneRepMax,
  exerciseSessionVolume,
  round,
  setVolume,
  workoutSessionVolume
} from "../calculations";
import { distributedMuscleVolume } from "../muscle-contributions";
import type {
  Exercise,
  PersonalRecord,
  PRType,
  SetLog,
  TrainingBlock,
  TrainingGoal,
  WorkoutSession,
  WorkoutSessionExercise
} from "../types";

export type DateRangePreset = "7d" | "30d" | "90d" | "1y" | "all";
export type InsightSeverity = "high" | "medium" | "low" | "positive";

export interface AnalyticsDataset {
  exercises: Exercise[];
  sessions: WorkoutSession[];
  sessionExercises: WorkoutSessionExercise[];
  setLogs: SetLog[];
  personalRecords: PersonalRecord[];
  trainingGoal?: TrainingGoal;
  trainingBlocks?: TrainingBlock[];
  currentTrainingBlockId?: string | null;
}

export interface DateRange {
  start: string | null;
  end: string | null;
  preset: DateRangePreset;
}

export interface MuscleMetric {
  muscle: string;
  volume: number;
  sets: number;
  exercises: number;
  prs: number;
  lastTrained: string | null;
}

export interface TrainingBlockMetric {
  blockId: string;
  name: string;
  goal?: TrainingGoal;
  sessions: number;
  sets: number;
  volume: number;
  prs: number;
  startedAt: string;
  endedAt: string | null;
}

export interface ExerciseMetric {
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  movementPattern: string;
  sessions: number;
  sets: number;
  reps: number;
  volume: number;
  maxWeight: number;
  bestSetVolume: number;
  estimatedOneRepMax: number;
  prs: number;
  lastTrained: string | null;
  sessionsSincePr: number | null;
  strengthTrend: number;
  volumeTrend: number;
  plateau: boolean;
}

export interface SmartInsight {
  id: string;
  title: string;
  detail: string;
  severity: InsightSeverity;
  metric?: string;
  recommendation?: string;
}

export interface FatigueFlag {
  muscle: string;
  severity: Exclude<InsightSeverity, "positive">;
  detail: string;
  recentSets: number;
  recentHardSets: number;
}

export interface BalanceScore {
  overall: number;
  pushPull: number;
  upperLower: number;
  chestBack: number;
  quadHamstring: number;
  shoulder: number;
}

export interface AnalyticsSummary {
  range: DateRange;
  totals: {
    sessions: number;
    activeDays: number;
    sets: number;
    reps: number;
    volume: number;
    prs: number;
    avgRpe: number | null;
  };
  comparison: {
    volumeDeltaPercent: number;
    sessionsDeltaPercent: number;
    setsDeltaPercent: number;
    prsDeltaPercent: number;
  };
  dailyVolume: Array<{ date: string; volume: number; sets: number; sessions: number; prs: number }>;
  weeklyVolume: Array<{ weekStart: string; volume: number; sets: number; sessions: number; prs: number }>;
  muscleVolume: MuscleMetric[];
  equipmentVolume: Array<{ equipment: string; volume: number; sets: number }>;
  movementPatternVolume: Array<{ movementPattern: string; volume: number; sets: number }>;
  exerciseMetrics: ExerciseMetric[];
  prGroups: Array<{ type: PRType; count: number; lastAchievedAt: string | null }>;
  balance: BalanceScore;
  fatigueFlags: FatigueFlag[];
  weakPoints: SmartInsight[];
  insights: SmartInsight[];
  recommendations: SmartInsight[];
  trainingGoal: TrainingGoal;
  trainingBlocks: TrainingBlockMetric[];
  currentBlock: TrainingBlockMetric | null;
}

export function buildTrainingAnalytics(dataset: AnalyticsDataset, preset: DateRangePreset = "30d", now = new Date()): AnalyticsSummary {
  const range = resolveDateRange(dataset.sessions, preset, now);
  const current = filterDatasetByRange(dataset, range);
  const previous = filterDatasetByRange(dataset, previousRange(range));
  const daily = dailyVolume(current);
  const weekly = weeklyTrainingVolume(current);
  const muscles = muscleVolume(current);
  const exercises = exerciseMetrics(current);
  const balance = muscleBalanceScore(muscles);
  const fatigueFlags = generateFatigueFlags(current, now);
  const weakPoints = detectWeakPoints({ muscles, exercises, balance });
  const trainingGoal = dataset.trainingGoal ?? "general_fitness";
  const blocks = trainingBlockMetrics(current, dataset.trainingBlocks ?? []);
  const currentBlock = (dataset.currentTrainingBlockId ? blocks.find((block) => block.blockId === dataset.currentTrainingBlockId) : blocks.find((block) => !block.endedAt)) ?? null;
  const insights = generateSmartInsights({ current, previous, muscles, exercises, balance, fatigueFlags, weakPoints, trainingGoal, currentBlock });
  const recommendations = generateTrainingRecommendations(insights, trainingGoal);

  return {
    range,
    totals: totals(current),
    comparison: comparePeriods(current, previous),
    dailyVolume: daily,
    weeklyVolume: weekly,
    muscleVolume: muscles,
    equipmentVolume: equipmentVolume(current),
    movementPatternVolume: movementPatternVolume(current),
    exerciseMetrics: exercises,
    prGroups: groupPrsByType(current.personalRecords),
    balance,
    fatigueFlags,
    weakPoints,
    insights,
    recommendations,
    trainingGoal,
    trainingBlocks: blocks,
    currentBlock
  };
}

export function resolveDateRange(sessions: WorkoutSession[], preset: DateRangePreset, now = new Date()): DateRange {
  const latest = sessions.map((session) => session.startedAt).sort().at(-1);
  if (preset === "all") {
    return {
      preset,
      start: sessions.map((session) => session.startedAt).sort()[0] ?? null,
      end: latest ?? null
    };
  }
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : preset === "90d" ? 90 : 365;
  const end = latest ? new Date(latest) : now;
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { preset, start: start.toISOString(), end: end.toISOString() };
}

export function filterDatasetByRange(dataset: AnalyticsDataset, range: DateRange): AnalyticsDataset {
  if (!range.start || !range.end) return { ...dataset, sessions: [], sessionExercises: [], setLogs: [], personalRecords: [] };
  const sessions = dataset.sessions.filter((session) => session.startedAt >= range.start! && session.startedAt <= range.end!);
  const sessionIds = new Set(sessions.map((session) => session.id));
  const sessionExercises = dataset.sessionExercises.filter((row) => sessionIds.has(row.workoutSessionId));
  const sessionExerciseIds = new Set(sessionExercises.map((row) => row.id));
  const setLogs = dataset.setLogs.filter((set) => sessionExerciseIds.has(set.workoutSessionExerciseId));
  const personalRecords = dataset.personalRecords.filter((record) => record.achievedAt >= range.start! && record.achievedAt <= range.end!);
  return { ...dataset, sessions, sessionExercises, setLogs, personalRecords };
}

export function dailyVolume(dataset: AnalyticsDataset) {
  const sessionSets = setsBySession(dataset);
  const days = new Map<string, { date: string; volume: number; sets: number; sessions: number; prs: number }>();
  for (const session of dataset.sessions) {
    const date = dayKey(session.startedAt);
    const row = days.get(date) ?? { date, volume: 0, sets: 0, sessions: 0, prs: 0 };
    const sets = sessionSets.get(session.id) ?? [];
    row.volume = round(row.volume + workoutSessionVolume(sets));
    row.sets += sets.flat().length;
    row.sessions += 1;
    row.prs += dataset.personalRecords.filter((record) => record.workoutSessionId === session.id).length;
    days.set(date, row);
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function weeklyTrainingVolume(dataset: AnalyticsDataset) {
  const weeks = new Map<string, { weekStart: string; volume: number; sets: number; sessions: number; prs: number }>();
  for (const day of dailyVolume(dataset)) {
    const weekStart = weekKey(day.date);
    const row = weeks.get(weekStart) ?? { weekStart, volume: 0, sets: 0, sessions: 0, prs: 0 };
    row.volume = round(row.volume + day.volume);
    row.sets += day.sets;
    row.sessions += day.sessions;
    row.prs += day.prs;
    weeks.set(weekStart, row);
  }
  return [...weeks.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function muscleVolume(dataset: AnalyticsDataset): MuscleMetric[] {
  const exerciseById = new Map(dataset.exercises.map((exercise) => [exercise.id, exercise]));
  const setMap = groupBy(dataset.setLogs, (set) => set.workoutSessionExerciseId);
  const sessionById = new Map(dataset.sessions.map((session) => [session.id, session]));
  const totals = new Map<string, MuscleMetric>();
  const exerciseIdsByMuscle = new Map<string, Set<string>>();

  for (const row of dataset.sessionExercises) {
    const exercise = exerciseById.get(row.exerciseId);
    if (!exercise) continue;
    const sets = setMap.get(row.id) ?? [];
    const baseVolume = exerciseSessionVolume(sets);
    const prs = dataset.personalRecords.filter((record) => record.exerciseId === row.exerciseId).length;
    const lastTrained = sessionById.get(row.workoutSessionId)?.startedAt ?? null;
    for (const contribution of distributedMuscleVolume(exercise, baseVolume)) {
      addMuscleVolume(totals, exerciseIdsByMuscle, contribution.muscle, contribution.volume, round(sets.length * contribution.percent), row.exerciseId, Math.round(prs * contribution.percent), lastTrained);
    }
  }
  return [...totals.values()].sort((a, b) => b.volume - a.volume);
}

export function exerciseMetrics(dataset: AnalyticsDataset): ExerciseMetric[] {
  const rowByExercise = groupBy(dataset.sessionExercises, (row) => row.exerciseId);
  const setMap = groupBy(dataset.setLogs, (set) => set.workoutSessionExerciseId);
  const sessionById = new Map(dataset.sessions.map((session) => [session.id, session]));
  return dataset.exercises
    .map((exercise) => {
      const rows = rowByExercise.get(exercise.id) ?? [];
      const sets = rows.flatMap((row) => setMap.get(row.id) ?? []);
      const sessionDates = rows.map((row) => sessionById.get(row.workoutSessionId)?.startedAt).filter(Boolean) as string[];
      const prs = dataset.personalRecords.filter((record) => record.exerciseId === exercise.id).sort((a, b) => b.achievedAt.localeCompare(a.achievedAt));
      const sessionVolumes = rows.map((row) => exerciseSessionVolume(setMap.get(row.id) ?? []));
      const oneRepMaxes = sets.map((set) => estimatedOneRepMax(set.weight, set.reps));
      const latestPrSession = prs[0]?.workoutSessionId;
      const latestPrIndex = latestPrSession ? rows.findIndex((row) => row.workoutSessionId === latestPrSession) : -1;
      const sessionsSincePr = latestPrIndex >= 0 ? rows.length - latestPrIndex - 1 : null;
      const strengthTrend = slope(oneRepMaxes.slice(-8));
      return {
        exerciseId: exercise.id,
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscles: exercise.secondaryMuscles,
        equipment: exercise.equipment,
        movementPattern: exercise.movementPattern,
        sessions: new Set(rows.map((row) => row.workoutSessionId)).size,
        sets: sets.length,
        reps: sum(sets.map((set) => set.reps)),
        volume: exerciseSessionVolume(sets),
        maxWeight: max(sets.map((set) => set.weight)),
        bestSetVolume: max(sets.map((set) => setVolume(set.weight, set.reps))),
        estimatedOneRepMax: max(oneRepMaxes),
        prs: prs.length,
        lastTrained: sessionDates.sort().at(-1) ?? null,
        sessionsSincePr,
        strengthTrend,
        volumeTrend: slope(sessionVolumes.slice(-6)),
        plateau: rows.length >= 4 && (sessionsSincePr ?? 0) >= 4 && strengthTrend <= 0
      };
    })
    .sort((a, b) => b.volume - a.volume);
}

export function equipmentVolume(dataset: AnalyticsDataset) {
  return aggregateExerciseProperty(dataset, "equipment");
}

export function movementPatternVolume(dataset: AnalyticsDataset) {
  return aggregateExerciseProperty(dataset, "movementPattern");
}

export function groupPrsByType(records: PersonalRecord[]): Array<{ type: PRType; count: number; lastAchievedAt: string | null }> {
  return [...groupBy(records, (record) => record.type).entries()].map(([type, rows]) => ({
    type,
    count: rows.length,
    lastAchievedAt: rows.map((row) => row.achievedAt).sort().at(-1) ?? null
  })).sort((a, b) => b.count - a.count);
}

export function muscleBalanceScore(muscles: MuscleMetric[]): BalanceScore {
  const volume = (names: string[]) => sum(muscles.filter((row) => names.includes(row.muscle)).map((row) => row.volume));
  const push = volume(["Pectoralis major", "Upper pectoralis major", "Anterior deltoids", "Triceps brachii", "Quads"]);
  const pull = volume(["Latissimus dorsi", "Lats", "Rhomboids", "Traps", "Rear delts", "Biceps brachii", "Hamstrings"]);
  const upper = volume(["Pectoralis major", "Upper pectoralis major", "Anterior deltoids", "Rear delts", "Triceps brachii", "Biceps brachii", "Latissimus dorsi", "Lats", "Rhomboids", "Traps"]);
  const lower = volume(["Quads", "Hamstrings", "Glutes", "Gastrocnemius", "Soleus", "Adductors"]);
  const chest = volume(["Pectoralis major", "Upper pectoralis major"]);
  const back = volume(["Latissimus dorsi", "Lats", "Rhomboids", "Traps"]);
  const quads = volume(["Quads"]);
  const hamstrings = volume(["Hamstrings"]);
  const frontShoulder = volume(["Anterior deltoids"]);
  const rearShoulder = volume(["Rear delts", "Rotator cuff"]);
  const scores = {
    pushPull: ratioScore(push, pull),
    upperLower: ratioScore(upper, lower),
    chestBack: ratioScore(chest, back),
    quadHamstring: ratioScore(quads, hamstrings),
    shoulder: ratioScore(frontShoulder, rearShoulder)
  };
  return { ...scores, overall: round((scores.pushPull + scores.upperLower + scores.chestBack + scores.quadHamstring + scores.shoulder) / 5) };
}

export function detectWeakPoints(input: { muscles: MuscleMetric[]; exercises: ExerciseMetric[]; balance: BalanceScore }): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const medianVolume = median(input.muscles.map((row) => row.volume));
  for (const row of input.muscles) {
    if (medianVolume > 0 && row.volume < medianVolume * 0.45) {
      insights.push(insight("weak-" + row.muscle, `${row.muscle} is undertrained`, `${row.muscle} exposure is less than half of the median trained muscle.`, "medium", compact(row.volume), "Add attention to this muscle through your own exercise selection."));
    }
  }
  for (const exercise of input.exercises.filter((row) => row.plateau).slice(0, 8)) {
    insights.push(insight("plateau-" + exercise.exerciseId, `${exercise.name} may be plateauing`, "Recent sessions do not show a positive estimated strength trend and no recent PR was detected.", "medium", `${exercise.sessionsSincePr} sessions since PR`, "Review load, reps, RPE, and recovery before deciding what to change."));
  }
  if (input.balance.pushPull < 70) insights.push(insight("balance-push-pull", "Push/pull balance is off", "Pushing and pulling exposure are meaningfully mismatched.", "high", `${input.balance.pushPull}/100`, "Use this as a focus signal, not a premade plan."));
  if (input.balance.quadHamstring < 70) insights.push(insight("balance-legs", "Quad/hamstring balance is off", "Quad and hamstring exposure are meaningfully mismatched.", "medium", `${input.balance.quadHamstring}/100`, "Bring attention to the weaker side of the pattern."));
  return insights;
}

export function generateFatigueFlags(dataset: AnalyticsDataset, now = new Date()): FatigueFlag[] {
  const recent = filterDatasetByRange(dataset, { preset: "7d", start: new Date(now.getTime() - 6 * 86_400_000).toISOString(), end: now.toISOString() });
  const muscles = muscleVolume(recent);
  return muscles
    .map((row) => {
      const recentHardSets = Math.round(row.sets * hardSetRatio(recent));
      const severity = row.sets >= 24 || recentHardSets >= 12 ? "high" : row.sets >= 14 || recentHardSets >= 7 ? "medium" : "low";
      return {
        muscle: row.muscle,
        severity,
        recentSets: row.sets,
        recentHardSets,
        detail: `${row.muscle} has ${row.sets} related sets in the last 7 days.`
      } satisfies FatigueFlag;
    })
    .filter((flag) => flag.severity !== "low")
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

export function generateSmartInsights(input: {
  current: AnalyticsDataset;
  previous: AnalyticsDataset;
  muscles: MuscleMetric[];
  exercises: ExerciseMetric[];
  balance: BalanceScore;
  fatigueFlags: FatigueFlag[];
  weakPoints: SmartInsight[];
  trainingGoal?: TrainingGoal;
  currentBlock?: TrainingBlockMetric | null;
}): SmartInsight[] {
  const insights: SmartInsight[] = [...input.weakPoints];
  const comparison = comparePeriods(input.current, input.previous);
  if (comparison.volumeDeltaPercent <= -15) insights.push(insight("volume-down", "Training volume is down", `Volume is down ${Math.abs(comparison.volumeDeltaPercent)}% versus the previous matched period.`, "medium"));
  if (comparison.volumeDeltaPercent >= 20) insights.push(insight("volume-up", "Training volume jumped", `Volume is up ${comparison.volumeDeltaPercent}% versus the previous matched period.`, "medium", undefined, "Watch recovery if RPE or fatigue flags are also rising."));
  for (const flag of input.fatigueFlags.slice(0, 5)) {
    insights.push(insight("fatigue-" + flag.muscle, `${flag.muscle} fatigue flag`, flag.detail, flag.severity, `${flag.recentSets} sets`, "Treat this as a workload warning, not medical advice."));
  }
  const improving = input.exercises.filter((exercise) => exercise.strengthTrend > 0).sort((a, b) => b.strengthTrend - a.strengthTrend)[0];
  if (improving) insights.push(insight("improving-" + improving.exerciseId, `${improving.name} is improving`, `Estimated strength is up by ${improving.strengthTrend} over recent sets.`, "positive"));
  if (input.balance.overall >= 82) insights.push(insight("balance-good", "Muscle balance looks solid", `Overall balance score is ${input.balance.overall}/100.`, "positive"));
  insights.push(...goalInsights(input.trainingGoal ?? "general_fitness", input));
  if (input.currentBlock) {
    insights.push(insight("current-block", `${input.currentBlock.name} block is active`, `${input.currentBlock.sessions} sessions, ${compact(input.currentBlock.volume)} volume, and ${input.currentBlock.prs} PRs are assigned to this block.`, "positive", undefined, "Use block trends to judge the phase, not one isolated workout."));
  }
  return dedupeInsights(insights).slice(0, 18);
}

export function generateTrainingRecommendations(insights: SmartInsight[], goal: TrainingGoal = "general_fitness"): SmartInsight[] {
  return insights
    .filter((item) => item.recommendation || item.severity === "high" || item.severity === "medium")
    .slice(0, 6)
    .map((item, index) => ({
      ...item,
      id: `recommendation-${index}-${item.id}`,
      title: item.title.replace(" is ", " focus: "),
      recommendation: item.recommendation ?? fallbackRecommendation(goal)
    }));
}

export function comparePeriods(current: AnalyticsDataset, previous: AnalyticsDataset) {
  const currentTotals = totals(current);
  const previousTotals = totals(previous);
  return {
    volumeDeltaPercent: deltaPercent(currentTotals.volume, previousTotals.volume),
    sessionsDeltaPercent: deltaPercent(currentTotals.sessions, previousTotals.sessions),
    setsDeltaPercent: deltaPercent(currentTotals.sets, previousTotals.sets),
    prsDeltaPercent: deltaPercent(currentTotals.prs, previousTotals.prs)
  };
}

export function totals(dataset: AnalyticsDataset) {
  const rpes = dataset.setLogs.map((set) => set.rpe).filter((value): value is number => typeof value === "number");
  return {
    sessions: dataset.sessions.length,
    activeDays: new Set(dataset.sessions.map((session) => dayKey(session.startedAt))).size,
    sets: dataset.setLogs.length,
    reps: sum(dataset.setLogs.map((set) => set.reps)),
    volume: sum(dataset.setLogs.map((set) => setVolume(set.weight, set.reps))),
    prs: dataset.personalRecords.length,
    avgRpe: rpes.length ? round(sum(rpes) / rpes.length) : null
  };
}

export function trainingBlockMetrics(dataset: AnalyticsDataset, blocks: TrainingBlock[]): TrainingBlockMetric[] {
  const setsBySessionId = setsBySession(dataset);
  return blocks.map((block) => {
    const sessions = dataset.sessions.filter((session) => session.trainingBlockId === block.id);
    return {
      blockId: block.id,
      name: block.name,
      goal: block.goal,
      sessions: sessions.length,
      sets: sessions.reduce((count, session) => count + (setsBySessionId.get(session.id) ?? []).flat().length, 0),
      volume: round(sessions.reduce((total, session) => total + workoutSessionVolume(setsBySessionId.get(session.id) ?? []), 0)),
      prs: dataset.personalRecords.filter((record) => sessions.some((session) => session.id === record.workoutSessionId)).length,
      startedAt: block.startedAt,
      endedAt: block.endedAt ?? null
    };
  }).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

function previousRange(range: DateRange): DateRange {
  if (!range.start || !range.end || range.preset === "all") return { ...range, start: null, end: null };
  const start = new Date(range.start);
  const end = new Date(range.end);
  const length = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - length);
  return { preset: range.preset, start: previousStart.toISOString(), end: previousEnd.toISOString() };
}

function setsBySession(dataset: AnalyticsDataset) {
  const setsByRow = groupBy(dataset.setLogs, (set) => set.workoutSessionExerciseId);
  const result = new Map<string, SetLog[][]>();
  for (const session of dataset.sessions) {
    result.set(session.id, dataset.sessionExercises.filter((row) => row.workoutSessionId === session.id).map((row) => setsByRow.get(row.id) ?? []));
  }
  return result;
}

function addMuscleVolume(map: Map<string, MuscleMetric>, exerciseIdsByMuscle: Map<string, Set<string>>, muscle: string, volume: number, sets: number, exerciseId: string, prs: number, lastTrained: string | null) {
  const row = map.get(muscle) ?? { muscle, volume: 0, sets: 0, exercises: 0, prs: 0, lastTrained: null };
  const exerciseIds = exerciseIdsByMuscle.get(muscle) ?? new Set<string>();
  exerciseIds.add(exerciseId);
  exerciseIdsByMuscle.set(muscle, exerciseIds);
  row.volume = round(row.volume + volume);
  row.sets += sets;
  row.exercises = exerciseIds.size;
  row.prs += prs;
  if (lastTrained && (!row.lastTrained || lastTrained > row.lastTrained)) row.lastTrained = lastTrained;
  map.set(muscle, row);
}

function aggregateExerciseProperty(dataset: AnalyticsDataset, property: "equipment" | "movementPattern") {
  const metrics = exerciseMetrics(dataset);
  const key = property === "equipment" ? "equipment" : "movementPattern";
  return [...groupBy(metrics, (row) => row[key]).entries()].map(([name, rows]) => ({
    [key]: name,
    volume: sum(rows.map((row) => row.volume)),
    sets: sum(rows.map((row) => row.sets))
  })) as Array<Record<typeof key, string> & { volume: number; sets: number }>;
}

function ratioScore(a: number, b: number) {
  if (a <= 0 && b <= 0) return 100;
  if (a <= 0 || b <= 0) return 0;
  return round((Math.min(a, b) / Math.max(a, b)) * 100);
}

function hardSetRatio(dataset: AnalyticsDataset) {
  if (!dataset.setLogs.length) return 0;
  return dataset.setLogs.filter((set) => set.setType === "failure" || set.setType === "amrap" || (set.rpe ?? 0) >= 9).length / dataset.setLogs.length;
}

function groupBy<T, K extends string>(items: T[], getKey: (item: T) => K) {
  const map = new Map<K, T[]>();
  for (const item of items) map.set(getKey(item), [...(map.get(getKey(item)) ?? []), item]);
  return map;
}

function dayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function weekKey(day: string) {
  const date = new Date(`${day}T00:00:00.000Z`);
  const diff = date.getUTCDay() === 0 ? -6 : 1 - date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

function insight(id: string, title: string, detail: string, severity: InsightSeverity, metric?: string, recommendation?: string): SmartInsight {
  return { id, title, detail, severity, metric, recommendation };
}

function dedupeInsights(items: SmartInsight[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function deltaPercent(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return round(((current - previous) / previous) * 100);
}

function slope(values: number[]) {
  if (values.length < 2) return 0;
  return round(values.at(-1)! - values[0]);
}

function median(values: number[]) {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : round((sorted[middle - 1] + sorted[middle]) / 2);
}

function compact(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function max(values: number[]) {
  return values.length ? Math.max(...values) : 0;
}

function sum(values: number[]) {
  return round(values.reduce((total, value) => total + value, 0));
}

const severityRank = {
  high: 0,
  medium: 1,
  low: 2
} as const;

function goalInsights(goal: TrainingGoal, input: { exercises: ExerciseMetric[]; muscles: MuscleMetric[]; balance: BalanceScore; fatigueFlags: FatigueFlag[]; current: AnalyticsDataset; previous: AnalyticsDataset }): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const bestStrength = [...input.exercises].sort((a, b) => b.estimatedOneRepMax - a.estimatedOneRepMax)[0];
  const mostVolume = input.muscles[0];
  const comparison = comparePeriods(input.current, input.previous);
  if (goal === "strength" && bestStrength) {
    insights.push(insight("goal-strength", "Strength goal focus", `${bestStrength.name} is currently your strongest tracked lift by estimated 1RM. Prioritize heavy-set quality and plateau monitoring.`, "positive", `${bestStrength.estimatedOneRepMax} e1RM`, "Favor high-quality top sets and keep fatigue flags in view."));
  }
  if (goal === "hypertrophy" && mostVolume) {
    insights.push(insight("goal-hypertrophy", "Hypertrophy goal focus", `${mostVolume.muscle} has the most distributed volume this period. Watch whether other target muscles are falling behind.`, "medium", compact(mostVolume.volume), "Use weekly sets and muscle balance as the primary decision signals."));
  }
  if (goal === "lean_bulk") {
    insights.push(insight("goal-lean-bulk", "Lean bulk focus", `Volume is ${comparison.volumeDeltaPercent}% versus the previous period. A small upward trend with consistent sessions is the cleanest signal.`, "medium", `${comparison.volumeDeltaPercent}%`, "Look for progressive overload without a large fatigue spike."));
  }
  if (goal === "cutting") {
    insights.push(insight("goal-cutting", "Cutting focus", "Strength retention, consistency, and fatigue management are more useful than chasing every small PR.", "medium", undefined, "Treat major strength drops and high fatigue flags as review signals."));
  }
  if (goal === "powerbuilding") {
    insights.push(insight("goal-powerbuilding", "Powerbuilding focus", `Balance score is ${input.balance.overall}/100 while strength trends are tracked per lift.`, "medium", `${input.balance.overall}/100`, "Balance top-set progress with enough distributed muscle volume."));
  }
  return insights;
}

function fallbackRecommendation(goal: TrainingGoal) {
  const copy: Record<TrainingGoal, string> = {
    strength: "Use estimated 1RM, max weight, and plateau signals to choose your next self-built focus.",
    hypertrophy: "Use weekly sets, distributed muscle volume, and frequency to choose your next self-built focus.",
    lean_bulk: "Use progressive overload, volume growth, and consistency as the main decision signals.",
    cutting: "Use strength retention, fatigue flags, and consistency as the main decision signals.",
    powerbuilding: "Balance heavy top-set progress with enough weekly muscle volume.",
    general_fitness: "Use this signal to decide your next self-built workout focus."
  };
  return copy[goal];
}
