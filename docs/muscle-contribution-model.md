# Muscle Contribution Model

IronLung uses weighted muscle contributions so analytics do not duplicate full set volume across every listed muscle.

## Formula

For each completed set:

`distributed muscle volume = set weight * reps * muscle contribution percent`

Exercise/session volume remains the full set volume. Muscle analytics use the distributed version.

## Example

Barbell bench press:

- Pectoralis major: 55%
- Anterior deltoids: 20%
- Triceps brachii: 20%
- Serratus anterior: 5%

A 1,000 lb-volume bench session contributes 550 to pectoralis major, 200 to anterior deltoids, 200 to triceps, and 50 to serratus anterior.

## Fallback

If no preset or explicit exercise `muscleContributions` exists:

- primary muscle receives 65%
- all secondary muscles share 35%
- if no secondary muscles exist, primary receives 100%

This keeps old imported data compatible.

## Uses

- muscle volume analytics
- weak point detection
- muscle balance score
- fatigue flags
- recommendations
- body heat map intensity
