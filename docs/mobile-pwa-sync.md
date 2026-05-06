# Mobile/PWA Sync

IronLung sync is file-based for the MVP. There is no cloud service and no server requirement.

## Desktop to Phone

1. Open Desktop `Data & Settings`.
2. Use `Mobile/PWA Sync -> Export mobile seed`.
3. Move the `.ironlung-mobile-seed.json` file to the phone.
4. Open the PWA `Sync` tab.
5. Import the seed bundle.

The seed contains exercises, user-created templates, training blocks, and settings. It does not include photos and does not erase phone logs.

## Phone to Desktop

1. Log workouts offline in the PWA.
2. Open the PWA `Sync` tab.
3. Export `.ironlung-mobile.json`.
4. Open Desktop `Data & Settings`.
5. Import the mobile export.
6. Review the dry-run preview.
7. Click `Merge mobile data`.

## Merge Rules

- Match by stable `id` first.
- Skip soft-deleted mobile records for MVP safety.
- Detect duplicate sets by workout date, workout name, exercise name/id, set number, weight, reps, notes, and created time.
- Prefer newer mobile updates only when the mobile `updatedAt` is newer than desktop.
- Preserve desktop-only data.
- Recalculate desktop PRs after merge through the existing desktop import path.

## Future No-Cloud Options

- QR transfer for small seed bundles.
- Local Wi-Fi transfer with a temporary desktop-only server.
- One-time pairing code.
- Encrypted local transfer.
- Password-encrypted export files.
