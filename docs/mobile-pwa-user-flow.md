# IronLung Analyzer User Flow

## Setup

1. Run the desktop app.
2. Export a mobile analytics seed from `Data & Settings`.
3. Import the seed into IronLung Analyzer on the phone.
4. Install the PWA from the phone browser when available.

## Phone Use

Open the PWA to view:

- training overview
- top lifts
- meaningful PRs
- volume trends
- muscle balance
- neglected muscles
- recovery/fatigue warnings when data supports them

The analyzer is read-only for the MVP. It does not expose workout logging, exercise creation, workout deletion, or template editing.

## Local Network Notes

Testing from `http://192.168...` may require HTTPS for full PWA install and service-worker behavior on some phones. Static hosting only serves app files; workout data remains in phone storage.
