import {
  estimatedOneRepMax,
  exerciseSessionVolume,
  round,
  setVolume,
  workoutFrequencyStreaks,
  workoutSessionVolume,
  type BodyAnalysis,
  type Exercise,
  type PersonalRecord,
  type ProgressPhoto,
  type SetLog,
  type WorkoutSession,
  type WorkoutSessionExercise
} from "@ironlog/core";

export interface AnalyticsInput {
  exercises: Exercise[];
  sessions: WorkoutSession[];
  sessionExercises: WorkoutSessionExercise[];
  setLogs: SetLog[];
  personalRecords: PersonalRecord[];
  photos: ProgressPhoto[];
  analyses: BodyAnalysis[];
}

export interface DailyTrainingMetric {
  date: string;
  label: string;
  sessions: number;
  exercises: number;
  sets: number;
  reps: number;
  volume: number;
  prs: number;
  maxWeight: number;
  bestOneRm: number;
  avgRpe: number | null;
  active: boolean;
}

export function buildAnalyticsSnapshot(input: AnalyticsInput) {
  const exerciseById = new Map(input.exercises.map((exercise) => [exercise.id, exercise]));
  const sessionById = new Map(input.sessions.map((session) => [session.id, session]));
  const sessionExerciseById = new Map(input.sessionExercises.map((row) => [row.id, row]));
  const setsBySessionExerciseId = groupBy(input.setLogs, (set) => set.workoutSessionExerciseId);
  const sessionSets = buildSessionSetGroups(input.sessions, input.sessionExercises, input.setLogs);
  const sessionSummaries = input.sessions
    .map((session) => {
      const rows = input.sessionExercises.filter((row) => row.workoutSessionId === session.id);
      const sets = rows.flatMap((row) => setsBySessionExerciseId.get(row.id) ?? []);
      const rpes = sets.map((set) => set.rpe).filter((value): value is number => typeof value === "number");
      return {
        id: session.id,
        name: session.name,
        date: dayKey(session.startedAt),
        startedAt: session.startedAt,
        exercises: new Set(rows.map((row) => row.exerciseId)).size,
        sets: sets.length,
        reps: sum(sets.map((set) => set.reps)),
        volume: workoutSessionVolume(rows.map((row) => setsBySessionExerciseId.get(row.id) ?? [])),
        maxWeight: max(sets.map((set) => set.weight)),
        bestOneRm: max(sets.map((set) => estimatedOneRepMax(set.weight, set.reps))),
        avgRpe: rpes.length ? round(sum(rpes) / rpes.length) : null,
        prs: input.personalRecords.filter((record) => record.workoutSessionId === session.id).length
      };
    })
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  const daily = buildDailyMetrics(input.sessions, input.sessionExercises, input.setLogs, input.personalRecords);
  const activeDays = daily.filter((day) => day.active);
  const streaks = workoutFrequencyStreaks(input.sessions);
  const gaps = buildTrainingGaps(activeDays.map((day) => day.date));
  const totalVolume = sum(sessionSummaries.map((session) => session.volume));
  const completedSets = input.setLogs.filter((set) => set.isCompleted);
  const rpeSets = completedSets.filter((set) => typeof set.rpe === "number");
  const importedSets = input.setLogs.filter((set) => set.importSource);
  const duplicateImportHashes = duplicateCount(input.setLogs.map((set) => set.importHash).filter((hash): hash is string => Boolean(hash)));

  const topExercises = input.exercises
    .map((exercise) => {
      const rows = input.sessionExercises.filter((row) => row.exerciseId === exercise.id);
      const sets = rows.flatMap((row) => setsBySessionExerciseId.get(row.id) ?? []);
      const rpes = sets.map((set) => set.rpe).filter((value): value is number => typeof value === "number");
      const trainedSessions = new Set(rows.map((row) => row.workoutSessionId));
      return {
        exerciseId: exercise.id,
        name: safeText(exercise.name, "Unnamed exercise"),
        primaryMuscle: safeText(exercise.primaryMuscle, "Unknown"),
        secondaryMuscles: safeSecondaryMuscles(exercise.secondaryMuscles),
        equipment: safeText(exercise.equipment, "Unspecified"),
        movementPattern: safeText(exercise.movementPattern, "General strength"),
        sessions: trainedSessions.size,
        sets: sets.length,
        reps: sum(sets.map((set) => set.reps)),
        volume: exerciseSessionVolume(sets),
        maxWeight: max(sets.map((set) => set.weight)),
        bestOneRm: max(sets.map((set) => estimatedOneRepMax(set.weight, set.reps))),
        avgRpe: rpes.length ? round(sum(rpes) / rpes.length) : null,
        prs: input.personalRecords.filter((record) => record.exerciseId === exercise.id).length,
        lastTrained: maxString(rows.map((row) => sessionById.get(row.workoutSessionId)?.startedAt).filter(Boolean) as string[])
      };
    })
    .filter((exercise) => exercise.sets > 0)
    .sort((a, b) => b.volume - a.volume);

  const exerciseDetails = topExercises.map((exercise) => {
    const rows = input.sessionExercises.filter((row) => row.exerciseId === exercise.exerciseId);
    const sessions = rows
      .map((row) => {
        const session = sessionById.get(row.workoutSessionId);
        const sets = setsBySessionExerciseId.get(row.id) ?? [];
        if (!session || !sets.length) return null;
        return {
          sessionId: session.id,
          date: dayKey(session.startedAt),
          label: shortDayLabel(dayKey(session.startedAt)),
          workout: session.name,
          sets: sets.length,
          reps: sum(sets.map((set) => set.reps)),
          volume: exerciseSessionVolume(sets),
          maxWeight: max(sets.map((set) => set.weight)),
          bestOneRm: max(sets.map((set) => estimatedOneRepMax(set.weight, set.reps))),
          avgRpe: average(sets.map((set) => set.rpe).filter((value): value is number => typeof value === "number"))
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((a, b) => a.date.localeCompare(b.date));
    const records = input.personalRecords
      .filter((record) => record.exerciseId === exercise.exerciseId)
      .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt));
    return {
      ...exercise,
      trend: sessions,
      records,
      firstTrained: sessions[0]?.date ?? null,
      sessionsSincePr: sessionsSinceLatestPr(sessions, records),
      volumeTrend: slope(sessions.slice(-6).map((row) => row.volume)),
      strengthTrend: slope(sessions.slice(-6).map((row) => row.bestOneRm)),
      prRate: sessions.length ? round(records.length / sessions.length) : 0
    };
  });

  const exerciseVolumeSeries = topExercises.slice(0, 12).map((exercise) => ({
    name: exercise.name,
    volume: exercise.volume,
    sets: exercise.sets,
    prs: exercise.prs
  }));

  const muscleStats = [...groupBy(topExercises, (exercise) => exercise.primaryMuscle || "Unknown").entries()]
    .map(([muscle, rows]) => ({
      muscle,
      volume: sum(rows.map((row) => row.volume)),
      sets: sum(rows.map((row) => row.sets)),
      exercises: rows.length,
      prs: sum(rows.map((row) => row.prs))
    }))
    .sort((a, b) => b.volume - a.volume);

  const secondaryMuscleStats = buildSecondaryMuscleStats(topExercises);
  const muscleHeatStats = buildMuscleHeatStats(muscleStats, secondaryMuscleStats, exerciseDetails);

  const equipmentStats = [...groupBy(topExercises, (exercise) => exercise.equipment || "Unknown").entries()]
    .map(([equipment, rows]) => ({
      equipment,
      volume: sum(rows.map((row) => row.volume)),
      sets: sum(rows.map((row) => row.sets)),
      exercises: rows.length
    }))
    .sort((a, b) => b.volume - a.volume);

  const movementStats = [...groupBy(topExercises, (exercise) => exercise.movementPattern || "Unknown").entries()]
    .map(([movement, rows]) => ({
      movement,
      volume: sum(rows.map((row) => row.volume)),
      sets: sum(rows.map((row) => row.sets)),
      exercises: rows.length
    }))
    .sort((a, b) => b.volume - a.volume);

  const prByType = countBy(input.personalRecords, (record) => record.type);
  const prByMonth = aggregateBy(input.personalRecords, (record) => monthKey(record.achievedAt), () => 1);
  const weekly = aggregateDaily(daily, "week");
  const monthly = aggregateDaily(daily, "month");
  const dayOfWeek = buildDayOfWeekStats(sessionSummaries);
  const hourOfDay = buildHourStats(input.sessions);
  const rpeDistribution = buildRpeDistribution(completedSets);
  const setTypeDistribution = countBy(completedSets, (set) => set.setType);
  const weightBuckets = buildWeightBuckets(completedSets);
  const repBuckets = buildRepBuckets(completedSets);
  const zeroWeightSets = completedSets.filter((set) => set.weight === 0).length;
  const failureLikeSets = completedSets.filter((set) => set.setType === "failure" || set.setType === "amrap" || (set.rpe ?? 0) >= 9.5).length;
  const bodyweightEntries = input.sessions.filter((session) => typeof session.bodyweight === "number").length + input.photos.filter((photo) => typeof photo.bodyweight === "number").length;
  const photoScoreTrend = input.analyses
    .map((analysis) => ({ date: dayKey(analysis.createdAt), score: analysis.score, confidence: analysis.confidence }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const weakPointFindings = buildWeakPointFindings({
    muscleStats,
    secondaryMuscleStats,
    movementStats,
    exerciseDetails,
    latestWorkoutDate: input.sessions.map((session) => dayKey(session.startedAt)).sort().at(-1) ?? null
  });

  return {
    totals: {
      workouts: input.sessions.length,
      activeDays: activeDays.length,
      calendarDays: daily.length,
      exercises: input.exercises.length,
      trainedExercises: topExercises.length,
      sets: input.setLogs.length,
      reps: sum(input.setLogs.map((set) => set.reps)),
      volume: round(totalVolume),
      prs: input.personalRecords.length,
      photos: input.photos.length,
      analyses: input.analyses.length,
      avgSessionVolume: input.sessions.length ? round(totalVolume / input.sessions.length) : 0,
      avgSetsPerWorkout: input.sessions.length ? round(input.setLogs.length / input.sessions.length) : 0,
      avgVolumePerActiveDay: activeDays.length ? round(totalVolume / activeDays.length) : 0,
      trainingDensity: daily.length ? round((activeDays.length / daily.length) * 100) : 0,
      avgRpe: rpeSets.length ? round(sum(rpeSets.map((set) => set.rpe ?? 0)) / rpeSets.length) : null,
      bodyweightEntries
    },
    daily,
    activeDays,
    weekly,
    monthly,
    sessionSummaries,
    topExercises,
    exerciseDetails,
    exerciseVolumeSeries,
    muscleStats,
    secondaryMuscleStats,
    muscleHeatStats,
    equipmentStats,
    movementStats,
    prByType,
    prByMonth,
    recentPrs: [...input.personalRecords].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt)).slice(0, 50),
    dayOfWeek,
    hourOfDay,
    streaks: {
      ...streaks,
      longestGapDays: gaps.longestGapDays,
      avgGapDays: gaps.avgGapDays,
      daysSinceLastWorkout: daysSinceLast(activeDays.at(-1)?.date)
    },
    intensity: {
      rpeDistribution,
      setTypeDistribution,
      weightBuckets,
      repBuckets,
      failureLikeSets,
      zeroWeightSets,
      missingRpeSets: completedSets.length - rpeSets.length,
      rpeCoverage: completedSets.length ? round((rpeSets.length / completedSets.length) * 100) : 0
    },
    dataQuality: {
      importedSets: importedSets.length,
      manualSets: input.setLogs.length - importedSets.length,
      duplicateImportHashes,
      zeroWeightSets,
      missingRpeSets: completedSets.length - rpeSets.length,
      sessionsWithNotes: input.sessions.filter((session) => session.notes).length,
      setsWithNotes: input.setLogs.filter((set) => set.notes).length,
      bodyweightEntries,
      firstWorkout: input.sessions.map((session) => session.startedAt).sort()[0] ?? null,
      lastWorkout: input.sessions.map((session) => session.startedAt).sort().at(-1) ?? null
    },
    photoScoreTrend,
    weakPointFindings,
    sessionSets
  };
}

function buildSecondaryMuscleStats(exercises: Array<{ secondaryMuscles: string[]; volume: number; sets: number; prs: number }>) {
  const totals = new Map<string, { muscle: string; exposureVolume: number; sets: number; exercises: number; prs: number }>();
  for (const exercise of exercises) {
    for (const rawMuscle of exercise.secondaryMuscles) {
      const muscle = cleanMuscleLabel(rawMuscle);
      const row = totals.get(muscle) ?? { muscle, exposureVolume: 0, sets: 0, exercises: 0, prs: 0 };
      row.exposureVolume = round(row.exposureVolume + exercise.volume * 0.35);
      row.sets += exercise.sets;
      row.exercises += 1;
      row.prs += exercise.prs;
      totals.set(muscle, row);
    }
  }
  return [...totals.values()].sort((a, b) => b.exposureVolume - a.exposureVolume);
}

function buildMuscleHeatStats(
  primaryRows: Array<{ muscle: string; volume: number; sets: number; exercises: number; prs: number }>,
  secondaryRows: Array<{ muscle: string; exposureVolume: number; sets: number; exercises: number; prs: number }>,
  exerciseDetails: Array<{ primaryMuscle: string; secondaryMuscles: string[]; lastTrained: string | null; prs: number }>
) {
  const totals = new Map<string, { muscle: string; primaryVolume: number; secondaryVolume: number; totalExposure: number; sets: number; exercises: number; prs: number; lastTrained: string | null }>();
  for (const row of primaryRows) {
    const current = totals.get(row.muscle) ?? emptyMuscleHeat(row.muscle);
    current.primaryVolume = round(current.primaryVolume + row.volume);
    current.totalExposure = round(current.totalExposure + row.volume);
    current.sets += row.sets;
    current.exercises += row.exercises;
    current.prs += row.prs;
    totals.set(row.muscle, current);
  }
  for (const row of secondaryRows) {
    const current = totals.get(row.muscle) ?? emptyMuscleHeat(row.muscle);
    current.secondaryVolume = round(current.secondaryVolume + row.exposureVolume);
    current.totalExposure = round(current.totalExposure + row.exposureVolume);
    current.sets += row.sets;
    current.exercises += row.exercises;
    current.prs += row.prs;
    totals.set(row.muscle, current);
  }
  for (const exercise of exerciseDetails) {
    const muscles = [exercise.primaryMuscle, ...exercise.secondaryMuscles.map(cleanMuscleLabel)];
    for (const muscle of muscles) {
      const current = totals.get(muscle);
      if (current && exercise.lastTrained && (!current.lastTrained || exercise.lastTrained > current.lastTrained)) {
        current.lastTrained = exercise.lastTrained;
      }
    }
  }
  const maxExposure = Math.max(1, ...[...totals.values()].map((row) => row.totalExposure));
  return [...totals.values()]
    .map((row) => ({ ...row, heat: round(row.totalExposure / maxExposure) }))
    .sort((a, b) => b.totalExposure - a.totalExposure);
}

function emptyMuscleHeat(muscle: string) {
  return { muscle, primaryVolume: 0, secondaryVolume: 0, totalExposure: 0, sets: 0, exercises: 0, prs: 0, lastTrained: null as string | null };
}

function buildWeakPointFindings(input: {
  muscleStats: Array<{ muscle: string; volume: number; sets: number; exercises: number; prs: number }>;
  secondaryMuscleStats: Array<{ muscle: string; exposureVolume: number; sets: number; exercises: number; prs: number }>;
  movementStats: Array<{ movement: string; volume: number; sets: number; exercises: number }>;
  exerciseDetails: Array<{ name: string; sessions: number; volume: number; volumeTrend: number; strengthTrend: number; prs: number; sessionsSincePr: number | null; lastTrained: string | null }>;
  latestWorkoutDate: string | null;
}) {
  const findings: Array<{ severity: "high" | "medium" | "low"; title: string; detail: string; metric: string }> = [];
  const medianMuscleVolume = median(input.muscleStats.map((row) => row.volume));
  for (const row of input.muscleStats) {
    if (medianMuscleVolume > 0 && row.volume < medianMuscleVolume * 0.45) {
      findings.push({
        severity: "medium",
        title: `${row.muscle} is underrepresented`,
        detail: `${row.muscle} primary volume is less than half of the median trained muscle group.`,
        metric: `${compact(row.volume)} volume`
      });
    }
  }

  const pressVolume = sum(input.movementStats.filter((row) => /press|dip|fly/i.test(row.movement)).map((row) => row.volume));
  const pullVolume = sum(input.movementStats.filter((row) => /pull|row|pulldown/i.test(row.movement)).map((row) => row.volume));
  if (pressVolume > pullVolume * 1.35 && pullVolume > 0) {
    findings.push({ severity: "high", title: "Pressing is outpacing pulling", detail: "Press volume is more than 35% higher than pull/row volume.", metric: `${compact(pressVolume)} vs ${compact(pullVolume)}` });
  }
  if (pullVolume > pressVolume * 1.35 && pressVolume > 0) {
    findings.push({ severity: "medium", title: "Pulling is outpacing pressing", detail: "Pull/row volume is more than 35% higher than pressing volume.", metric: `${compact(pullVolume)} vs ${compact(pressVolume)}` });
  }

  const quadVolume = input.muscleStats.find((row) => row.muscle === "Quads")?.volume ?? 0;
  const posteriorVolume = sum(input.muscleStats.filter((row) => ["Hamstrings", "Glutes", "Erector spinae"].includes(row.muscle)).map((row) => row.volume));
  if (quadVolume > posteriorVolume * 1.5 && posteriorVolume > 0) {
    findings.push({ severity: "medium", title: "Quads dominate posterior chain", detail: "Quad volume is much higher than hamstring/glute/back-extension exposure.", metric: `${compact(quadVolume)} vs ${compact(posteriorVolume)}` });
  }
  if (posteriorVolume > quadVolume * 1.5 && quadVolume > 0) {
    findings.push({ severity: "medium", title: "Posterior chain dominates quads", detail: "Posterior-chain primary volume is much higher than quad volume.", metric: `${compact(posteriorVolume)} vs ${compact(quadVolume)}` });
  }

  for (const exercise of input.exerciseDetails.filter((row) => row.sessions >= 4).slice(0, 20)) {
    if ((exercise.sessionsSincePr ?? 0) >= 5 && exercise.strengthTrend <= 0) {
      findings.push({
        severity: "medium",
        title: `${exercise.name} may be plateauing`,
        detail: "No recent PR and the last six sessions do not show a positive estimated-strength trend.",
        metric: `${exercise.sessionsSincePr} sessions since PR`
      });
    }
    if (input.latestWorkoutDate && exercise.lastTrained && dateDiffDays(exercise.lastTrained.slice(0, 10), input.latestWorkoutDate) >= 28) {
      findings.push({
        severity: "low",
        title: `${exercise.name} has gone stale`,
        detail: "This exercise has not appeared in the most recent four-week span of imported training.",
        metric: `last ${exercise.lastTrained.slice(0, 10)}`
      });
    }
  }

  return findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]).slice(0, 24);
}

