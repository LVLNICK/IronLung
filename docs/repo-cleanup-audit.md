# Repo Cleanup Audit

## Current Repo Structure

- `apps/desktop`: React/Tauri desktop command center. Owns desktop UI, Zustand local store, Boostcamp import UI, JSON import/export, progress photos, analytics pages, and desktop mobile import/export UI.
- `apps/mobile-pwa`: React/Vite installable PWA. Current product direction is `IronLung Analyzer`, a read-only phone-local analytics viewer that imports desktop seed bundles.
- `packages/core`: shared TypeScript types, Zod schemas, fitness calculations, PR logic, analytics engine, muscle contribution model, body analysis interface, and Boostcamp importers.
- `packages/db`: SQLite schema and `sql.js` repository adapter.
- `packages/ml`: future Python ML scaffold for progress-photo analysis.
- `docs`: product, architecture, privacy, analytics, import, mobile, and audit notes.
- Root config: npm workspaces, TypeScript base config, `.gitignore`, package lock.

## Package/App Responsibilities

- Desktop remains the full local-first app: exercise/template/workout management, imports, photos, analytics, settings, and exports.
- Mobile PWA is analyzer-first: imports desktop analytics seed, caches it locally, and displays Home, Strength, Volume, Muscles, and Sync.
- Core should own pure fitness logic and validation. UI packages should avoid duplicating formulas where practical.
- DB owns schema/repository concerns only.
- ML remains scaffold-only and should not affect runtime app behavior.

## Dead Code Candidates

- `apps/mobile-pwa/src/data/mobileRepository.ts` contained future workout logger write APIs: `createExercise`, `startWorkout`, `addExerciseToSession`, `logSet`, `finishWorkout`, `softDeleteSession`, and `logOperation`. These were unused by the analyzer UI and were removed in this pass.
- `MobileInput` and `MobileTextArea` were no longer used after analyzer-first mobile navigation and were removed.
- `MOBILE_LOGGER_ENABLED` in mobile `App.tsx` was a dead feature flag and was removed.
- `parseMobileSeedBundle` in desktop `mobileBundleImporter.ts` was unused and was removed.

## Duplicate Code Candidates

- Mobile analytics previously duplicated formulas in `App.tsx`; this has been moved to `apps/mobile-pwa/src/features/analytics/mobileAnalytics.ts`, which calls `@ironlung/core` analytics.
- Desktop and mobile both have local import/export type definitions. Longer term, mobile seed/export schemas should move to `packages/core`.
- Formatting helpers exist in both desktop and mobile. This is acceptable for now because the UI contexts are separate, but common pure formatters could move to core later.

## Overly Large Files

- `apps/desktop/src/lib/analytics.ts` (~650 lines): desktop-only aggregation and chart helpers. Candidate for splitting by domain.
- `apps/desktop/src/lib/store.ts` (~650 lines): persistence plus all write actions. Candidate for action modules/repository adapter split.
- `packages/core/src/analytics/index.ts` (~560 lines): pure analytics engine. Candidate for splitting by date ranges, summaries, balance, insights, and blocks.
- `apps/desktop/src/pages/DataSettingsPage.tsx` (~540 lines): import/export/settings/training blocks/mobile sync in one page. Candidate for feature panels.
- `apps/mobile-pwa/src/App.tsx` (~390 lines before cleanup): should remain mostly composition; page components can move under `apps/mobile-pwa/src/pages`.

## Unused Components / Exports

- Mobile logger write APIs are unused by the current product.
- Mobile input/text area primitives are unused by the current product.
- Desktop `parseMobileSeedBundle` is unused.
- Existing desktop components appear actively used by pages after recent refactors.

## Unused Dependencies

- `apps/mobile-pwa` has `@vitejs/plugin-react` and `vite` in dependencies rather than devDependencies. This is suboptimal but not harmful; moving them would churn lockfile without runtime benefit.
- `apps/mobile-pwa` includes `jsdom` because tests run with Vitest defaults/future DOM tests; currently not strictly needed by existing mobile tests.
- Desktop dependencies are used: Recharts, Zustand, Lucide, Tauri API, clsx.
- Core uses Zod. DB uses `sql.js`.

