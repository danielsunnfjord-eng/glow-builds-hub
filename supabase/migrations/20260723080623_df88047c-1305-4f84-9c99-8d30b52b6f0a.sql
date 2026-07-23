ALTER TABLE public.catalog_itineraries ADD COLUMN IF NOT EXISTS primary_language text NOT NULL DEFAULT 'en';
ALTER TABLE public.catalog_itineraries ADD CONSTRAINT catalog_itineraries_primary_language_check CHECK (primary_language IN ('en','pt','no'));
UPDATE public.catalog_itineraries SET primary_language = 'pt' WHERE slug = 'lisboa-para-brasileiros-de-primeira-viagem';