export function buildDailyMetrics(
  sessions: WorkoutSession[],
  sessionExercises: WorkoutSessionExercise[],
  setLogs: SetLog[],
  personalRecords: PersonalRecord[]
): DailyTrainingMetric[] {
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const setsBySessionExerciseId = groupBy(setLogs, (set) => set.workoutSessionExerciseId);
  const dayMap = new Map<string, DailyTrainingMetric & { exerciseIds: Set<string>; rpeTotal: number; rpeCount: number }>();

  function ensure(date: string) {
    const existing = dayMap.get(date);
    if (existing) return existing;
    const row = {
      date,
      label: shortDayLabel(date),
      sessions: 0,
      exercises: 0,
      sets: 0,
      reps: 0,
      volume: 0,
      prs: 0,
      maxWeight: 0,
      bestOneRm: 0,
      avgRpe: null as number | null,
      active: false,
      exerciseIds: new Set<string>(),
      rpeTotal: 0,
      rpeCount: 0
    };
    dayMap.set(date, row);
    return row;
  }

  for (const session of sessions) {
    const day = dayKey(session.startedAt);
    const row = ensure(day);
    row.sessions += 1;
    row.active = true;
  }

  for (const sessionExercise of sessionExercises) {
    const session = sessionById.get(sessionExercise.workoutSessionId);
    if (!session) continue;
    const row = ensure(dayKey(session.startedAt));
    row.exerciseIds.add(sessionExercise.exerciseId);
    const sets = setsBySessionExerciseId.get(sessionExercise.id) ?? [];
    row.sets += sets.length;
    row.reps += sum(sets.map((set) => set.reps));
    row.volume = round(row.volume + exerciseSessionVolume(sets));
    row.maxWeight = Math.max(row.maxWeight, max(sets.map((set) => set.weight)));
    row.bestOneRm = Math.max(row.bestOneRm, max(sets.map((set) => estimatedOneRepMax(set.weight, set.reps))));
    for (const set of sets) {
      if (typeof set.rpe === "number") {
        row.rpeTotal += set.rpe;
        row.rpeCount += 1;
      }
    }
  }

  for (const record of personalRecords) {
    ensure(dayKey(record.achievedAt)).prs += 1;
  }

  const dates = [...dayMap.keys()].sort();
  if (!dates.length) return [];
  const result: DailyTrainingMetric[] = [];
  for (const date of eachDay(dates[0], dates.at(-1) ?? dates[0])) {
    const row = ensure(date);
    row.exercises = row.exerciseIds.size;
    row.avgRpe = row.rpeCount ? round(row.rpeTotal / row.rpeCount) : null;
    result.push({
      date: row.date,
      label: row.label,
      sessions: row.sessions,
      exercises: row.exercises,
      sets: row.sets,
      reps: row.reps,
      volume: row.volume,
      prs: row.prs,
      maxWeight: row.maxWeight,
      bestOneRm: round(row.bestOneRm),
      avgRpe: row.avgRpe,
      active: row.active
    });
  }
  return result;
}

