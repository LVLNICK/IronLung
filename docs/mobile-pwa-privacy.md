# Mobile/PWA Privacy

IronLung Mobile PWA is local-first. Workout data created on the phone is stored in the phone browser's IndexedDB storage.

## Guarantees

- No account is required.
- No cloud sync is implemented.
- No workout data, photos, or analytics are uploaded by IronLung.
- No analytics tracking is added.
- Export files are created only when the user taps export.
- Import files are parsed locally in the browser.

## Sensitive Files

`.ironlung-mobile.json` exports can contain exercise history, set logs, PRs, notes, bodyweight values, training blocks, and device metadata. Treat these files like private health-adjacent records.

## Deletion

Phone records use sync-safe metadata including `deletedAt` for future soft-delete flows. Desktop import does not blindly erase desktop-only records from a phone bundle.

## Future Encryption

The planned encryption interface is:

```ts
encryptExportBundle(bundle, password)
decryptExportBundle(file, password)
```

This is intentionally documented but not enabled in the MVP until it can be implemented and tested carefully.
