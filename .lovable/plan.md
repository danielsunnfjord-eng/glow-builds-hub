## Why both EN and PT show up today

The catalogue card marks a language as "available" when both `title_xx` and `summary_xx` are populated. For the Lisboa itinerary, the admin filled the English slots with the Portuguese text (both `title_en` and `summary_en` contain PT copy), so the heuristic flags EN and PT.

There is no `primary_language` column on `catalog_itineraries` today. The editor's language selector (`state.language`) is client-only and never persisted.

## Fix

1. **Database** — add a `primary_language` column to `catalog_itineraries` (`text`, values `en` / `pt` / `no`, default `en`, not null). Backfill:
   - Lisboa row → `pt`
   - All other existing rows → `en`
   No RLS/grant changes (column follows table).

2. **Editor (`CatalogShopManager.tsx`)** — persist the chosen `state.language` into `primary_language` on save/create so it stays in sync with what the admin picks.

3. **Catalogue cards (`ItinerariesShop.tsx`)**
   - Add `primary_language` to the SELECT and interface.
   - Replace the availability heuristic with a single badge showing the primary language (label from i18n: EN → "English / Inglês / Engelsk", PT → "Portuguese / Português / Portugisisk", NO → "Norwegian / Norueguês / Norsk"). Fallback to `en` if null.
   - Keep the "Created" date as-is.

4. **i18n** — add `catalogue.language.en/pt/no` labels in `en.ts`, `pt.ts`, `no.ts`, and rename the card key to `catalogue.cardLanguage` (singular).

## Files touched

- New migration: `catalog_itineraries.primary_language`
- `src/integrations/supabase/types.ts` (regenerated automatically)
- `src/components/voyage/CatalogShopManager.tsx`
- `src/pages/ItinerariesShop.tsx`
- `src/i18n/locales/{en,pt,no}.ts`

## Result

The Lisboa card shows a single language badge: **Português** (or the localized name of Portuguese depending on the site language). Every future itinerary shows whichever language the admin selected in the editor.
