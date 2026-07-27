ALTER TABLE public.catalog_itineraries
  ADD COLUMN IF NOT EXISTS price_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_brl numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_nok numeric NOT NULL DEFAULT 0;