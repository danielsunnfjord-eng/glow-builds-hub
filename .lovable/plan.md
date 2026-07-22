## Goal
Budget Estimator must return notes, category labels, and cover label in the itinerary's language (EN / pt-BR / NO), with matching default currency (USD / BRL / NOK).

## Changes

### 1. `supabase/functions/estimate-itinerary-budget/index.ts`
- Accept `language` and `currency` in the request body.
- Map language → language name for prompt (`en` → English, `pt` → Portuguese (Brazil), `no` → Norwegian).
- Map language → default currency when `currency` not provided (`en` → USD, `pt` → BRL, `no` → NOK; fallback EUR).
- Extend the SYSTEM prompt to instruct Claude to:
  - Return `currency` = chosen currency and price prices in that currency (not EUR).
  - Write all `note` fields, the top-level `notes` string, and `cover_label` fully in the target language.
  - Localize `cover_label` phrasing (e.g. "A partir de R$X por pessoa" / "Fra kr X per person" / "From $X per person").
- Keep the JSON shape identical.

### 2. `src/components/voyage/editor/BudgetEstimator.tsx`
- Add a `language?: string` prop.
- Pass `{ language, currency: mapped }` to `supabase.functions.invoke("estimate-itinerary-budget", ...)`.
- Default `displayCcy` from language when no `initialBudget` (pt→BRL, no→NOK, en→USD).
- Localize the auto `cover_label` fallback (`autoCoverLabel`) per language.
- Leave UI chrome (dialog labels, buttons) unchanged — this is admin-facing.

### 3. `src/components/voyage/CatalogShopManager.tsx`
- Pass the current editor `language` prop to `<BudgetEstimator language={language} />`.

## Notes for the user
- Existing saved budgets are not retranslated — regenerate to refresh notes in the new language.
- Only these three files are touched.
