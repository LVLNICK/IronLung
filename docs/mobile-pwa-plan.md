# IronLog Analyzer PWA Plan

## Product Direction

The mobile PWA is `IronLog Analyzer`: an offline phone-local training analytics companion for IronLog Desktop.

It is analyzer-first, not a workout logger yet. Desktop remains the main place to create exercises, build templates, log workouts, import Boostcamp, and manage full data.

## Current Repo Audit

- Desktop app lives in `apps/desktop` and uses React, Vite, Tauri, Tailwind, Zustand persistence, and shared `@ironlog/core`.
- Shared types and fitness logic live in `packages/core`: workouts, sets, PRs, training blocks, calculations, analytics, and muscle contribution logic.
- Desktop Data & Settings exports a mobile analytics seed bundle through `apps/desktop/src/features/mobile-sync`.
- Mobile local cache lives in `apps/mobile-pwa/src/data` and stores imported desktop records on the phone.
- Mobile analyzer logic lives in `apps/mobile-pwa/src/features/analytics/mobileAnalytics.ts`.

## Visible Mobile Navigation

- Home
- Strength
- Volume
- Muscles
- Sync

Workout logging screens are not exposed in the analyzer MVP.

## Acceptance Path

- `npm run mobile:dev` starts the mobile PWA.
- `npm run mobile:build` builds the installable/offline app.
- Desktop exports `.ironlog-mobile-seed.json`.
- Mobile imports that seed idempotently.
- Mobile shows read-only analytics offline.
- No account, cloud sync, server, or upload is added.
