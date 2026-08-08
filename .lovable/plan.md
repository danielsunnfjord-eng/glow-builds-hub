# Real social previews for itinerary links (SSR route)

Yes — Option B is the right call if social sharing matters for selling itineraries. It is the only route where any link, copied from anywhere, shows the itinerary's own title, description, and hero image on WhatsApp, Facebook, Instagram, and LinkedIn.

## Why

Social crawlers do not run JavaScript. Today they receive the static `index.html` head for every URL, so `https://fjordwavestravel.com/catalogue/<slug>` previews as the generic homepage card (and its `og:url` even points back to the homepage, which is why some platforms show nothing at all). A share-link workaround only fixes links shared through a button — not links people copy from the address bar or that Google/LinkedIn re-crawl.

Server-side rendering sends the correct head with the page itself, so every URL is correct everywhere, and Google also reads the itinerary pages without relying on JS execution.

## Plan

1. **Quick correction first** — remove the hardcoded `og:url` from `index.html` so shared links stop being reattributed to the homepage. Immediately turns "no preview" into a valid generic card while the migration happens.
2. **Migrate the site to Lovable's latest template (TanStack Start, with SSR).** Run in place; the routing, pages, and backend stay. [What the upgrade gives you](https://lovable.dev/blog/building-apps-using-tanstack-start)
3. **Move page metadata to server-rendered head tags.** Replace the client-side `Seo` component usage with route-level head data so each page emits its own title, description, canonical, hreflang, and og tags at request time.
4. **Per-itinerary previews on shop pages.** The itinerary route loads its record on the server and emits `og:title` (itinerary title in the page language), `og:description` (summary), `og:image` (hero image), and a self-referencing `og:url`.
5. **Verify** by fetching a few live itinerary URLs as a social crawler and confirming the correct tags come back, in all three languages.

## Notes

- The migration uses credits and touches framework files across the app; if anything looks wrong it can be reverted from chat history.
- Social platforms cache previews. Already-shared links keep the old card until re-scraped — Facebook's Sharing Debugger can force a refresh.
- Hero images should be reasonably sized (1200×630 renders best); very tall or very small images may be ignored by some platforms.

## Scope

Steps 1–5 above. No design, copy, pricing, or database changes.
