ALTER TABLE public.catalog_itineraries
  ADD COLUMN IF NOT EXISTS itinerary_content_en text,
  ADD COLUMN IF NOT EXISTS itinerary_content_pt text,
  ADD COLUMN IF NOT EXISTS itinerary_content_no text;