# Rename "Design fee" to "Service fee" on the pricing page

## What I found

A full-text search across the codebase (all three locale files, components, pages, meta copy, JSON-LD) shows exactly **3 instances** of the term — one per language, all in the Custom Journey card's fee note:

- `src/i18n/locales/en.ts` — `pricing.card3.fee_note`: "Free consultation · Design fee*"
- `src/i18n/locales/no.ts` — `pricing.card3.fee_note`: "Gratis konsultasjon · Designavgift*"
- `src/i18n/locales/pt.ts` — `pricing.card3.fee_note`: "Consultoria gratuita · Taxa de criação*"

Two parts of the request have no matching text to change:

- **The refundability FAQ** ("Is the design fee really refundable?") no longer exists — it was removed when the FAQ section was replaced by the Consultation pricing table. The leftover unused `pricingPage.faq` keys refer to a "planning fee" / "planleggingshonorar" / "taxa de planejamento", not "design fee", so they need no edit.
- **The explainer body** under "Why do we charge a Custom Journey fee?" uses the generic "the fee" / "avgiften" / "a taxa" — no "design fee" wording to replace.

No instances exist in meta descriptions, image alt text, or JSON-LD structured data.

## Changes

Copy-only edits to the three locale files:

| File | Before | After |
|---|---|---|
| `src/i18n/locales/en.ts` | `Free consultation · Design fee*` | `Free consultation · Service fee*` |
| `src/i18n/locales/no.ts` | `Gratis konsultasjon · Designavgift*` | `Gratis konsultasjon · Tjenesteavgift*` |
| `src/i18n/locales/pt.ts` | `Consultoria gratuita · Taxa de criação*` | `Consultoria gratuita · Taxa de serviço*` |

Nothing else changes: prices, fee logic, the "Why do we charge a Custom Journey fee?" heading, and all other copy stay as-is.

## Verification

After editing, re-run the search for `design fee|designavgift|taxa de criação` across `src/` and `public/` to confirm zero remaining instances, then visually check the Custom Journey card on `/pricing`, `/no/pricing`, and `/pt-br/pricing`.
