# Production Polish Audit

Baseline verification before changes:

- `npm run test`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with the existing Vite chunk-size warning.

## Command Center

- Works: six-page navigation is stable, recent PRs are filtered toward meaningful records, current block and photo snapshot are visible.
- Weak: insights depend on the analytics engine and can still look generic when data is sparse.
- Missing: richer empty states for brand-new users and clearer calculation help for balance/fatigue cards.
- Buggy: no critical rendering failure found.
- Fix first: make PR and analytics engines stricter so Command Center stops amplifying noisy records.

## Train Page

- Works: start workout, active logging, rest timer, duplicate last set, same-as-last, journal delete confirmation, templates.
- Weak: set entry accepts invalid numbers, unit step buttons are fixed at 5 even for kg, and multiple active workouts can be created.
- Missing: reliable past workout editing and safe set deletion/recalculation.
- Buggy: deleting workouts removes local PR rows for that workout, but does not recalculate later PR history.
- Fix first: harden active workout state, validate set inputs, add unit-aware increments, add set delete/reopen flow, and recalculate PRs after destructive edits.

## Exercises Page

- Works: searchable/filterable library, exercise drilldown, charts, PR list, never-trained state, metadata warnings.
- Weak: contribution model is not visible enough to explain where muscle volume comes from.
- Missing: merge/deduplicate flow and contribution editing UI.
- Buggy: no critical rendering failure found.
- Fix first: expose contribution source/warnings in the exercise detail.

## Analytics Page

- Works: overview, strength, volume, muscle balance, PRs, consistency, intensity/recovery, insights, body heat map.
- Weak: some analytics count every PR event instead of meaningful PRs, and all-time comparison intentionally has no previous period.
- Missing: block filter, clearer "how calculated" copy, and empty states inside charts.
- Buggy: session-volume PRs can overcount if the same exercise breaks volume multiple times inside one session.
- Fix first: dedupe same-session PR records and clarify analytics limitations.

## Photos Page

- Works: Progress Photo Index language, safety copy, upload/camera, same-pose comparison, timeline, opt-in analysis.
- Weak: delete-all is immediate from Photos even though Data & Settings has confirmation.
- Missing: robust broken-file detection and per-photo delete confirmation.
- Buggy: no unsafe body-fat/attractiveness language found.
- Fix first: add confirmation to destructive photo actions in a future pass.

## Data & Settings

- Works: preferences, training goals, blocks, Boostcamp import, local Boostcamp refresh, JSON import/export, privacy copy, destructive reset confirmations.
- Weak: Boostcamp helper is personal-path oriented and desktop-only; browser dev mode correctly falls back to upload.
- Missing: separate one-click exports for individual entities.
- Buggy: import summary can count intermediate PR events if PR dedupe is not enforced.
- Fix first: recalculate PRs after import and keep Boostcamp export files ignored.

## Analytics Engine

- Works: date ranges, period comparison, distributed muscle volume, fatigue flags, weak points, goal-based insights, block metrics.
- Weak: comparison for all-time returns zeros by design; sparse datasets can generate shallow recommendations.
- Missing: explicit meaningful-PR totals and block-vs-previous-block helpers.
- Buggy: PR grouping reflects stored records, so noisy stored records affect analytics.
- Fix first: fix PR storage correctness at the store/core boundary.

## PR System

- Works: max weight, estimated 1RM, session volume, reps-at-weight, best set, baseline/small/medium/major classification.
- Weak: first-ever sets are baseline, but multiple records from one exercise session can still appear as separate session PRs.
- Missing: full historical recalculation utility exposed from core.
- Buggy: deleted workouts or imported older history can leave later PR history stale.
- Fix first: add store-level chronological PR recalculation and same-session dedupe.

## Muscle Contribution System

- Works: presets, fallback logic, normalization, distributed volume tests.
- Weak: warnings are not exposed to the UI and custom contribution totals are silently normalized.
- Missing: contribution validation warnings and more preset coverage tests.
- Buggy: no volume-duplication issue remains in current analytics.
- Fix first: add validation warnings and tests for bench, row, squat, deadlift, curl, pulldown, and fallback.

## Training Goals

- Works: settings support all target goals and analytics generates different recommendation copy.
- Weak: some recommendations still fall back to generic phrasing.
- Missing: tests for each goal's insight branch.
- Buggy: no medical/body-fat claims found.
- Fix first: expand deterministic goal tests and keep copy specific.

## Training Blocks

- Works: create, set active, end/reopen, delete with confirmation, block metrics, active block summary.
- Weak: no workout assignment UI outside automatic active-block assignment.
- Missing: block filter and block-vs-previous-block analytics.
- Buggy: sessions with deleted block IDs are unassigned safely.
- Fix first: add lightweight block filter in Analytics in a future pass.

## Import/Export

- Works: Boostcamp CSV/JSON parsing, local refresh, dry-run preview, exercise mapping, duplicate hashes, JSON import/export.
- Weak: invalid files surface plain errors, not structured row-level help.
- Missing: entity-specific exports and full round-trip test for all new settings/blocks.
- Buggy: PR summary accuracy depends on deduped/recalculated PR storage.
- Fix first: add round-trip coverage and recalculate PRs after import.

## Local Storage/Persistence

- Works: Zustand persistence keeps app data local in browser/Tauri storage; no account or cloud sync.
- Weak: storage is still browser-storage backed in the MVP rather than native SQLite for runtime.
- Missing: migration/versioning path for persisted state shape changes.
- Buggy: stale PRs can persist until recalculated.
- Fix first: recalculate derived PRs after mutations that affect workout history.

## Tests

- Works: core calculation/import/analytics tests, desktop smoke tests, db test.
- Weak: Train UI workflows and destructive edit flows are lightly tested.
- Missing: PR edge cases, contribution presets, goal-specific insights, JSON round-trip, set deletion/recalculation.
- Buggy: no current failures.
- Fix first: add tests around PR dedupe/recalculation and contribution validation.

## UI/UX Polish

- Works: premium dark visual system, cards, tables, charts, command palette, empty states.
- Weak: some destructive actions lack confirmation and chart empty states are inconsistent.
- Missing: toasts, richer keyboard focus styling, sticky workout summary/sidebar.
- Buggy: set input invalid values can create bad local data.
- Fix first: prevent bad set entry and improve active workout controls.

## Completed In This Pass

- Prevented accidental multiple active workouts by routing new start actions to the existing open workout.
- Added numeric validation for set logging so invalid weight/reps/RPE values do not enter local storage.
- Made `+/-` set-entry controls unit-aware: 5 lb or 2.5 kg.
- Added individual set deletion and chronological PR recalculation after set/workout deletion and JSON/import workflows.
- Deduped same exercise/session/type PR records so session-volume and best-set PRs do not spam one workout.
- Changed top-line analytics PR totals to meaningful PRs while preserving baseline/small PRs in full history.
- Added muscle contribution validation warnings and surfaced contribution breakdowns in exercise detail.
- Added tests for PR dedupe/recalculation, JSON import/export round-trip, and common muscle contribution presets.
- Added confirmations for destructive photo deletes on the Photos page.
