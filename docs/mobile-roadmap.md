# Mobile Roadmap

IronLog is structured so a future mobile app can reuse the same product concepts and logic.

- Keep `packages/core` shared for types, validation schemas, importers, muscle contribution analytics, training goals, training blocks, PR calculations, and fitness math.
- Keep schema concepts aligned with `packages/db`.
- Build mobile later with React Native or Expo.
- Use a mobile SQLite adapter with the same entities.
- Reuse the Body Analysis interface where possible.
- Add optional sync only after local-first behavior is stable.
- Keep cloud sync opt-in and preserve local export/delete controls.

Recommended future sequence:

1. Extract a storage-driver interface used by desktop and mobile.
2. Build a React Native UI around the same domain actions.
3. Reuse the Command Center, Train, Exercises, Analytics, Photos, and Data & Settings concepts with mobile-specific navigation.
4. Add optional encrypted backup/sync.
5. Add native camera capture and local photo storage.
6. Replace or extend the local approximate ML inference behind the existing analysis interface.
