# Why itinerary links show no preview on social media

## What's actually happening

I fetched an itinerary URL as Facebook's crawler would:

`https://fjordwavestravel.com/catalogue/primeira-vez-em-roma-o-roteiro-prtico`

The crawler receives only the static `index.html` head:

- title: "Fjord & Waves Travel — Bespoke Travel Designed Around You"
- `og:url`: `https://fjordwavestravel.com/` (the homepage, not the itinerary)
- `og:image`: the generic site image

The per-page tags in `src/components/Seo.tsx` (itinerary title, hero image, description) are added by JavaScript after the page loads. Facebook, Instagram, WhatsApp, and LinkedIn do not run JavaScript, so they never see them.

On top of that, the hardcoded `og:url` pointing at the homepage tells the crawler "this page is really the homepage", which is why some platforms collapse the preview to nothing instead of at least showing the generic card.

## Fix, in two steps

### Step 1 — Quick correction (safe, immediate)

In `index.html`, remove the hardcoded `og:url` (and the canonical if present) so crawlers stop reattributing every shared link to the homepage. Every shared itinerary link will then at least show a valid Fjord & Waves card with the site image and description, instead of an empty preview.

This does not give per-itinerary titles or images.

### Step 2 — Real per-itinerary previews

Two possible routes:

**Option A — Share-link endpoint (works on the current setup)**

Add a backend function that serves a crawler-friendly page per itinerary:

- URL shape: `https://fjordwavestravel.com/s/<slug>` handled by a backend function
- It reads the itinerary from the database and returns a tiny HTML page containing the real `og:title`, `og:description`, `og:image` (the itinerary hero image), and `og:url`
- Real visitors are redirected instantly to the normal `/catalogue/<slug>` page
- The Copy-link/share button in the shop uses this `/s/<slug>` link

Result: correct picture, title, and description in WhatsApp, Facebook, Instagram, and LinkedIn — but only for links shared through the share button. Someone copying the address bar URL still gets the generic card.

**Option B — Server-side rendering (complete fix)**

Upgrade the site to Lovable's latest template with server-side rendering, so every URL — copied from the address bar or shared from anywhere — serves its own real head tags. This also improves how Google reads the itinerary pages. [What the upgrade gives you](https://lovable.dev/blog/building-apps-using-tanstack-start). It is a bigger migration and touches the whole app.

## Technical notes

- `src/components/Seo.tsx` is correct for Google (it executes JS); it is only insufficient for social crawlers.
- Option A adds one edge function plus a share-URL helper used by the itinerary page; no schema changes.
- Social platforms cache previews. After the fix, previously shared links keep the old card until re-scraped (Facebook's Sharing Debugger can force a refresh).

## Proposed scope for this change

Step 1 plus Option A, unless you prefer to go straight to the SSR migration.
