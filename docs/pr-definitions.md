# PR Definitions

IronLung stores PRs by explicit type. It should never show a vague inflated PR count without context.

## Types

- `max_weight`: heaviest completed set load for an exercise.
- `estimated_1rm`: highest Epley estimated 1RM for an exercise.
- `session_volume`: highest total exercise volume inside one workout session.
- `reps_at_weight`: most completed reps at the same weight.
- `best_set`: highest single-set volume, calculated as weight * reps.

Legacy imported/exported records named `exercise_session_volume` display as Session volume. Legacy records named `workout_session_volume` display as Best set.

## Display Rules

- Exercise pages show each PR type separately.
- Analytics groups PRs by type, exercise, muscle, and date.
- Command Center shows recent meaningful PRs only.
- PR values are calculated from local workout data and are not compared against other users.

## Importance

- `baseline`: first-ever records for an exercise. These establish history but are not major PRs.
- `small`: improvement below 2%.
- `medium`: improvement from 2% to below 5%.
- `major`: improvement of 5% or more.

Legacy records without importance are displayed as legacy and treated as meaningful until recalculated or superseded.
