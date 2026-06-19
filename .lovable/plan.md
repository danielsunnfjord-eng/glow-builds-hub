## Itinerary Map Generator (Mapbox Static Images API)

Generate a clean, print-ready static map of every location mentioned across an itinerary's days, connected by a numbered route line, then embed it into the editor document and the exported PDF.

### 1. Secret

Add `MAPBOX_ACCESS_TOKEN` via the secret tool (backend only — never exposed to the browser). Used exclusively from an edge function.

### 2. Edge function: `generate-itinerary-map`

`supabase/functions/generate-itinerary-map/index.ts`

Input (POST JSON):
- `itineraryId` (uuid) — used to look up the itinerary and persist the map
- OR `stops`: `[{ day, order, title, location, lat?, lng? }]` for ad-hoc generation

Flow:
1. Validate input (Zod).
2. For each stop without coords, geocode via Mapbox Geocoding API (`/geocoding/v5/mapbox.places/{query}.json`), biased by destination context. Cache results in a new `geocode_cache` table (`query text pk`, `lat`, `lng`, `created_at`) to avoid repeat calls.
3. Build a Mapbox Static Images API URL using style `mapbox/light-v11`:
   - Numbered pin overlays: `pin-l-{n}+b8935a({lng},{lat})` per stop (Fjord & Waves sand/gold).
   - Route line overlay: encoded GeoJSON LineString through stops in day/order sequence, stroke `#1f3a5f` (Fjord), width 3.
   - `auto` bounding + `1280x1280@2x` for print-ready resolution.
4. Fetch the PNG server-side, upload to existing `itinerary-images` storage bucket at `maps/{itineraryId}-{hash}.png`, return the public URL + stop legend `[{n, title, location}]`.

### 3. Editor integration

In `ItineraryEditor.tsx` toolbar, add a "Generate route map" action that:
1. Parses current itinerary stops from the markdown (reuse `lib/itineraryParser.ts`).
2. Calls the edge function via `supabase.functions.invoke`.
3. Inserts a centered figure block into the document at cursor:
   ```html
   <figure class="fjw-route-map">
     <img src="{url}" alt="Route map" />
     <figcaption>Route overview — {n} stops</figcaption>
   </figure>
   ```
4. Persists with the rest of the document, so reopening and PDF export both show the same image (no regen needed).

### 4. PDF rendering

The PDF pipeline already serializes editor HTML — the `<figure class="fjw-route-map">` flows through unchanged. Add a small print CSS rule in `index.css` to keep the figure on one page (`break-inside: avoid`) and constrain width to the content area.

### 5. Caching / cost control

- `geocode_cache` table (public, service-role only, no anon/auth grants) avoids re-geocoding the same place.
- Map image stored once in storage; editor stores the URL, so regeneration is opt-in.

### Files to add / change

- new: `supabase/functions/generate-itinerary-map/index.ts`
- new migration: `geocode_cache` table + grants (service_role only) + RLS
- edit: `src/components/voyage/editor/Toolbar.tsx` — new button + handler
- edit: `src/components/voyage/ItineraryEditor.tsx` — wire handler, insert figure
- edit: `src/index.css` — `.fjw-route-map` styles for editor + print

### Out of scope

- Interactive Mapbox GL JS map (static image only, per request).
- Per-day mini-maps (existing `DayMap` keeps OSM/Leaflet).
- Editing the existing PDF design.

### Next step

After plan approval I will request the `MAPBOX_ACCESS_TOKEN` via the add_secret tool, then implement the function, table, and UI in one pass.
