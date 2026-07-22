# Fix "Pull from Google Doc" links + auto-show Estimated Budget in preview

## 1. Pull from Google Doc — links & images

### Current state (verified)
- `supabase/functions/gdrive-sync-itinerary/index.ts` (pull mode, line 542) exports the Doc via `Drive /export?mimeType=text/markdown` and returns the raw markdown string.
- `CatalogShopManager.pullFromGoogleDoc` writes that markdown straight into `state.content` (line 468).
- The PDF preview renders `content` through `markdownToHtml`, which already converts `[text](url)` and bare URLs into `<a href …>` (see `src/components/voyage/editor/markdownHelpers.ts` lines 30–38), and `PdfPreview` already styles anchors blue + underlined.

So the pipeline can render links — the failure is upstream. Two realistic causes to confirm and fix:

**A. Google Docs markdown export drops or mangles links in certain cases.** Some anchor styles come out as plain text without `[]()`, and Docs sometimes emits `<https://…>` autolinks or leaves the display text but drops the URL. This is a known export limitation.

**B. The client sanitizer or paragraph splitter drops the anchor.** Need to verify `markdownToHtml` isn't stripping `<a>` in a later pass (e.g., inside list items or headings).

### Plan
1. Switch pull to use **HTML export** (`text/html`, which the function already supports for `export-html`) instead of markdown. HTML export from Google Docs reliably preserves every `<a href>`. Convert the exported HTML back to the editor's markdown-with-inline-HTML format server-side so `state.content` still round-trips, keeping downstream code (preview, PDF, resync) unchanged.
   - Strip Google's inline `<style>`, class attributes, and wrapper divs.
   - Keep: headings, paragraphs, lists, `<a href>`, `<strong>/<em>/<u>`, tables, and `<img>` tags whose `src` is an `https://` URL not on `googleusercontent.com` (see step 3 below for images).
   - Convert the cleaned HTML to markdown using a light converter, preserving `[text](url)` for anchors so `markdownHelpers` renders them.
2. In `markdownHelpers.ts`, verify the link regex survives inside list items and headings; if a heading like `## [Title](url)` currently loses the anchor, extend the heading handler to run the inline-link pass on its text before emitting the `<hX>`.
3. **Images:** Google Docs image exports point at `googleusercontent.com` URLs that require the exporting user's session — they will 403 in the customer PDF. Two options, pick one in this plan:
   - **Do not pull images from the Doc.** Keep image management in the app (hotel gallery, section media). The pull skips `<img>` tags. Recommended — matches the existing model where formatting/layout is app-owned.
   - **Pull + rehost:** for each `<img>` in the exported HTML, download the bytes via the Google Drive connector, upload to the `itinerary-images` bucket, rewrite the `src` to the public URL. Heavier work; only worth it if you actively add photos inside the Doc.
4. Show a small post-pull toast summary: "N links preserved · M images skipped/rehosted" so the outcome is visible.

## 2. Estimated Budget → auto-appear in PDF preview after Save

### Current state (verified)
- `BudgetEstimator.handleSaveOnly` (line 328) only stores the budget object + cover label via `onSaved` and closes the dialog. It never touches editor content.
- Only `handleInsert` writes the table HTML into the TipTap editor (line 298).
- Result: after "Save", the cover label shows the price but the body/preview has no budget table until the user explicitly clicks "Insert into editor".

### Plan
1. In `BudgetEstimator.handleSaveOnly`, after calling `onSaved`, also render the budget table HTML (`buildTableHtml()`) and insert it into the editor — same call as `handleInsert`, but idempotent:
   - Before inserting, scan `editor.getHTML()` for an existing budget block (identified by a stable wrapper class, e.g. `data-fjw-budget="1"` added to the outer `<table>` in `buildTableHtml`).
   - If found, replace that block with the new HTML. If not, append at end.
2. Add the same `data-fjw-budget="1"` marker in `buildTableHtml` so future re-saves reliably overwrite instead of stacking duplicates.
3. Persist the draft immediately after the insert so a page reload keeps the table (`persistCatalogDraft(true)` is already invoked on content changes; confirm it fires here).
4. No change to `estimated_trip_budget` DB column — cover-page pipeline is untouched.

## Files touched

- `supabase/functions/gdrive-sync-itinerary/index.ts` — pull action now returns cleaned HTML-derived markdown (links preserved).
- `src/components/voyage/CatalogShopManager.tsx` — no logic change beyond consuming the same `markdown` field; possibly surface link/image counts in the success toast.
- `src/components/voyage/editor/markdownHelpers.ts` — guard link pass inside headings/lists if verification shows a gap.
- `src/components/voyage/editor/BudgetEstimator.tsx` — `handleSaveOnly` inserts/replaces the budget table; `buildTableHtml` adds `data-fjw-budget` marker.

## Open decision

For section 1 step 3 (images inside the Doc): **skip images** (simple, recommended) or **rehost images** (heavier, only useful if you paste photos into the Doc). I'll default to **skip images** unless you say otherwise — that matches the existing "layout stays in the app" model and avoids broken image links in customer PDFs.
