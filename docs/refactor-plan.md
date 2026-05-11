# IronLog 10/10 Refactor Plan

## Current Audit

- Desktop UI entrypoint: `apps/desktop/src/App.tsx`, which now re-exports `apps/desktop/src/app/App.tsx`.
- Navigation is defined in `apps/desktop/src/app/navigation.tsx`.
- App state and local-first persistence are in `apps/desktop/src/lib/store.ts` using Zustand persist.
- Workout creation, active workout logging, templates, photo UI, Boostcamp import UI, and settings have been moved into page modules under `apps/desktop/src/pages`.
- PR detection is implemented in `packages/core/src/pr.ts`.
- Fitness math is implemented in `packages/core/src/calculations.ts`.
- Exercise target inference is implemented in `packages/core/src/exercise-targets.ts`.
- Boostcamp CSV/JSON importers are in `packages/core/src/importers`.
- JSON import/export helpers are in `apps/desktop/src/lib/importExport.ts`.
- Photo/body progress scoring is stubbed locally in `apps/desktop/src/lib/photoAnalysis.ts`.
- Desktop analytics aggregation currently exists in `apps/desktop/src/lib/analytics.ts`.
- SQLite schema lives in `packages/db`, though the current desktop MVP still primarily uses local persisted state.

## Refactor Strategy

1. Preserve all existing behavior while replacing the navigation with six main destinations:
   - Command Center
   - Train
   - Exercises
   - Analytics
   - Photos
   - Data & Settings
2. Move the app shell and navigation out of the monolithic `App.tsx`.
3. Create page modules for each destination.
4. Keep Boostcamp import, JSON import/export, photo analysis, PR logic, and workout logging functional.
5. Promote reusable analytics logic into `packages/core/src/analytics` so future mobile can reuse it.
6. Keep desktop-only view aggregation in `apps/desktop/src/features/analytics` where it depends on UI-specific shapes.
7. Add deterministic rule-based insights, muscle balance, fatigue flags, plateau detection, and period comparison.
8. Keep the implementation local-first and privacy-first. No cloud sync, no accounts, no medical/body-fat/attractiveness claims.
9. Final polish adds weighted muscle contributions, PR importance, training goals, and training blocks without changing the six-page navigation.

## Safe Step Order

1. Add the shared analytics engine and tests.
2. Add shared desktop UI primitives.
3. Add the new app shell and six-page navigation.
4. Move import/export and settings into Data & Settings.
5. Move workout logger and journal into Train.
6. Move exercise library and drilldowns into Exercises.
7. Merge charts and insights into Analytics.
8. Upgrade Command Center into the primary action/insight screen.
9. Preserve photo safety text and local-only photo workflows.
10. Run `npm run typecheck`, `npm run test`, and `npm run build`.

## Non-Goals For This Refactor

- No premade workout plans.
- No cloud sync.
- No paid API or LLM integration.
- No medical diagnosis.
- No exact body-fat estimate.
- No attractiveness or body-shaming score.
