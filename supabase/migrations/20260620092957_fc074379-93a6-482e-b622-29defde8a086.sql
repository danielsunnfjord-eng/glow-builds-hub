ALTER TABLE public.catalog_itineraries
  ADD COLUMN IF NOT EXISTS cover_intro_en TEXT,
  ADD COLUMN IF NOT EXISTS cover_intro_pt TEXT,
  ADD COLUMN IF NOT EXISTS cover_intro_no TEXT;