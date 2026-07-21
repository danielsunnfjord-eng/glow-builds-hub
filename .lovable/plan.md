## Goal

Add a manual **Resync to Google Doc** button in the itinerary editor's Google Doc panel so the admin can force-push the current database body content to the linked Google Doc at any time — without regenerating the itinerary and without going through the audit-apply flow.

This also solves the immediate Lisboa case: after clicking it, the missing Portuguese body will be pushed to a freshly-created Google Doc (since `gdoc_id` is currently null, the existing self-healing sync path will create the folder + doc on first press).

## Scope

Only one file changes: `src/components/voyage/CatalogShopManager.tsx`.

No backend changes. No changes to the `gdrive-sync-itinerary` edge function — it already supports the plain `action: "sync"` path that `syncToGoogleDoc()` uses, and it already resolves the correct language column via the recent fix.

## UI changes (in `CatalogShopManager.tsx`)

In the Google Doc panel around lines 2386–2429:

1. **When a Doc is linked** (the `gdocInfo.id && gdocInfo.url` branch):
   - Keep the existing "Open in Google Docs" link.
   - Add a new **"Resync now"** button next to it.
   - Button calls the existing `syncToGoogleDoc(state.id!)` helper.
   - Disabled while `gdocSyncing` is true; shows a spinner and "Resyncing…" label during the call.
   - On success: toast "Google Doc resynced with latest editor content." (The helper already updates `gdocInfo` from the response.)
   - On failure: rely on existing `gdocError` state + toast inside the helper.

2. **When no Doc is linked yet but `state.id` exists**:
   - Keep the existing "Create Google Doc from existing draft" button unchanged. (Same helper — the edge function handles the "no gdoc yet" path by creating folder + doc.)

3. Small helper text under the Resync button:
   > "Overwrites the Google Doc body with the current editor/database content. Use this if the Doc is out of sync or was recreated."

No other UI, no other flows, no changes to the auto-sync behaviour of Save / Generate / Audit-Apply.

## Behaviour guarantees

- Does **not** call `generate-catalog-itinerary` — no AI regeneration.
- Does **not** touch the audit-apply flow — no `applyImprovementSectional` call.
- Only invokes `gdrive-sync-itinerary` with `{ action: "sync" }`, which:
  - Reads `itinerary_content_{lang}` from the database (with the recent language fallback).
  - Clears the linked Doc body and rewrites it, OR creates a new folder+doc if `gdoc_id` is null / stale (self-healing path already implemented).

## Technical details

- Reuses the existing `syncToGoogleDoc(itineraryId: string)` at line 524 — no duplication.
- Reuses existing state: `gdocSyncing`, `gdocError`, `gdocInfo`.
- Language sent: the sync function reads `body.language`; the current call site does not pass one, so it defaults to English resolution with fallback. The recent fix makes this safe for the Lisboa PT case. Optionally, pass `language: state.language` in `syncToGoogleDoc` so PT / NO itineraries always resolve their own column first. (One-line change inside the helper's `invoke` body.)

## Out of scope

- No new edge function, no schema change.
- No changes to `PdfPreview`, `ItineraryShopDetail`, or public pages.
- No changes to the audit or verification-table logic.
