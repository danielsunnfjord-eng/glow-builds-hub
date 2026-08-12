# English-only intake form modal

Goal: on the English site only, every "Plan my trip" / "Start your journey" CTA opens the Fora intake form (`https://secure.foratravel.com/intake/uRYFCpSsUZ`) in an iframe modal over the current page. Portuguese and Norwegian keep the current behaviour (navigate to the internal intake pages) with no changes.

## Behaviour

- Modal overlays the current page; the page underneath stays mounted, so closing returns the visitor to the exact same state (no reload, no navigation).
- Visible X close button; the modal only closes on X (no auto-close, no click-outside, no ESC).
- Persistent note under the iframe: "Thank you for your submission. Once you've completed the form, you can close this window to continue browsing."
- Locale check uses the existing URL-based locale helper (`currentLocale()` / route locale), so `/no/...` and `/pt-br/...` are untouched.

## Files to create

- `src/components/voyage/IntakeFormModal.tsx` — provider + modal. Exposes `useIntakeCta()` returning `{ isEnglish, open(), linkProps }` so call sites can keep their existing markup and only intercept the click when the locale is English.

## Files to modify (add the CTA hook, no visual changes)

- `src/routes/__root.tsx` — mount the provider so the modal renders above all pages.
- `src/components/voyage/Navbar.tsx` — desktop + mobile "Plan my trip".
- `src/components/voyage/PlanMyTrip.tsx` — homepage card CTA.
- `src/components/voyage/DualPathCards.tsx` — "Start your journey" link.
- `src/components/voyage/Pricing.tsx` — bespoke card CTA.
- `src/pages/ItinerariesShop.tsx` — two "Plan my trip" CTAs.
- `src/pages/ItineraryShopDetail.tsx` — customise-this-itinerary CTA.
- `src/pages/DestinationNorway.tsx` — two hero/footer CTAs.
- `src/pages/Routes.tsx` and `src/pages/RouteDetail.tsx` — route page CTAs.

The internal pages `/start-your-journey` and `/plan-my-trip` and their form (`TripRequestForm`) stay as they are, still used by NO/PT and reachable directly.

## Technical notes

- Provider holds `open` state in React state only; nothing writes to the URL or router, so no re-render of the underlying route.
- Iframe is `title`d, `loading="lazy"`, full-height inside a max-width dialog, with `allow="clipboard-write"`.
- Body scroll locked while open, restored on close.
