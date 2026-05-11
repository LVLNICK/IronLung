# Final Polish Audit

Baseline verification before changes:

- `npm run test`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with the existing Vite chunk-size warning.

## Already Implemented

- Six-page navigation is present and tested: Command Center, Train, Exercises, Analytics, Photos, Data & Settings.
- Boostcamp CSV/JSON import exists with local parsing, dry-run preview, mapping, duplicate hash detection, and summary.
- IronLog JSON import/export exists.
- Workout templates, active logging, exercise CRUD, PR detection, analytics charts, progress photos, and local photo analysis exist.
- Privacy safety copy exists on Photos and Command Center.
- Shared analytics engine exists in `packages/core/src/analytics`.

## Highest-Impact Gaps

1. Muscle volume is still too shallow. Current analytics mostly treat the primary muscle as 100% and secondaries as a coarse 35% multiplier, which overstates total volume and makes weak-point/fatigue recommendations less trustworthy.
2. PRs are not ranked by importance. First-ever sets can create multiple records, which makes dashboards feel inflated instead of meaningful.
3. User intent is missing. Strength, hypertrophy, cutting, powerbuilding, and other goals should change the way insights are prioritized.
4. Training blocks are missing. Users need simple blocks for phases like Lean Bulk 2026 or Bench Focus Block, and analytics should segment by block.
5. Photo metric wording was inconsistent. The product should consistently say Progress Photo Index, and keep quality/consistency separated.
6. Data & Settings destructive actions are too easy. Delete photos and reset data need confirmation.
7. Tables are readable but not interactive enough. Key analytics tables need sortable behavior.
8. Train page is useful but still has rough edges: static rest timer, no discard confirmation, and current workout PRs are shown only inline.

## Prioritized Implementation Plan

1. Add a reusable muscle contribution model in core and switch muscle analytics/fatigue/balance to distributed volume.
2. Add PR importance and baseline classification, then filter Command Center PRs to meaningful records.
3. Add training goals and training blocks to shared types, store, settings, analytics, docs, and tests.
4. Rename Photos metrics to Progress Photo Index and add clearer quality/consistency separation.
5. Add confirmation modals to Data & Settings destructive actions.
6. Add a sortable table primitive and use it where it improves scanability.
7. Update docs and tests, then run test/typecheck/build.

## Completed In This Pass

- Added distributed muscle contribution analytics with tested presets and safe fallback behavior for imported/custom exercises.
- Added PR importance and baseline classification so the dashboard can prioritize meaningful PRs.
- Added training goals and training blocks to settings, store, analytics, import/export schema, and docs.
- Renamed user-facing photo progress language to Progress Photo Index while preserving medical/body-fat/attractiveness safety copy.
- Added safer confirmations for destructive local data actions.
- Added sortable analytics tables and targeted Train page workflow polish.
