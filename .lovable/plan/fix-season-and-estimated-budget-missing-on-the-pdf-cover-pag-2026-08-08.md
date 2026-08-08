# Fix: Season and Estimated Budget missing on the PDF cover page

## What I found

The cover template itself is fine — it renders a Season column always, and a Budget column only when a value exists. The problem is upstream, in what gets handed to the cover.

**Estimated budget (confirmed)**
- The editor keeps the cover budget label in a local state variable that is filled only from browser localStorage, never from the database column `estimated_trip_budget`.
- The catalogue list query does not fetch `estimated_trip_budget` at all, so the "Preview" from the list also falls back to localStorage.
- Worse: saving an itinerary writes that same (often empty) local value back to `estimated_trip_budget`, wiping the stored budget. In the database, 7 of the 12 most recent itineraries now have an empty budget, while the amounts were clearly generated at some point.

Result: on any browser/session other than the one where the estimator was last run, the cover has no budget value and the column is hidden.

**Season (needs one verification step)**
Every recent itinerary has season values in the database, and the list query does fetch `season`. The likely cause is the editor's autosaved draft: when a draft is restored it is merged over the database row, so a draft saved before seasons were chosen (with an empty season list) overrides the real value and the cover falls back to "—". This is not yet confirmed, so the first step is to check a specific itinerary's saved draft before changing anything.

## Plan

1. Verify the season cause: inspect the saved editor draft for an itinerary whose cover shows "—" and confirm whether the draft carries an empty season list that overrides the database value. Also confirm long season strings ("Verão · Outono · Inverno · Primavera") are not simply being clipped by the fixed-height cover strip.
2. Make the budget read from the database:
   - Add `estimated_trip_budget` to the catalogue list query.
   - Load the stored budget into the editor when an itinerary is opened, using localStorage only as a fallback for unsaved work.
   - Use the row value directly for the list "Preview" cover.
3. Stop the save from wiping it: only write `estimated_trip_budget` when the estimator actually produced a value; never overwrite a stored value with an empty one.
4. Fix the season override per step 1's finding — merge drafts so empty metadata lists don't overwrite saved database values (and, if it's a clipping issue, let the season column wrap instead of being cut off).
5. Restore the lost budget values: for itineraries where the budget was blanked, re-run the estimator or re-enter the label so the cover and the shop subpage both show it again.
6. Check the result by previewing two itineraries — one Portuguese, one English — and confirming both Season and Estimated budget appear on the cover.

## Technical notes

- Files: `src/components/voyage/CatalogShopManager.tsx` (list select, editor load, save payload, draft merge), possibly `src/components/voyage/PdfPreview.tsx` (season column wrapping only).
- No database schema change: `catalog_itineraries.estimated_trip_budget` and `season` already exist and already feed the shop subpage.
