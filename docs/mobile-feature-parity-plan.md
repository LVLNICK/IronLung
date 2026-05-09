# IronLung Mobile Feature Parity Plan

IronLung mobile is moving from analyzer-first companion to a mobile version of the same product concepts as desktop, using the premium phone UI.

## Current parity target

Desktop sections should exist on mobile as phone-native screens:

- Command Center -> Home
- Train -> Train
- Exercises -> Exercises
- Analytics -> Analytics
- Photos -> Photos
- Data & Settings -> Data

## First parity pass implemented

- Added a first-class mobile `Exercises` tab.
- Added searchable/filterable exercise library.
- Added exercise detail cards with sessions, sets, volume, best set, e1RM, recent PRs, notes, and muscle contribution tags.
- Added phone-local create/edit exercise support.
- Renamed mobile Settings copy to Data & Settings.

## Remaining parity work

- Template creation/editing on mobile.
- Full workout history editing/deleting on mobile.
- Progress photo persistence and imported photo metadata on mobile.
- Training block create/edit on mobile.
- Richer Data & Settings preferences on mobile.
- Desktop-to-mobile and mobile-to-desktop conflict UI for phone-created exercise edits.

## Product rule

Desktop remains the most complete management surface until each mobile feature is wired to phone-local storage and export/merge behavior. Mobile UI should never pretend a feature is saved if it is only previewed.
