# IronLung Desktop

IronLung Desktop is a local-first, desktop-priority fitness tracker for users who build their own workouts. It includes custom exercises, workout templates, set logging, PR detection, muscle-contribution analytics, training goals, training blocks, progress photos, JSON import/export, and a privacy-first local approximate Progress Photo Index.

No premade workout programs are included.

## Stack

- Tauri shell with React, TypeScript, and Vite
- Tailwind CSS with custom shadcn-inspired components
- Recharts for analytics
- Shared TypeScript packages for fitness math, validation, and PR detection
- SQLite schema and migrations in `packages/db`; the MVP runs through a local SQLite-compatible `sql.js` adapter serialized to browser storage for fast desktop development
- Python ML scaffold in `packages/ml`
- Vitest and React Testing Library

## Navigation

IronLung now uses six desktop-first destinations:

- Command Center: training status, weak points, fatigue flags, recent PRs, and next actions
- Train: start workouts, active logging, journal, and user-created templates
- Exercises: exercise library, drilldowns, charts, PRs, and plateau signals
- Analytics: strength, volume, muscle balance, PRs, consistency, intensity, recovery, and insights
- Photos: local progress photos, same-pose comparisons, quality checks, and opt-in analysis
- Data & Settings: preferences, training goal, training blocks, Boostcamp import, JSON import/export, privacy, and backups

## Boostcamp Import

IronLung can import user-provided Boostcamp-style CSV or JSON files from `Data & Settings -> Boostcamp Import`. In the Tauri desktop app, it can also refresh through a local authenticated `D:\boostcamp-mcp` helper and feed that JSON into the same dry-run importer. The importer runs locally, supports exercise mapping, and skips duplicate sets using stable import hashes. It does not store your Boostcamp password or upload imported data. See `docs/importing-boostcamp.md`.

## Setup

```powershell
npm install
npm run dev
```

Open the Vite URL shown in the terminal. For the native desktop shell:

```powershell
npm run desktop
```

## Mobile/PWA Analyzer

IronLung also includes `IronLung Analyzer`, a phone-local installable PWA in `apps/mobile-pwa`. It is an offline phone-local training analytics companion for IronLung Desktop, not a workout logger yet and not a cloud sync app.

```powershell
npm run mobile:dev
npm run mobile:build
npm run mobile:build:pages
npm run mobile:preview
```

Public hosted app shell:

- GitHub Pages URL after deployment: `https://lvlnick.github.io/IronLung/`
- The hosted site contains only the IronLung Analyzer app code. Your workout data is not uploaded.
- Install/open the PWA once on your phone, then import a desktop seed bundle in the `Sync` tab. The imported analyzer cache stays in phone-local browser storage.

Phone workflow:

1. In Desktop `Data & Settings`, export a mobile analytics seed bundle.
2. Move the `.ironlung-mobile-seed.json` file to your phone and import it in the PWA `Sync` tab.
3. View Home, Strength, Volume, and Muscle analytics offline from the phone-local cache.
4. Optionally export an analyzer cache backup from the PWA.

Privacy: no account, no cloud sync, no server, no analytics tracking, and no uploads. Imported seeds and backup files are user-controlled and may contain sensitive training data. Phone testing from a local network may need HTTPS for full service-worker install behavior.

GitHub Pages deployment is handled by `.github/workflows/mobile-pwa-pages.yml`. In GitHub repository settings, Pages should use `GitHub Actions` as the source.

## Verification

```powershell
npm run test
npm run typecheck
npm run build
npm run mobile:build
```

## Production Polish Notes

The workout logger prevents accidental multiple active workouts, validates set input before writing local data, uses unit-aware `+/-` jumps, supports deleting individual sets, and recalculates PRs after imports/deletes. PR dashboards prioritize meaningful records while full history keeps baseline and small records available.

## Data

The MVP is local-first and does not require an account. Workout data is stored in a local SQLite-compatible database image in browser storage during Vite development, with the same schema and repository boundaries intended for Tauri-native SQLite later. Progress photos are represented as local file references or data URLs in the MVP and are exportable/deletable from Photos or Data & Settings.

## Repository Layout

```text
apps/desktop        React/Tauri desktop app
apps/mobile-pwa     Installable offline phone analyzer PWA
apps/desktop/src/app        App composition and command palette
apps/desktop/src/layout     Desktop shell and sidebar
apps/desktop/src/pages      Six primary product pages
apps/desktop/src/features   Feature-level desktop hooks and adapters
packages/core       Shared types, schemas, PR logic, and fitness math
packages/db         SQLite schema, migrations, local repository adapter
packages/ml         Python ML training/inference scaffold
docs                Product, architecture, privacy, ML, and mobile roadmap docs
```
