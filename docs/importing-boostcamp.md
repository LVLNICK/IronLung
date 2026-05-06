# Importing Boostcamp Data

IronLung imports Boostcamp data only from files you manually provide.

IronLung does not:

- scrape Boostcamp
- ask for Boostcamp login credentials
- automate requests to Boostcamp
- upload imported data anywhere
- store the original import file unless a future explicit option is added

## Supported Files

The importer accepts flexible CSV and JSON files. Boostcamp may not have a stable official export format, so IronLung recognizes common field names such as:

- `exercise`, `exerciseName`, `movement`
- `workout`, `workoutName`, `sessionName`
- `date`, `performedAt`, `startedAt`
- `weight`, `load`
- `reps`, `repetitions`
- `rpe`, `rir`
- `notes`
- `setNumber`, `set_index`

Unknown fields are preserved in import metadata for review.

## Using `boostcamp-mcp`

The community `boostcamp-mcp` project uses a private Boostcamp API wrapper and has a login script that asks for Boostcamp email/password, then stores a local token. IronLung does not run that login flow, does not store those credentials, and does not connect to the MCP server directly.

If you choose to use that project, run it yourself in a separate local folder and save the output of its training-history tool as a local `.json` or `.txt` file. Then import that file in IronLung. IronLung will treat it as user-provided data and parse it locally. It can also tolerate Python repr-like output such as single-quoted dictionaries with `None`, `True`, and `False`.

Only use third-party tools if you trust them. Keep `.env`, `.boostcamp/`, and any saved tokens out of the IronLung repo.

## Recommended Flow

1. Get your own CSV or JSON export.
2. Open IronLung Desktop.
3. Go to `Data & Settings -> Boostcamp Import`.
4. Upload the file.
5. Review the dry-run preview.
6. Choose units: `lbs`, `kg`, or auto-detect.
7. Review exercise mappings.
8. Import only after the preview looks correct.

Users can try requesting their data from Boostcamp support or use their own exported CSV/JSON file. Third-party exporters should be used carefully and only if the user trusts them.

## Duplicate Protection

IronLung computes a stable import hash from source, workout date, exercise name, set number, weight, reps, and notes. Re-importing the same file should skip duplicate sets instead of creating duplicate workouts.
