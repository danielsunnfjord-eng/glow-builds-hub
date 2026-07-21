## Goal

Reverse the current sync direction on demand. Today: DB → Google Doc (one-way, "Resync now"). Add a **Pull from Google Doc** action so you can:

1. Edit freely inside the linked Google Doc (rewrite text, restructure days, fix typos).
2. Click **Pull from Google Doc** in the itinerary maker.
3. The Doc's text becomes the itinerary's body content in the DB.
4. The existing PDF preview renders it using the built-in brand styling (Cormorant/Montserrat, gold H2, italic captions, gold-underlined H1, etc.) — you never have to style anything in Docs.

Cover page, back page, hotels stay out of scope (still added downstream as today).

## User-visible behaviour

In the editor's Google Doc panel (right next to **Open in Google Docs** / **Resync now**), add a third button: **Pull from Google Doc**.

- Enabled only when a Doc is linked (`gdocInfo.id`).
- On click:
  1. Confirm modal: *"This will replace the editor's body content with the current Google Doc. Existing formatting in the editor will be lost. Continue?"*
  2. Calls the sync edge function in a new `action: "pull"` mode.
  3. Function fetches the Doc as HTML via the Google Docs connector, sanitises it, converts to the editor's markdown format, and writes it to `itinerary_content_{lang}` for the current language.
  4. Editor reloads with the new content. Toast: *"Pulled from Google Doc."*
  5. PDF preview automatically re-renders with brand styling — nothing new needed there.
- On failure: existing `gdocError` state + toast surfaces the reason.

Small helper text under the button:
> "Overwrites the editor with the current Google Doc content. Formatting is normalised — the PDF preview reapplies brand styling."

The existing **Resync now** button (DB → Doc) stays. You pick per action which direction to sync; no lockout, no automatic behaviour. This keeps your current workflow intact and only adds an escape hatch when you've done heavy edits in Docs.

## Formatting normalisation contract

The Doc → editor conversion is **structure-preserving, style-discarding**, matching what `src/lib/sanitizeDocHtml.ts` already does:

- **Kept**: H1/H2/H3, paragraphs, bold, italic, underline, bullet lists, numbered lists, links, blockquotes, line breaks.
- **Dropped**: fonts, colors, sizes, alignment, spacing, tables (rare in itineraries), Google's wrapper divs/spans, inline styles, classes.
- **Images**: **kept as image references** in the markdown when the Doc has inline images with resolvable URLs; otherwise skipped silently. (Google Docs export gives image URLs via the connector — no re-hosting is done in this step; if a URL later 404s, the PDF preview handles missing images the same way it does today.)

This means the exported markdown looks like the AI-generated markdown the editor already understands, and the PDF preview's existing stylesheet takes over on render. No visual regressions to the PDF pipeline.

## Scope

**Modified files:**

- `supabase/functions/gdrive-sync-itinerary/index.ts` — add a new `action: "pull"` branch that:
  - Reads `gdoc_id` for the itinerary.
  - Calls `GET https://connector-gateway.lovable.dev/google_docs/v1/documents/{id}?...` to fetch the Doc as structured JSON (already the connector's format).
  - Walks the doc body → builds sanitised HTML using the same allow-list as `sanitizeDocHtml.ts` (paragraph/heading style → tag mapping; textRun styles → strong/em/u; lists → ul/ol/li; inlineObjectElement → `<img>` with the `contentUri`).
  - Converts that HTML → markdown using the editor's existing `htmlToMarkdown` helper (`src/components/voyage/editor/markdownHelpers.ts`). Because that helper lives in the client bundle, the edge function returns the sanitised HTML and the client does the HTML→markdown step before saving. (Simpler and reuses the same helper the editor already trusts.)
  - Language-aware: writes to `itinerary_content_{lang}` for the language passed in the request body, matching the existing `sync` branch.
  - Returns `{ html, language, doc_title }`.
- `src/components/voyage/CatalogShopManager.tsx` — add:
  - `pullFromGoogleDoc(itineraryId)` helper mirroring `syncToGoogleDoc`.
  - Confirm modal + button in the Google Doc panel.
  - After edge function returns HTML: run it through `htmlToMarkdown`, update the editor state, persist to DB via the existing save path.
  - New loading state `gdocPulling` so the two buttons show independent spinners.

**No changes to:**

- `PdfPreview.tsx` — it already reads from the same `itinerary_content_{lang}` field.
- `sanitizeDocHtml.ts` — reused as the allow-list reference; the edge function reproduces the same rules server-side because the DOMParser it uses is browser-only.
- `ItineraryShopDetail.tsx`, public pages, audit flow, generation flow.
- DB schema.

## Technical details

### Edge function `action: "pull"` outline

```text
1. Auth + parse body: { itinerary_id, language, action: "pull" }
2. SELECT gdoc_id, language columns for itinerary
3. If !gdoc_id → 400 "No Google Doc linked. Use Resync first."
4. GET /google_docs/v1/documents/{gdoc_id}
5. Walk `body.content`:
   - paragraph.namedStyleType HEADING_1..3 → <h1..h3>
   - paragraph → <p>
   - textRun with bold/italic/underline → wrap children
   - list items (paragraph.bullet.listId) → group into <ul>/<ol> based on listProperties glyph type
   - inlineObjectElement → look up inlineObjects[objectId].inlineObjectProperties.embeddedObject.imageProperties.contentUri → <img src=…>
6. Drop everything else (tables, drawings, footnotes) silently — log to telemetry response.
7. Return { html, language: resolvedLang, doc_title, dropped_element_types: [...] }
```

### Client-side integration

```text
1. Confirm dialog.
2. supabase.functions.invoke("gdrive-sync-itinerary", { body: { action: "pull", itinerary_id, language } })
3. const md = htmlToMarkdown(data.html)
4. setState((s) => ({ ...s, [`itinerary_content_${language}`]: md }))
5. Await save-to-DB (reuse existing save path so nothing diverges).
6. Toast success + list of dropped element types if any (transparency).
```

### Failure modes handled

- Doc deleted / 404 → surface: "Google Doc not found. Use Resync now to recreate it, or restore the Doc in Drive."
- Empty Doc → refuse with: "Google Doc is empty. Pull cancelled."
- Non-2xx from gateway → surface status + body per existing pattern.

## Out of scope

- Automatic bidirectional sync / conflict resolution.
- Change tracking or diffs between Doc and DB.
- Migrating images added in Docs into the app's image bank (URLs are referenced as-is).
- Editing cover, back page, or hotel recommendations from the Doc — those stay a downstream step in your existing workflow.
- Any changes to the PDF preview visual design.

## Test plan (post-implementation)

1. Take the Lisboa itinerary, make a small text edit in the Google Doc (change a heading + a paragraph, bold a phrase).
2. Click **Pull from Google Doc** in PT language.
3. Confirm the editor updates, the change appears, formatting reduces to structure-only.
4. Open PDF preview → confirm it renders with normal brand styling (gold H2, Cormorant headings, no Docs styling leaking in).
5. Edge cases: pull with no linked Doc (button hidden), pull an empty Doc (error toast), pull after deleting the Doc in Drive (helpful error).
