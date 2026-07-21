# Fix: Google Doc sync only mirrors English content

## Problem

`gdrive-sync-itinerary` hardcodes `title_en`, `summary_en`, and `itinerary_content_en`. Itineraries generated in Portuguese or Norwegian write their body to `itinerary_content_pt` / `itinerary_content_no`, so the synced Google Doc has an empty body (title + meta line + footer note only) — which matches the screenshot for the Lisboa (PT) itinerary.

## Change

Only touch `supabase/functions/gdrive-sync-itinerary/index.ts`.

1. Accept an optional `language: "en" | "pt" | "no"` field on the request body (defaults to `"en"` to preserve current behavior for older callers).
2. Extend the `SELECT` to include `title_pt, title_no, summary_pt, summary_no, itinerary_content_pt, itinerary_content_no`.
3. Add a resolver that, for the requested language, picks:
   - `title` = `title_{lang}` → fallback to `title_en` → `"Untitled itinerary"`
   - `summary` = `summary_{lang}` → fallback to `summary_en`
   - `contentMarkdown` = `itinerary_content_{lang}` → fallback to first non-empty of the other two languages (so a doc is never silently empty when content exists in another column)
4. Use the resolved values in both the create path (`buildDocHtml` / `driveCreateDocFromHtml`) and the update path (`docsReplaceBody`). Apply the same resolution to the `sync` and (for consistency) any content-emitting branches. `check`, `pull`, and `export-html` don't need changes.
5. Log the resolved language and whether a fallback was used, to make future debugging obvious in edge function logs.

Caller side (`CatalogShopManager.tsx`) already knows `state.language`; I'll leave the client alone in this task since sync will still default to EN and existing English itineraries keep working. A follow-up can pass `language: state.language` from the four `invoke("gdrive-sync-itinerary", …)` call sites so PT/NO itineraries route to the right column without falling back — say the word and I'll include it.

## Verification

After deploy, re-run "Save" / "Sync to Google Drive" on the Lisboa itinerary. The linked Google Doc should now contain the full Portuguese body under the title and meta line, followed by the footer note.
