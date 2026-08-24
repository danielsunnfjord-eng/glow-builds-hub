# Fix link previews for itinerary pages

## What I checked

Fetching your Aurora Boreal itinerary page as Facebook's crawler, the page already returns the right tags: correct title, Portuguese description, and the itinerary's own cover photo. So the page itself is not broken. Two real problems remain:

1. **The cover photo is too big to be used as a preview.** The image served is the original upload: 4928x3280 pixels, 3.1 MB. WhatsApp silently drops images over ~300 KB, and several platforms refuse very large images. On top of that, the site-wide tags declare every preview image as 1200x630, which does not match the real photo — crawlers that trust those numbers crop or reject the image.
2. **The link in your screenshot was pasted twice** ("...na-noruegahttps://fjordwavestravel.com/..."). That malformed address is not the itinerary page — it redirects, so Facebook fell back to the generic homepage card. Pasting the URL once gives the itinerary card.

## Plan

1. Serve a preview-sized version of each itinerary cover photo (1200x630, ~50 KB) using the image resizing that the storage already supports, instead of linking the full-resolution original. Verified working: the same photo comes back at 48 KB.
2. Apply the same treatment to every page that sets a preview image (itinerary pages, catalogue, homepage, pricing, etc.) so all shared links get a light, correctly sized image.
3. Declare the matching 1200x630 dimensions per page and stop the site-wide dimensions from mislabelling itinerary photos.
4. Re-check the live pages as Facebook, WhatsApp and LinkedIn crawlers, in all three languages, and confirm the image loads and is under the size limits.

## Notes

- Platforms cache previews. Links already shared keep the old card until re-scraped; Facebook's Sharing Debugger can force a refresh for a given URL, and I will tell you which URLs to run through it.
- No design, copy, pricing or database changes.

## Technical detail

- Add a helper that rewrites Supabase storage public URLs to the `render/image/public/...?width=1200&height=630&resize=cover` transform, and use it for `og:image` / `twitter:image` in `src/lib/seoHead.ts` (and the itinerary route's JSON-LD image stays the original).
- Move `og:image:width` / `og:image:height` out of `src/routes/__root.tsx`'s blanket defaults into the per-page head output so they always describe the image actually referenced.
