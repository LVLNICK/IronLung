# Architecture

The repo is organized as a monorepo so the backend/data contracts can be reused by future mobile clients.

- `apps/desktop`: Tauri + React desktop shell.
- `packages/core`: shared TypeScript types, validation schemas, fitness math, PR detection, and body analysis interface.
- `packages/db`: SQLite schema, migration SQL, and snapshot repository utilities.
- `packages/ml`: future Python model training and inference scaffold.

The desktop MVP stores app state locally and keeps the persistence boundary behind typed data/actions. The SQLite schema in `packages/db` mirrors the product entities and is ready for a Tauri-native SQLite adapter or a mobile SQLite adapter later.

Future sync should be optional. The local schema remains the source of truth, with a sync API resolving conflicts around immutable set logs, edited sessions, and photo references.
