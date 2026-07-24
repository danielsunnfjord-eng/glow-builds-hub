## Change

Two small edits, both frontend/i18n only.

### 1. Rename the label "Best season" → "Season"

Update the `shop.bestSeason` string in the three locale files:

- `src/i18n/locales/pt.ts`: `"Melhor época"` → `"Estação"`
- `src/i18n/locales/en.ts`: `"Best season"` → `"Season"`
- `src/i18n/locales/no.ts`: matching `"Sesong"`

(Key stays `bestSeason` so no other code needs to change.)

### 2. Join multiple seasons with a localized "and" instead of a comma

In `src/pages/ItineraryShopDetail.tsx` (around line 673), replace the hardcoded `.join(", ")` with a language-aware joiner:

- pt → `" e "`
- en → `" and "`
- no → `" og "`

Using two items → `"Primavera e Verão"`. Three+ items → `"A, B e C"` (Oxford-less, standard PT/EN style).

## Result

For the Paris itinerary (seasons: Spring + Summer) with site language PT, the box will read:

```
ESTAÇÃO
Primavera e Verão
```

No changes to database, edge functions, or the itinerary editor.
