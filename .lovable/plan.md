# Add output-format toggle to the catalogue itinerary editor

## Goal
Add a segmented control to the catalogue itinerary editor that lets the admin choose between generating a **Day-by-day Itinerary** or a **Practical Guide**, then pass that choice to the AI generation edge function.

## Scope
Only the catalogue editor form (`src/components/voyage/CatalogShopManager.tsx`) and the `generate-catalog-itinerary` Supabase Edge Function (`supabase/functions/generate-catalog-itinerary/index.ts`).

## What will change

### Frontend — `CatalogShopManager.tsx`
1. Extend `EditorState` with `outputFormat: "itinerary" | "guide"` and set the default to `"itinerary"` in `blankEditor`.
2. Add a segmented control/toggle above the **Generate with AI** button in the Body content section with two options:
   - "Day-by-day Itinerary" → `"itinerary"`
   - "Practical Guide" → `"guide"`
3. Conditionally show the existing **Duration** field (the "e.g. 5 days" input) only when `outputFormat === "itinerary"`; hide it when `"guide"`.
4. Pass `outputFormat` in the request body of:
   - `runGenerate` → `callCatalogStream`
   - `runRegenerateSection`
   - `runAutoMetadata`

### Backend — `supabase/functions/generate-catalog-itinerary/index.ts`
1. Read `outputFormat` from the request body, defaulting to `"itinerary"`.
2. When `outputFormat === "guide"`:
   - Swap the system prompt to request a **practical travel guide** instead of a day-by-day itinerary.
   - The guide should cover destination logistics, transport, money, language basics, packing, etiquette, safety, seasonal advice, and curated recommendations — without `## Day N` structure.
   - Do not require or reference a day count/duration.
3. When `outputFormat === "itinerary"`, keep the existing day-by-day prompt and two-pass streaming logic unchanged.
4. In `mode === "metadata"`, adapt behavior for guide mode if needed (e.g., skip `subpage_day_overview` generation or replace it with guide-section overviews).

## Acceptance criteria
- [ ] Toggle appears above the Generate button and defaults to "Day-by-day Itinerary".
- [ ] Selecting "Practical Guide" hides the Duration field.
- [ ] Selecting "Day-by-day Itinerary" shows the Duration field.
- [ ] `outputFormat` is sent to the `generate-catalog-itinerary` edge function on every relevant generation call.
- [ ] Edge function produces different content structure based on the selected output format.
- [ ] Existing itinerary generation continues to work exactly as before when "Day-by-day Itinerary" is selected.
