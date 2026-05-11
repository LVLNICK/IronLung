# Importing Boostcamp Data

IronLog imports Boostcamp data from files you manually provide. For this personal desktop build, it can also refresh from a local authenticated `boostcamp-mcp` helper folder that you control.

IronLog does not:

- ask for Boostcamp login credentials
- upload imported data anywhere
- store the original import file unless a future explicit option is added

IronLog does not store your Boostcamp email or password. The optional refresh button only runs your local helper, reads the resulting JSON export, and sends it through the same local dry-run importer.

## Supported Files

The importer accepts flexible CSV and JSON files. Boostcamp may not have a stable official export format, so IronLog recognizes common field names such as:

- `exercise`, `exerciseName`, `movement`
- `workout`, `workoutName`, `sessionName`
- `date`, `performedAt`, `startedAt`
- `weight`, `load`
- `reps`, `repetitions`
- `rpe`, `rir`
- `notes`
- `setNumber`, `set_index`

Unknown fields are preserved in import metadata for review.

For native Boostcamp training-history JSON, IronLog prefers completed archive fields such as `archived_weight` and `archived_reps` when Boostcamp leaves visible `value` fields blank. This avoids importing completed loaded sets as `0 lbs`.

## Using `boostcamp-mcp`

The community `boostcamp-mcp` project uses a private Boostcamp API wrapper and has a login script that asks for Boostcamp email/password, then stores a local token. IronLog does not run that login flow and does not store those credentials.

If you choose to use that project, run it yourself in a separate local folder. IronLog's desktop app can call that local folder to produce a JSON export, or you can save the output yourself and upload it manually. IronLog treats the result as user-provided data and parses it locally. It can also tolerate Python repr-like output such as single-quoted dictionaries with `None`, `True`, and `False`.

Only use third-party tools if you trust them. Keep `.env`, `.boostcamp/`, and any saved tokens out of the IronLog repo.

## Recommended Flow

1. Open IronLog Desktop with `npm run desktop`.
2. Go to `Data & Settings -> Boostcamp Import`.
3. Use `Refresh Boostcamp` to call your local helper, or upload your own CSV/JSON file.
4. Review the dry-run preview.
5. Choose units: `lbs`, `kg`, or auto-detect.
6. Review exercise mappings.
7. Import only after the preview looks correct.

Default personal helper paths on this machine:

- Boostcamp helper: `D:\boostcamp-mcp`
- Export folder: `D:\IronLung`

If authentication expires, run:

```powershell
cd D:\boostcamp-mcp
uv run login
```

Users can try requesting their data from Boostcamp support or use their own exported CSV/JSON file. Third-party exporters should be used carefully and only if the user trusts them.

## Duplicate Protection

IronLog computes a stable import hash from source, workout date, exercise name, set number, weight, reps, and notes. Re-importing the same file should skip duplicate sets instead of creating duplicate workouts.