export function buildSessionSetGroups(sessions: WorkoutSession[], sessionExercises: WorkoutSessionExercise[], setLogs: SetLog[]) {
  const setsBySessionExerciseId = groupBy(setLogs, (set) => set.workoutSessionExerciseId);
  const rowsBySessionId = groupBy(sessionExercises, (row) => row.workoutSessionId);
  const groups: Record<string, SetLog[][]> = {};
  for (const session of sessions) {
    groups[session.id] = (rowsBySessionId.get(session.id) ?? []).map((row) => setsBySessionExerciseId.get(row.id) ?? []);
  }
  return groups;
}

function aggregateDaily(daily: DailyTrainingMetric[], mode: "week" | "month") {
  const totals = new Map<string, { period: string; workouts: number; activeDays: number; sets: number; reps: number; volume: number; prs: number }>();
  for (const day of daily) {
    const period = mode === "week" ? weekKey(day.date) : day.date.slice(0, 7);
    const row = totals.get(period) ?? { period, workouts: 0, activeDays: 0, sets: 0, reps: 0, volume: 0, prs: 0 };
    row.workouts += day.sessions;
    row.activeDays += day.active ? 1 : 0;
    row.sets += day.sets;
    row.reps += day.reps;
    row.volume = round(row.volume + day.volume);
    row.prs += day.prs;
    totals.set(period, row);
  }
  return [...totals.values()].sort((a, b) => a.period.localeCompare(b.period));
}

