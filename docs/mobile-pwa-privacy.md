# IronLung Analyzer Privacy

IronLung Analyzer is local-first. Imported desktop data is stored in the phone browser's local storage layer.

## Guarantees

- No account is required.
- No cloud sync is implemented.
- No workout data, photos, or analytics are uploaded by IronLung.
- No analytics tracking is added.
- Import files are parsed locally in the browser.
- Cache backup files are created only when the user taps export.

## Sensitive Files

`.ironlung-mobile-seed.json` and analyzer cache backups can contain exercise history, set logs, PRs, notes, bodyweight values, training blocks, and device metadata. Treat these files like private health-adjacent records.

## Deletion

The Sync page includes `Clear local analyzer data`, which clears the phone-local analyzer cache. Desktop data is not affected.

## Future Encryption

The planned encryption interface is:

```ts
encryptExportBundle(bundle, password)
decryptExportBundle(file, password)
```

This is intentionally documented but not enabled in the MVP until it can be implemented and tested carefully.
