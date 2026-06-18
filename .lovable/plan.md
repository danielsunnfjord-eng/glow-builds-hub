## Plan

1. **Stop maintaining two different cover designs**
   - Treat the PDF preview cover as the source of truth, because that is what the admin itinerary PDF is actually rendering.
   - Align the standalone `ItineraryCoverPage` component to the same structure so future edits do not drift.

2. **Rebuild the cover in the exact requested order**
   ```text
   Logo block on parchment
   Hero image from uploaded itinerary image
   Optional photo credit below/near hero
   Eyebrow
   Title
   Short description only
   Duration / Region / Season strip
   Teal footer accent bar
   ```

3. **Use the real itinerary data correctly**
   - Hero: `project.hero_image_url`, fallback to dark slate `#1c2e38` only when missing.
   - Credit: `project.hero_image_credit`.
   - Title: itinerary/destination title, not client name.
   - Eyebrow: default to “A pre-designed and inspirational itinerary”.
   - Description: use the cover tagline/short description only, never the full itinerary body.
   - Metadata: duration, region/destination, and season/date range.

4. **Make the page print-editorial, not web-card-like**
   - Fixed A4 cover dimensions with no unintended Paged.js margins.
   - Warm parchment background.
   - Full-width image band.
   - Large centered Fjord & Waves logo block.
   - Playfair Display / Cormorant Garamond / Jost styling matching your spec.
   - Metadata separators in `#c4d4da` and footer bar in Fjord teal.

5. **Verify visually in the actual admin preview**
   - Open the live admin PDF preview with Playwright.
   - Capture the rendered first page.
   - Check that the order, spacing, image, title, description, metadata strip, and footer are visible and not clipped/overlapping.
   - Iterate until the first page matches the requested editorial cover structure.