# Improve the itinerary creator for both formats (day-by-day and practical guide)

## The problem today

The editor already has a "Day-by-day Itinerary" / "Practical Guide" toggle, and the AI generation uses it. But everything after generation still assumes a day-by-day trip:

- The chosen format is only kept in local editor state. It is not stored with the itinerary, so reopening an existing item always shows "Day-by-day Itinerary" again, and the AI metadata pass can be run in the wrong mode.
- The subpage builder section is hardcoded as "Day overview" with Day 1 / Day 2 style rows, even for a guide.
- The public subpage always prints the heading "Day-by-day overview" above those rows, so a practical guide shows themed sections under a day heading.
- There is no format-aware guidance in the form: duration, checklist and expectations labels read the same for both, so an admin filling in a guide gets itinerary-shaped prompts.

## What will change

### 1. Remember the format per itinerary
Store the selected format on the itinerary record so it survives save/reload, and drive both the editor and the public page from it. Existing itineraries default to day-by-day, so nothing currently published changes.

### 2. Format-aware editor
- The toggle moves to the top of the form (next to title/destination) since it now shapes the whole form, not just the Generate button.
- Day-by-day: keeps Duration, and the overview builder stays "Day-by-day overview" with rows auto-labelled Day 1..N.
- Practical guide: hides Duration, and the same builder becomes "Guide sections" with free-text section labels (Attractions, Getting around, Food, Safety...) and a suggested-section quick-add.
- Field help text, placeholders and the readiness checklist adapt to the format (a guide is not "missing duration").

### 3. Better AI-to-subpage flow
- The "auto metadata" pass is always sent the itinerary's saved format, so it never generates day rows for a guide or themed rows for an itinerary.
- After generation, the overview rows are validated against the content: day-by-day gets one row per day for the full duration; guide gets one row per themed section found in the body. A short warning appears in the editor when they don't match, with a one-click "regenerate overview".

### 4. Format-aware public subpage
- Section heading switches between "Day-by-day overview" and "What this guide covers", localized in EN / PT-BR / NO.
- Row labels render without the forced "Day N" framing when the item is a guide.
- The "Route map" and duration chips stay for itineraries; for guides they only render when actually filled in.

## Technical notes

- New nullable column `output_format text not null default 'itinerary'` on `catalog_itineraries` (constrained to `itinerary` | `guide`), included in the editor's select list, load mapper and save payload.
- `src/components/voyage/CatalogShopManager.tsx`: move the toggle, branch labels/validation, pass the persisted format to `runGenerate`, `runRegenerateSection` and `runAutoMetadata`.
- `src/pages/ItineraryShopDetail.tsx`: read `output_format` and branch the overview section heading and row rendering.
- New i18n keys in `src/i18n/locales/{en,no,pt}.ts` for the guide-mode headings and labels.
- The edge function already accepts `output_format`; no prompt changes are needed beyond passing the stored value.

## Out of scope

No changes to pricing, Stripe, PDF generation or the catalogue listing cards.
