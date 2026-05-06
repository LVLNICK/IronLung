# IronLung Desktop Product Spec

IronLung Desktop is a premium, local-first desktop fitness tracker for self-directed lifters. Users create exercises, build their own workout templates, log sets quickly, track progress, and optionally analyze local progress photos.

## Non-goals

- No premade workout programs.
- No coaching marketplace.
- No account requirement for the MVP.
- No cloud photo upload.
- No medical diagnosis, attractiveness rating, or body-fat guarantee.

## Navigation

- Command Center: training status, weak points, PRs, fatigue flags, progress photo snapshot, and next actions.
- Train: start workout, active workout logger, training journal, and user-created templates.
- Exercises: searchable library, exercise detail charts, PRs, plateau detection, and exercise intelligence.
- Analytics: overview, strength, volume, muscle balance, PRs, consistency, intensity/recovery, and insights.
- Photos: local photo timeline, upload/capture, same-pose compare, photo quality signals, Progress Photo Index trend, and deletion.
- Data & Settings: preferences, training goal, training blocks, Boostcamp import, JSON import/export, privacy controls, and backup guidance.

## MVP Workflows

- Create and manage custom exercises.
- Create user-owned workout templates. No premade templates are shipped.
- Start a workout from a template or from scratch.
- Log weight, reps, RPE, set type, notes, and date.
- Detect PRs for max weight, estimated 1RM, session volume, reps at weight, and best set.
- Classify PRs as baseline, small, medium, or major so dashboards avoid PR spam.
- Use weighted muscle contributions for muscle volume, weak points, fatigue flags, and balance scores.
- Create training blocks and assign workouts to blocks.
- Select a training goal to adjust insights.
- Review command center summaries, recent workouts, weekly volume, fatigue flags, muscle balance, and PR history.
- Upload progress photos locally, tag age/height/weight/lighting/pump context, and run explicit-consent local Progress Photo Index analysis.
- Export and import local JSON data.
- Import user-provided Boostcamp CSV/JSON files locally with dry-run preview and duplicate detection.
