# IronLung Analyzer Import

IronLung Analyzer uses file-based local import. There is no cloud service and no server requirement.

The app shell can be hosted as a static PWA at `https://lvlnick.github.io/IronLung/`. That public URL serves only app files. Training data is still imported by the user and stored in phone-local browser storage.

## Desktop to Phone

1. Open Desktop `Data & Settings`.
2. Use `Mobile/PWA Sync -> Export mobile analytics seed`.
3. Move the `.ironlung-mobile-seed.json` file to the phone.
4. Open IronLung Analyzer `Sync`.
5. Import the desktop data file.

The seed contains exercises, sessions, session exercises, set logs, PRs, user-created templates, training blocks, and settings. It does not include photos by default.

## Same File Twice

Importing the same seed repeatedly should not duplicate records.

Rules:

- Match by stable `id`.
- For exercises, also skip duplicates by normalized exercise name.
- If incoming `updatedAt` is newer, update the local analyzer cache.
- If local data is newer or same, skip.
- Count created, updated, and skipped records clearly.

## Export

The mobile app may export an analyzer cache backup. This is not sync and is not uploaded. It is a user-controlled local JSON backup.

## Future No-Cloud Options

- QR transfer for small seed bundles.
- Local Wi-Fi transfer with a temporary desktop-only server.
- One-time pairing code.
- Encrypted local transfer.
- Password-encrypted export files.
