# IronLog Analyzer Import

IronLog Analyzer uses file-based local import. There is no cloud service and no server requirement.

The app shell can be hosted as a static PWA at `https://lvlnick.github.io/IronLung/`. That public URL serves only app files. Training data is still imported by the user and stored in phone-local browser storage.

## GitHub Pages Install

The hosted app runs under the `/IronLung/` base path because the GitHub repository is still named `IronLung`; the app itself is branded IronLog. The Vite Pages build rewrites asset URLs, registers the service worker at `/IronLung/sw.js`, and uses relative manifest icon paths so install/offline support works from GitHub Pages.

Phone install flow:

1. Open `https://lvlnick.github.io/IronLung/`.
2. Install it from the browser menu.
3. Open the installed app once while online.
4. Import a desktop seed bundle from `Sync -> Import desktop data`.
5. Use the cached analyzer offline. If the cache is old, Home and Sync show an outdated-cache warning based on `lastImportedAt`.

If the app opens but has no analytics, the app shell is installed correctly and the phone simply has no imported desktop seed yet.

## Desktop to Phone

1. Open Desktop `Data & Settings`.
2. Use `Mobile/PWA Sync -> Export mobile analytics seed`.
3. Move the `.ironlog-mobile-seed.json` file to the phone.
4. Open IronLog Analyzer `Sync`.
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

## Cache Management

`Sync -> Clear analyzer cache` removes imported exercises, sessions, sets, PRs, templates, and blocks from the phone. It preserves the phone's analyzer settings/device identity and clears `lastImportedAt`.

## Future No-Cloud Options

- QR transfer for small seed bundles.
- Local Wi-Fi transfer with a temporary desktop-only server.
- One-time pairing code.
- Encrypted local transfer.
- Password-encrypted export files.
