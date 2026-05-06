# IronLung Mobile PWA Plan

## Current Repo Audit

- Desktop app lives in `apps/desktop` and uses React, Vite, Tauri, Tailwind, Zustand persistence, and shared `@ironlung/core`.
- Shared types and fitness logic live in `packages/core`: `Exercise`, `WorkoutSession`, `WorkoutSessionExercise`, `SetLog`, `PersonalRecord`, `TrainingBlock`, calculations, PR detection, analytics, muscle contributions, importers, and schemas.
- Desktop import/export currently lives in `apps/desktop/src/lib/importExport.ts` and exports the desktop state shape as local JSON.
- Desktop local persistence lives in `apps/desktop/src/lib/store.ts` using Zustand `persist`.
- Desktop workout logging lives in `apps/desktop/src/pages/TrainPage.tsx` and store methods in `store.ts`.
- Desktop settings/import/export UI lives in `apps/desktop/src/pages/DataSettingsPage.tsx`.

## Implementation Approach

1. Add `apps/mobile-pwa` as a separate npm workspace app so desktop remains untouched.
2. Use React, TypeScript, Vite, Tailwind, a normal web manifest, and a small service worker for offline shell caching.
3. Use browser IndexedDB directly through `mobileDb.ts` and repository helpers. No backend, no account, no cloud.
4. Reuse `@ironlung/core` types, set volume, estimated 1RM, and PR detection semantics where practical.
5. Implement a mobile-first five-tab UI: Today, Log, Exercises, History, Sync.
6. Use file-based sync:
   - Desktop exports `.ironlung-mobile-seed.json`.
   - Mobile imports seed without deleting phone logs.
   - Mobile exports `.ironlung-mobile.json`.
   - Desktop imports and merges the mobile bundle with duplicate/conflict checks.
7. Keep sync metadata local and merge-safe: device ids, updated timestamps, soft delete fields, sync version, and import source.

## Risk Controls

- No cloud sync, no login, no analytics tracking, and no server.
- Export files are user controlled and explicitly documented as sensitive.
- Desktop merge is dry-run first and does not blindly overwrite desktop records.
- Mobile app is intentionally simpler than desktop: fast logging and export/import are the priority.

## Acceptance Path

- `npm run mobile:dev` starts the mobile PWA.
- `npm run mobile:build` builds the installable/offline app.
- Mobile can create exercises, start a workout, log sets, finish it, export a bundle, and import a desktop seed.
- Desktop Data & Settings includes Mobile/PWA Sync import/export.
- Existing desktop tests, typecheck, and build continue to pass.
