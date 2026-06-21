## Goal
Allow unlimited hotel recommendations in the itinerary editor; extra hotels flow automatically onto additional hotel pages in both the preview PDF (Paged.js) and the generated catalog PDF (jsPDF).

## Changes

### 1. `src/components/voyage/CatalogShopManager.tsx` (editor UI)
- Remove the `disabled={state.hotels.length >= 4}` guard on the "Add Hotel" button.
- Remove the `title` tooltip about the 4-hotel max.
- Change the button label from `Add Hotel ({state.hotels.length}/4)` to `Add Hotel ({state.hotels.length})`.
- Update the helper copy from *"Up to 4 hotels — …"* to *"Add as many hotels as you need — name, location, description and up to 3 images each. They flow across as many hotel pages as required in the PDF."*

### 2. No backend changes needed
- `src/components/voyage/PdfPreview.tsx` already uses `page-break-inside: avoid` on `.fjw-hotel-card` and only forces a page break on the section itself, so Paged.js will paginate extra cards automatically.
- `supabase/functions/generate-catalog-pdf/index.ts` already calls `pdf.addPage()` inside the hotels loop when `hy > H - 280`, so extra hotels overflow onto new pages.
- DB column `hotels jsonb` has no length constraint.

## Verification
- Add 6–8 hotels in the editor and confirm the "Add Hotel" button stays enabled.
- Open the in-app PDF preview and confirm hotels paginate cleanly (no cards split across pages, new hotel pages appear as needed).
- Generate the catalog PDF via the edge function and confirm the same.

## Notes / Trade-offs
- Card size stays the same; with many hotels the document just gets longer. No shrinking.
- Section heading "Hotel Recommendations" only appears on the first hotel page (existing behaviour), subsequent hotel pages continue without a repeated header.