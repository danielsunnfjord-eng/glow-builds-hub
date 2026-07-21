# Pull from Google Doc + styled links in PDF

Two changes, scoped tightly.

## 1. Pull from Google Doc (body content only)

**Edge function** `supabase/functions/gdrive-sync-itinerary/index.ts`
- Add `action: "pull"` branch (alongside existing push/sync).
- Accepts `{ itineraryId, language }`.
- Loads the itinerary row, resolves the linked `google_doc_id` (self-heal 404 as today).
- Calls Google Drive export endpoint for the Doc with `mimeType=text/markdown`.
- Writes result into `itinerary_content_{lang}` (EN/PT/NO) for that itinerary.
- Returns `{ ok: true, chars }`.
- No touching of cover, back page, hotels, price, or metadata.

**Editor** `src/components/voyage/CatalogShopManager.tsx`
- The Pull button + AlertDialog are already wired. Confirm the helper invokes the function with `action: "pull"` and the current `language`, then reloads the editor content from the DB and toasts success.

Markdown export already gives `[text](url)` for hyperlinks, and `markdownToHtml` already renders those as real `<a href target="_blank">` tags — so links round-trip.

## 2. Blue + underlined links in the PDF preview

**File** `src/components/voyage/PdfPreview.tsx` (only)
- Add a scoped CSS rule inside the PDF body wrapper:
  ```css
  .fjw-pdf-body a { color: #1a56db; text-decoration: underline; }
  ```
- Applied to the body-content container only, so cover/back page are unaffected.
- Result: any `<a>` produced by `markdownToHtml` renders blue + underlined in preview and in the exported PDF.

## Out of scope

- Master template anchor system (separate track).
- Cover / back page / hotels / metadata rewriting on Pull.
- Any other files.

## Files touched

- `supabase/functions/gdrive-sync-itinerary/index.ts`
- `src/components/voyage/CatalogShopManager.tsx` (only if the pull helper still needs the `action: "pull"` wiring)
- `src/components/voyage/PdfPreview.tsx`
