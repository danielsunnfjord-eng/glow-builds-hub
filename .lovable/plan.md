Diagnosis:
- The Google Doc clear/write fix is running: recent logs show `docsReplaceBody` started and completed with `batchUpdate write status=200`.
- The current data flow still lets the editor overwrite the Google Doc: `save()` updates `itinerary_content_en` from `state.content`, then calls `syncToGoogleDoc(savedId)` on every save.
- Because `state.content` is loaded from the database/draft when the editor opens, saving hotels can push stale body copy back into the Google Doc and replace edits made directly in Google Docs.
- This violates the intended rule: body copy lives in Google Docs, and normal editor saves must not impact it.

Plan:
1. Modify only `src/components/voyage/CatalogShopManager.tsx`.
2. Update `save()` so normal editor saves do not write `itinerary_content_*` for existing Google Doc-linked itineraries.
3. Remove the automatic `syncToGoogleDoc(savedId)` call from normal `save()` so hotel/cover/metadata saves cannot rewrite the Google Doc.
4. Keep Google Doc creation/sync available only through explicit Google Doc actions and the existing successful audit-apply path.
5. Preserve non-body fields such as hotels, cover fields, pricing, checklist, PDF URL, and publishing behavior.

Functions to modify:
- `save()` only, unless implementation requires a tiny helper for detecting whether the itinerary has an existing Google Doc.