function buildDayOfWeekStats(sessions: Array<{ startedAt: string; volume: number; sets: number }>) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return labels.map((day, index) => {
    const rows = sessions.filter((session) => new Date(session.startedAt).getUTCDay() === index);
    return {
      day,
      workouts: rows.length,
      volume: round(sum(rows.map((row) => row.volume))),
      sets: sum(rows.map((row) => row.sets)),
      avgVolume: rows.length ? round(sum(rows.map((row) => row.volume)) / rows.length) : 0
    };
  });
}

function buildHourStats(sessions: WorkoutSession[]) {
  return Array.from({ length: 24 }, (_value, hour) => ({
    hour: String(hour).padStart(2, "0"),
    workouts: sessions.filter((session) => new Date(session.startedAt).getUTCHours() === hour).length
  }));
}

function buildRpeDistribution(sets: SetLog[]) {
  return Array.from({ length: 10 }, (_value, index) => {
    const rpe = index + 1;
    return {
      rpe: String(rpe),
      sets: sets.filter((set) => Math.round(set.rpe ?? -1) === rpe).length
    };
  });
}

function buildWeightBuckets(sets: SetLog[]) {
  const buckets = ["0", "1-49", "50-99", "100-149", "150-199", "200-249", "250+"];
  return buckets.map((bucket) => ({ bucket, sets: sets.filter((set) => weightBucket(set.weight) === bucket).length }));
}

