
## Goal

Add the three sections shown in the mockups to the homepage while keeping "What does your travel advisor do?", "What I can arrange", and "What clients say" fully intact.

## What the mockups show

1. **Dual-path block** (image-71): Two side-by-side cards — "Ready-made itineraries" (description + "See itineraries" button → `/catalogue`, no price shown) and "Fully bespoke trip" (description + "Request a quote" button → `/start-your-journey`). Slim Daniel credentials strip below (avatar + IATA / Fora / 50+ trips badges).

2. **"How it works" + featured itineraries** (image-72): Keep the existing 3-step "How it works" block. Add a new "Start planning today" row showing 3 featured itineraries pulled from `catalog_itineraries` (published only, newest first) with a "See all →" link to `/catalogue`.

3. **WhatsApp CTA banner** (image-73): Dark ink banner "Where shall we go first?" with two buttons — green "Chat on WhatsApp" (uses `WHATSAPP_URL`) and gold "See itineraries" (→ `/catalogue`).

## Placement on `src/pages/Index.tsx`

```text
Navbar
CuratedSection (existing — hero + how-it-works + advisor role + perks + services)
NEW: <DualPathCards/>            ← inserted here
NEW: <FeaturedItineraries/>      ← inserted here
MeetDaniel  (existing — "What does your travel advisor do?")
Reviews     (existing — "What clients say")
NEW: <WhatsAppBanner/>
PlanMyTrip  (existing)
Footer
```

`CuratedSection.tsx`, `MeetDaniel.tsx`, and `Reviews.tsx` stay untouched.

## Files to create

- `src/components/voyage/DualPathCards.tsx` — two-card block + credentials strip. No prices.
- `src/components/voyage/FeaturedItineraries.tsx` — fetches top 3 published itineraries via the supabase client, reuses card styling from `ItinerariesShop.tsx` and `formatPrice` / `usePreferredCurrency` from `src/lib/pricing.tsx` for each card's own price.
- `src/components/voyage/WhatsAppBanner.tsx` — dark banner with WhatsApp + catalogue CTAs, using existing `WHATSAPP_URL` from `src/lib/whatsapp.ts` (no `target="_blank"`).

## Files to modify

- `src/pages/Index.tsx` — render the three new components in the order above; lazy-load `FeaturedItineraries` and `WhatsAppBanner` under the existing `Suspense`.
- `src/i18n/locales/en.ts`, `pt.ts`, `no.ts` — add a new `home` namespace with all copy from the mockups (dual-path titles/descriptions/CTAs, credentials strip labels, featured section heading + "See all", WhatsApp banner text). Translated in EN / PT / NO.

## Not touched

- No schema, edge-function, pricing-logic, or checkout changes.
- No starting-price display on the ready-made card.
