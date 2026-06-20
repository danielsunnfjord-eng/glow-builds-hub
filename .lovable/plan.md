# Architecture: Google Docs as body editor, app as PDF assembler

We separate **content editing** (Google Docs, freeform) from **PDF layout** (app, fixed templates). The TipTap editor disappears entirely; the PDF preview becomes the only preview.

## New workflow

```text
Create itinerary
  → AI generates body content
  → app pushes once to a new Google Doc (one-way, on creation)
  → user edits freely in Google Docs
  → returns to app, clicks "Finalise & Preview PDF"
  → app pulls Doc, strips formatting, keeps only structure
  → app assembles: Cover + Body + Hotels + Back page
  → Paged.js renders PDF in full-screen modal
  → Approve & Publish → saves PDF to Drive, publishes to catalogue
```

## New itinerary management panel (replaces editor window)

**Section 1 — Cover page fields** (unchanged): title, hero image, photo credit, caption, tagline, duration, region, season, estimated budget, cover intros (EN/PT/NO), short descriptions (EN/PT/NO).

**Section 2 — Body content** (no editor):
```text
📄 Google Doc linked
[Open in Google Docs ↗]
Last edited in Docs: 20.6.2026 12:30
[Finalise & Preview PDF]
```

**Section 3 — Additional pages**:
- Hotel recommendations: repeatable form rows (hotel name, location, description, price range, link) stored as JSON on the itinerary, rendered into a fixed-template hotel page.
- Back page: fixed template, no fields.

## Content sanitisation (Google Doc → PDF body)

Pull Doc as HTML via Drive export (`mimeType=text/html`), then sanitise with an allow-list:

```js
const allowedTags = ['h1','h2','h3','p','ul','ol','li','strong','em','a'];
// Strip: inline styles, <span>, <font>, classes, Google wrapper divs, colours, fonts.
// Keep: href on <a>, structural nesting only.
```

Sanitised HTML is injected into the Paged.js body section. All typography comes from existing brand CSS — never from Google Docs.

## What we remove

- TipTap editor + all extensions specific to body editing
- Live in-app editor preview
- Sync conflict detection UI (banners, "pull from Doc" dialog, freshness check, snapshots before pull)
- The `check` and `pull` actions of `gdrive-sync-itinerary` become unused (we keep `push` for creation, add `export-html` for finalise)
- The `runAutoMetadata` regeneration is unaffected (cover fields only)

## What we keep, untouched

- Cover page component (`ItineraryCoverPage.tsx`) and all its styling
- Paged.js pipeline (`PdfPreview.tsx`, `PdfJsViewer.tsx`)
- Google Drive/Docs connector integration
- Cover field auto-generation (intros + short descriptions)
- i18n, currency, AI generation step

## Files changed

- `src/components/voyage/CatalogShopManager.tsx`: strip TipTap, conflict UI, snapshot UI; add Body section (link + Finalise button), Hotels section (repeatable form), Finalise & Preview modal flow.
- `src/components/voyage/ItineraryEditor.tsx`: delete (or reduce to a thin re-export if still imported elsewhere — to be checked).
- `src/components/voyage/PdfPreview.tsx`: accept sanitised body HTML + hotels array + back-page template; assemble full document.
- `supabase/functions/gdrive-sync-itinerary/index.ts`: keep `push` (creation only), add `export-html` action (fetch Doc as HTML + `modifiedTime`), retire `check`/`pull` (leave handler returning 410 to be safe, then remove next pass).
- `supabase/migrations/<new>.sql`: add `hotels jsonb` column on `catalog_itineraries`; we will NOT drop the unused cols (`gdoc_last_synced_at`, snapshot table) in this change to avoid risk — they become dormant.

## Dependencies

- Add a small sanitiser (`sanitize-html` or a tiny custom allow-list walker). No new heavy deps.
- TipTap packages: leave installed until we confirm no other surface uses them, then remove in a follow-up.

## Out of scope (explicit)

- No new in-app body preview.
- No editing of Doc content inside the app.
- No bidirectional sync. App → Doc only on creation. Doc → App only at Finalise time, and only as render input (not persisted as editable state).
- No changes to cover styling, brand fonts, or Paged.js CSS.

## Open questions before I build

1. **Hotels page**: how many hotels per itinerary (max), and should each hotel have an image, or text-only for v1?
2. **Back page**: what content goes on it — contact block, advisor signature, legal line, logo? Anything dynamic, or fully static?
3. **Finalise & Publish**: when "Approve & Publish" runs, do we (a) save the rendered PDF to Google Drive in the same folder as the Doc, (b) upload to Supabase Storage, or (c) both?
4. **Existing itineraries** that currently have TipTap draft content but no Google Doc — do we auto-create a Doc from the existing draft on first open, or require the user to regenerate?