function buildRepBuckets(sets: SetLog[]) {
  const buckets = ["1-3", "4-6", "7-10", "11-15", "16+"];
  return buckets.map((bucket) => ({ bucket, sets: sets.filter((set) => repBucket(set.reps) === bucket).length }));
}

function buildTrainingGaps(days: string[]) {
  const sorted = [...days].sort();
  const gaps: number[] = [];
  for (let index = 1; index < sorted.length; index += 1) {
    const diff = dateDiffDays(sorted[index - 1], sorted[index]) - 1;
    if (diff > 0) gaps.push(diff);
  }
  return {
    longestGapDays: gaps.length ? Math.max(...gaps) : 0,
    avgGapDays: gaps.length ? round(sum(gaps) / gaps.length) : 0
  };
}

function sessionsSinceLatestPr(
  sessions: Array<{ date: string; sessionId: string }>,
  records: Array<{ workoutSessionId: string; achievedAt: string }>
) {
  if (!sessions.length || !records.length) return null;
  const latestRecord = [...records].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt))[0];
  const index = sessions.findIndex((session) => session.sessionId === latestRecord.workoutSessionId);
  return index >= 0 ? sessions.length - index - 1 : null;
}

function slope(values: number[]) {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  return round(last - first);
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return [...groupBy(items, getKey).entries()]
    .map(([name, rows]) => ({ name, count: rows.length }))
    .sort((a, b) => b.count - a.count);
}

