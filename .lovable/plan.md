# Only require the audit for itineraries written in the itinerary maker

## Problem

The pre-publish checklist in the catalogue manager always includes "Itinerary has been audited", and publishing is blocked until every item passes. An itinerary created outside the maker (body written elsewhere, PDF uploaded) has no editor content to audit, so it can never be published.

## Change

Make the audit item conditional instead of always required:

- If the editor has body content (the itinerary was written/generated inside the maker), keep requiring the audit exactly as today.
- If there is no body content in the editor and a PDF has been attached (externally created itinerary), drop the audit item from the checklist entirely, so publishing depends only on cover image, hotels, prices and summaries.

The checklist UI will simply not show the audit row for externally uploaded itineraries, so there is no confusing "blocked" state.

## Technical detail

In `src/components/voyage/CatalogShopManager.tsx`:

- In `buildChecklist(s)`, only include the `audited` entry when `s.content.trim()` is non-empty. Because `canPublish` is `checklist.every(...)`, removing the row automatically unblocks publishing.
- Guard for the edge case where there is neither content nor an attached PDF: in that case still require either body content or an attached PDF, so an empty itinerary cannot be published (a "Body content or an attached PDF is required" checklist row).

No database, edge function, or other file changes.
