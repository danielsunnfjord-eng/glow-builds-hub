ALTER TABLE public.catalog_itineraries
  ADD COLUMN IF NOT EXISTS output_format text NOT NULL DEFAULT 'itinerary';

ALTER TABLE public.catalog_itineraries
  DROP CONSTRAINT IF EXISTS catalog_itineraries_output_format_check;

ALTER TABLE public.catalog_itineraries
  ADD CONSTRAINT catalog_itineraries_output_format_check
  CHECK (output_format IN ('itinerary', 'guide'));