function aggregateBy<T>(items: T[], getKey: (item: T) => string, getValue: (item: T) => number) {
  const map = new Map<string, number>();
  for (const item of items) map.set(getKey(item), (map.get(getKey(item)) ?? 0) + getValue(item));
  return [...map.entries()].map(([period, count]) => ({ period, count })).sort((a, b) => a.period.localeCompare(b.period));
}

function average(values: number[]) {
  return values.length ? round(sum(values) / values.length) : null;
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return map;
}

function eachDay(start: string, end: string) {
  const days: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const finish = new Date(`${end}T00:00:00.000Z`);
  while (cursor <= finish) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function dayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function monthKey(value: string) {
  return dayKey(value).slice(0, 7);
}

function weekKey(day: string) {
  const date = new Date(`${day}T00:00:00.000Z`);
  const diff = date.getUTCDay() === 0 ? -6 : 1 - date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

function shortDayLabel(day: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${day}T00:00:00.000Z`));
}

function daysSinceLast(day?: string) {
  if (!day) return null;
  return Math.max(0, dateDiffDays(day, new Date().toISOString().slice(0, 10)));
}

function dateDiffDays(a: string, b: string) {
  return Math.round((new Date(`${b}T00:00:00.000Z`).getTime() - new Date(`${a}T00:00:00.000Z`).getTime()) / 86_400_000);
}

function duplicateCount(values: string[]) {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const value of values) {
    if (seen.has(value)) duplicates += 1;
    seen.add(value);
  }
  return duplicates;
}

function weightBucket(weight: number) {
  if (weight === 0) return "0";
  if (weight < 50) return "1-49";
  if (weight < 100) return "50-99";
  if (weight < 150) return "100-149";
  if (weight < 200) return "150-199";
  if (weight < 250) return "200-249";
  return "250+";
}

function repBucket(reps: number) {
  if (reps <= 3) return "1-3";
  if (reps <= 6) return "4-6";
  if (reps <= 10) return "7-10";
  if (reps <= 15) return "11-15";
  return "16+";
}

function cleanMuscleLabel(value: string) {
  return value.split(" - ")[0].trim();
}

function safeSecondaryMuscles(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function median(values: number[]) {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : round((sorted[mid - 1] + sorted[mid]) / 2);
}

function compact(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function max(values: number[]) {
  return values.length ? Math.max(...values) : 0;
}

function maxString(values: string[]) {
  return values.length ? [...values].sort().at(-1) ?? null : null;
}

function sum(values: number[]) {
  return round(values.reduce((total, value) => total + value, 0));
}

const severityRank = {
  high: 0,
  medium: 1,
  low: 2
} as const;
