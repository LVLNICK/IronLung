# IronLung Desktop

IronLung Desktop is a local-first, desktop-priority fitness tracker for users who build their own workouts. It includes custom exercises, workout templates, set logging, PR detection, analytics charts, progress photos, JSON import/export, and a privacy-first local approximate body progress analyzer.

No premade workout programs are included.

## Stack

- Tauri shell with React, TypeScript, and Vite
- Tailwind CSS with custom shadcn-inspired components
- Recharts for analytics
- Shared TypeScript packages for fitness math, validation, and PR detection
- SQLite schema and migrations in `packages/db`; the MVP runs through a local SQLite-compatible `sql.js` adapter serialized to browser storage for fast desktop development
- Python ML scaffold in `packages/ml`
- Vitest and React Testing Library

## Boostcamp Import

IronLung can import user-provided Boostcamp-style CSV or JSON files from `Settings -> Import Data -> Boostcamp Import`. The importer runs locally, starts with a dry-run preview, supports exercise mapping, and skips duplicate sets using stable import hashes. It does not scrape Boostcamp or ask for Boostcamp credentials. See `docs/importing-boostcamp.md`.

## Setup

```powershell
npm install
npm run dev
```

Open the Vite URL shown in the terminal. For the native desktop shell:

```powershell
npm run desktop
```

## Verification

```powershell
npm run test
npm run typecheck
npm run build
```

## Data

The MVP is local-first and does not require an account. Workout data is stored in a local SQLite-compatible database image in browser storage during Vite development, with the same schema and repository boundaries intended for Tauri-native SQLite later. Progress photos are represented as local file references or data URLs in the MVP and are exportable/deletable from Settings.

## Repository Layout

```text
apps/desktop        React/Tauri desktop app
packages/core       Shared types, schemas, PR logic, and fitness math
packages/db         SQLite schema, migrations, local repository adapter
packages/ml         Python ML training/inference scaffold
docs                Product, architecture, privacy, ML, and mobile roadmap docs
```