## Missing Tests

- Mobile seed malformed file handling needs more coverage.
- Desktop mobile malformed bundle parsing should be covered.
- No-premade-program regression is covered indirectly by UI tests but could be a direct data scan test.
- Mobile service worker behavior is not unit-tested; browser smoke testing is currently manual/CLI-driven.

## Broken or Misleading Docs

- Mobile docs recently described the PWA as a logger. They have been updated to analyzer-first.
- `mobile-roadmap.md` still discusses future mobile app reuse broadly and is acceptable as roadmap context.
- Older audit docs are historical and should not be treated as current product spec.

## Performance Problems

- Desktop page components repeatedly scan arrays in render; the largest risks are Analytics, Command Center, Exercises, and Data Settings.
- Desktop store PR recalculation is intentionally full replay after import/delete; acceptable for current data sizes but should be indexed before large datasets.
- Mobile analytics now builds maps and delegates formulas to core; it should remain memoized per page state.
- Desktop mobile merge has nested lookup in set signature generation. It is acceptable for small bundles but should be indexed for large imports.

## Type-Safety Problems

- Desktop/mobile bundle parsing uses manual shape checks. Zod schemas for mobile seed/export bundles should move into `packages/core`.
- Desktop `validateImportPayload` casts parsed payload to `IronLungStateData` after schema parse; acceptable short term, but the schema should align exactly with state type.
- Some imported mobile metadata is structural and optional; validation should reject malformed IDs/dates/sets before writes.

## Mobile/Desktop Duplicated Logic

- Mobile seed/export interfaces mirror desktop mobile-sync types. Shared sync schemas belong in core in a future pass.
- Mobile and desktop both format metrics locally.
- Both desktop and mobile compute analytics summaries, but mobile now reuses core `buildTrainingAnalytics`.

## Cleanup Plan By Priority

1. Remove unused mobile logger write code, dead feature flag, and unused mobile form primitives.
2. Add a focused future roadmap note for mobile logging instead of carrying unused runtime code.
3. Harden mobile seed import tests and keep idempotent import behavior.
4. Update docs to remove logger-first wording and clarify Analyzer import/offline behavior.
5. Keep desktop large-file splitting as future work unless a targeted edit is needed.
6. Move mobile seed/export schemas to `packages/core` in a later schema-hardening pass.
7. Add malformed mobile bundle tests once shared schemas exist.

## Cleanup Results

- Removed unused mobile logger write APIs from `apps/mobile-pwa/src/data/mobileRepository.ts`.
- Removed unused mobile form primitives from `MobilePrimitives.tsx`.
- Removed the dead `MOBILE_LOGGER_ENABLED` flag and visible logger status copy.
- Removed unused desktop `parseMobileSeedBundle`.
- Added `apps/mobile-pwa/src/features/analytics/mobileAnalytics.ts` so mobile analytics logic is no longer embedded directly in `App.tsx`.
- Split the mobile analyzer UI into `apps/mobile-pwa/src/pages` so `App.tsx` now owns shell state, filters, loading, and page composition only.
- Added mobile seed import and analytics tests covering duplicate imports, duplicate exercise names, analyzer cache clear, date filtering, muscle volume ranking, and baseline PR filtering.
- Updated mobile docs to match the analyzer-first product direction.
- Verified `npm install`, `npm run test`, `npm run typecheck`, `npm run build`, and `npm run mobile:build`.
- Smoke-tested the mobile analyzer in Chromium at a phone viewport. The Home screen rendered without a black screen and showed the analyzer-first navigation.

## Future Work

- Split `DataSettingsPage.tsx` into panels.
- Split desktop store actions by domain.
- Move mobile sync schemas to core with Zod validation.
- Add indexed desktop mobile merge for very large bundles.
- Consider desktop code-splitting for the current Vite main-bundle size warning.
