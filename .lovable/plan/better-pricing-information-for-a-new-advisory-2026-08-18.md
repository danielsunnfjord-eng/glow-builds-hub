# Better pricing information for a new advisory

Goal: make the pricing page do the selling. Right now it lists three prices and a short explainer. The upgrade explains *what the fee buys*, *when it does and does not apply*, and gives an honest founding-client offer that fits a business in its first years — while correcting one thing that is currently wrong on the page.

## Corrections first

- The page currently promises "The full fee is deducted from your final booking". You confirmed the planning fee is **not** credited. This must be replaced with accurate copy: the planning fee pays for the design work and is non-refundable, and the free consultation is where you decide whether to go ahead.
- Terminology is currently mixed. Adopt the industry wording used across the trade:
  - **Planning fee** — the flat, upfront fee you pay before design work starts.
  - **Service fee** — the 7% charged on bookings handled on your behalf.
  Every language version uses this split consistently.

## New structure for the pricing page

1. **Intro** (kept, minor rewrite) — clear, honest pricing from day one.
2. **Three tiers** (kept) — Ready-made guide / One-to-one consultation / Bespoke journey, with the live currency dropdown as today.
3. **Founding-client offer** — a visible banner above the tiers: an introductory discount on the bespoke planning fee for the first clients, plus a referral discount, with a stated review date. Presented as "early-client pricing while we grow", not as a permanent sale. Amounts and the end date come from you (see Open inputs).
4. **How the planning fee is calculated** — one section, three sub-blocks matching how you actually price:
   - *Flat fee* — ready-made guides and consultations (existing table by group size and trip length stays, relabelled).
   - *Graduated tiers* — bespoke journeys as Simple / Moderate / Complex bands (single destination, short trip → multi-destination, long, high-touch), each with a price band and a one-line example, so a visitor can self-locate before contacting you.
   - *Group & event pricing* — for groups, weddings and corporate trips: percentage of total trip value by group size, with a worked example.
5. **When a fee applies — and when it doesn't** — two honest columns:
   - Fee applies: multi-stop routes, complex logistics, groups, several proposal rounds, trip support while travelling.
   - No fee: a single hotel booking, an airport transfer, a one-off tour, a simple all-inclusive package.
   This builds trust fast and removes the "am I being charged for everything?" fear that stops new-advisor enquiries.
6. **What the fee pays for** — three value blocks (expertise & insider access, personal tailoring, hours of real work), with a concrete "a 10-day trip takes 15–20 hours" style breakdown of where the time goes.
7. **What happens next** — a short 4-step path: free consultation → written scope & fee quote → you approve → planning starts. Ends with the existing enquiry CTA.
8. **FAQ** (rebuilt) — do I pay for the trip on top of the fee, is the fee refundable, why a fee at all, do you earn commission too, what does the 7% service fee cover, do you charge for changes, what if I only need one booking.

## Technical notes

- All new copy goes through the existing i18n system: `src/i18n/locales/en.ts`, `no.ts`, `pt.ts`. Norwegian and Brazilian Portuguese are written natively, not machine-translated, with local currency framing (NOK / BRL).
- `src/components/voyage/Pricing.tsx` gains the founding-offer banner, the graduated-tier block, the group-percentage block, and the applies/doesn't-apply comparison. All prices continue to flow through the existing NOK-based `useActiveCurrency` / `formatFromNok` FX logic — no hardcoded currency strings.
- `src/pages/PricingPage.tsx` gains the "what the fee pays for", "what happens next" and rebuilt FAQ sections, plus FAQPage JSON-LD in `src/routes/{-$locale}/pricing.tsx` for search visibility.
- Styling reuses the existing parchment / ink / gold tokens and Cormorant + Montserrat pairing. No new design language.
- No database or backend changes. Nothing outside the pricing page, its components, the locale files and the pricing route is touched.

## Open inputs needed from you

To fill in real numbers rather than placeholders:

1. Founding-client offer — discount amount (e.g. 50% off the bespoke planning fee), who qualifies (first N clients / referrals / both), and the review date.
2. Bespoke graduated bands — your intended NOK ranges for Simple / Moderate / Complex.
3. Group & event percentages by group size, and whether you want this shown publicly or kept as "quoted individually".

If you'd rather not decide all of these now, I can build the sections with your current 6 000 NOK anchor and sensible bands drawn from the Fora guidance, and you adjust the numbers afterwards.
