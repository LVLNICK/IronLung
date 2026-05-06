# Architecture

The repo is organized as a monorepo so the backend/data contracts can be reused by future mobile clients.

- `apps/desktop`: Tauri + React desktop shell.
- `apps/desktop/src/app`: app composition and command palette.
- `apps/desktop/src/layout`: desktop sidebar shell.
- `apps/desktop/src/pages`: six primary pages.
- `apps/desktop/src/features`: desktop feature adapters and hooks.
- `packages/core`: shared TypeScript types, validation schemas, fitness math, analytics engine, muscle contribution model, PR detection, importers, and body analysis interface.
- `packages/db`: SQLite schema, migration SQL, and snapshot repository utilities.
- `packages/ml`: future Python model training and inference scaffold.

The desktop MVP stores app state locally and keeps the persistence boundary behind typed data/actions. The SQLite schema in `packages/db` mirrors the product entities and is ready for a Tauri-native SQLite adapter or a mobile SQLite adapter later.

The shared analytics engine lives in `packages/core/src/analytics` so future desktop, mobile, and sync clients can reuse the same formulas. Muscle contribution presets live in `packages/core/src/muscle-contributions.ts`. UI-only aggregation remains in `apps/desktop/src/lib/analytics.ts` and is adapted through `apps/desktop/src/features/analytics/useTrainingAnalytics.ts`.

Future sync should be optional. The local schema remains the source of truth, with a sync API resolving conflicts around immutable set logs, edited sessions, and photo references.
