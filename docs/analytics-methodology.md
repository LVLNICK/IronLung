# Analytics Methodology

IronLung analytics are deterministic and rule-based. No paid API or LLM is connected.

## Volume

- Set volume = weight * reps.
- Exercise/session volume = sum of completed set volume for that exercise in a session.
- Workout/session volume = sum of all completed set volume in the workout.
- Daily and weekly volume group completed set volume by workout date.

## Strength

- Estimated 1RM uses Epley: weight * (1 + reps / 30).
- Max weight trend tracks the heaviest completed set per exercise/session.
- Best set ranks the highest single-set volume for an exercise.

## Balance

Muscle balance uses normalized volume ratios:

- Push/pull balance compares pressing muscles against pulling/back muscles.
- Upper/lower balance compares upper-body muscles against lower-body muscles.
- Chest/back balance compares chest volume against back volume.
- Quad/hamstring balance compares quad volume against hamstring volume.

Each ratio is converted to a 0-100 score where closer volume parity is higher. The overall muscle balance score averages the available ratio scores.

## Fatigue and Recovery

Fatigue flags are workload signals, not medical advice. They use:

- same muscle trained repeatedly in a recent window
- high recent hard-set count
- RPE 9+, failure, and AMRAP sets
- recent volume spikes compared with the previous period

## Insights

Smart insights detect neglected muscles, volume changes, imbalances, plateauing exercises, PR patterns, and consistency gaps. Recommendations are optional suggestions only; IronLung does not ship premade workout plans.

## Limitations

Analytics quality depends on consistent logging, correct exercise muscle mapping, and complete imported history. Photo metrics are experimental and should not be interpreted as body-fat, medical, attractiveness, or user-ranking scores.
