# Catalogue PDF check: merging, preview and customer download

## What I checked

- All 8 published catalogue itineraries have a PDF attached, and every attached file exists in storage (2.8–9.9 MB each). Nothing is missing on the store side.
- The 4 uploaded body PDFs I could inspect (Barcelona, Lisbon, Oslo, Sogn og Fjordane) are healthy: 15–34 pages, no blank pages. So the blank pages are introduced by the merge step, not by your source documents.
- I tested the real customer download link for the only paid purchase. It fails with **"Link expired"**.

## Confirmed problem 1: download links expire after 7 days

When a purchase is verified, the download link is given a 7-day expiry. After that, both the button on the thank-you page and the link in the confirmation email return an error — which matches what you saw.

Fix: make the customer download permanent (no expiry) for paid purchases, and keep the short-lived signed URL only as the internal file link that gets regenerated on each click. Existing expired purchases get their expiry cleared so past customers can download again.

## Likely cause of blank pages (to verify first)

The cover page, hotel pages and back page are not real PDF pages — they are screenshots of the on-screen layout, spliced around your uploaded PDF. The screenshot is taken as soon as pagination finishes, without waiting for the hero image, logo and hotel photos to finish loading and decoding. If an image is still loading, that page is captured white — which produces exactly the "incomplete PDF with blank pages" symptom, and the blank version then gets baked in when you press Attach to Store.

A second suspect: the layout can emit an extra empty page when a section (hotels) is empty.

Plan step 1 is to confirm this by generating a merged PDF and inspecting each page, before changing behaviour.

## What I will do

1. **Verify** — reproduce a merge in the editor preview and inspect the resulting pages to confirm which pages come out blank and why.
2. **Make the merge wait for assets** — before capturing each page: wait for fonts to be ready and for every image inside that page to be fully loaded/decoded, with a timeout fallback.
3. **Skip empty pages** — drop any captured page that contains no visible content, so no blank sheet ends up between your content and the back page.
4. **Guard Attach to Store** — block attaching while the merge is still running or if it errored, and show the final page count so you can confirm before publishing.
5. **Fix the download expiry** as described above, and clear the expiry on existing paid purchases.
6. **Re-check all 8 published itineraries** after the fix: confirm each stored PDF opens, has the expected page count and no blank pages.

## Technical notes

- `src/components/voyage/PdfPreview.tsx` — merge effect (`addRenderedPage`): add font/image readiness await, blank-canvas detection, and disable the attach button until `mergedPdfUrl` exists without `mergeError`.
- `supabase/functions/verify-catalog-purchase/index.ts` — stop setting `download_expires_at` (or set it far out); `download-catalog-pdf` already mints a fresh 10-minute signed URL per request.
- One migration to clear `download_expires_at` on existing paid rows.
- Re-attaching the fixed PDFs for the 8 published itineraries is a manual click per itinerary in the admin editor; I will list which ones need it after the verification pass.
