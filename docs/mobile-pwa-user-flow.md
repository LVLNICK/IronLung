# Mobile/PWA User Flow

## Setup Before Gym

1. Run the desktop app.
2. Export a mobile seed bundle from `Data & Settings`.
3. Import the seed bundle into the phone PWA.
4. Install the PWA from the phone browser.

## Logging At The Gym

1. Open the PWA.
2. Start an empty workout or a user-created template.
3. Add exercises.
4. Log weight, reps, optional RPE, set type, and notes.
5. Use duplicate set, same-as-last, and unit-aware weight jumps for fast entry.
6. Finish the workout.

The app shell and data layer are offline-capable, so logging does not need internet after the app has been installed/opened once.

## After Gym

1. Export the mobile workout bundle from the PWA Sync tab.
2. Import it into Desktop `Data & Settings`.
3. Review the dry-run preview.
4. Merge mobile data.

Desktop remains the main analytics app. The PWA is the phone-local capture app.
