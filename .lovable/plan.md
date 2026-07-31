Recover the "What does your travel advisor do?" block from the old CuratedSection and place it back on the homepage after the About Daniel section.

## What we will build

1. Extract the advisor-value block into a new, focused component: `src/components/voyage/WhyAdvisor.tsx`.
   - Left card: "What does your travel advisor do?" using `curated.whatDoes`, `curated.whatDoesP1`, and `curated.whatDoesP2`.
   - Right stack: three perks using `curated.perk1Title/Desc`, `curated.perk2Title/Desc`, and `curated.perk3Title/Desc`.
   - Keeps the same dark-ink styling and gold accents as the original section.

2. Insert the new component into `src/pages/Index.tsx` immediately after `<MeetDaniel />` and before `<Reviews />`, so the homepage flow becomes:
   - Hero
   - DualPathCards
   - FeaturedItineraries
   - MeetDaniel
   - **WhyAdvisor (new)**
   - Reviews
   - PlanMyTrip
   - Footer

3. No translation changes are required — the existing `curated.*` keys are already present and localized in English, Portuguese, and Norwegian.

## Files to modify

- `src/components/voyage/WhyAdvisor.tsx` (new)
- `src/pages/Index.tsx` (add `<WhyAdvisor />` after `<MeetDaniel />`)

## Out of scope

- The full `CuratedSection.tsx` will be left untouched; it is currently not imported anywhere, but we will not delete it unless requested.
- No hero duplication, no pricing table, no "How it works" steps — only the advisor block and perks.