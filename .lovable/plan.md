## Goal

Each catalog itinerary should display the price the admin actually set for the visitor's currency — not the EUR value (35) that was copied in as a placeholder.

## What's already in place

- The editor has four price inputs: EUR, USD, BRL, NOK.
- The public pages already pick the currency by language (PT → BRL, NO → NOK, EN → USD/EUR toggle) and read from the matching column.
- A backfill copied the EUR value into USD/BRL/NOK for every existing itinerary, which is why "35" shows up everywhere right now.

## What to change

1. **Stop the auto-fallback that hides missing prices.** Today the editor's save writes `price_usd = priceUsd || priceEur`, so a blank USD field silently becomes the EUR number. Change it so each currency column stores exactly what the admin typed (0 stays 0), so the admin can tell which prices are still unset.

2. **Warn in the editor when a currency price is missing or still equal to EUR.** Add a small inline hint under each non-EUR price input ("Placeholder — set the real BRL price") when the value is 0 or identical to `price_eur`. Non-blocking, just visible.

3. **Publish checklist gate.** Extend the existing "Price has been set" checklist item so an itinerary can't be published until USD, BRL, and NOK each have a non-zero value distinct from the EUR placeholder. This forces real per-currency prices before the itinerary goes live.

4. **No changes to the public pages.** `pricing.tsx`, `ItineraryShopDetail.tsx`, and `ItinerariesShop.tsx` already read the correct column per language — once real values are stored, they will show correctly.

## Technical notes

- File: `src/components/voyage/CatalogShopManager.tsx`
  - Remove the `|| Number(state.priceEur)` fallbacks in both save paths (initial insert around line 705, main save around line 1531).
  - Add the "placeholder" hint under each of the three non-EUR `<Input>` fields in the editor form (around lines 2027–2045).
  - Extend the `buildChecklist` "price" rule (line 1483) to require all four currencies > 0 and not equal to EUR (except EUR itself).
- No schema change, no migration, no edits to `pricing.tsx` or the public pages.

## Out of scope

- Automatic FX conversion (explicitly rejected — manual entry only).
- Changing checkout, which currency Stripe charges in, or the EN currency toggle behavior.