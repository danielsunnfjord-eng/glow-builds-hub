
-- Add credit/caption for cover images on catalog itineraries and client projects
ALTER TABLE public.catalog_itineraries
  ADD COLUMN IF NOT EXISTS hero_image_credit text,
  ADD COLUMN IF NOT EXISTS hero_image_caption text;

ALTER TABLE public.client_projects
  ADD COLUMN IF NOT EXISTS hero_image_credit text,
  ADD COLUMN IF NOT EXISTS hero_image_caption text;

-- Note: hotel photo credit/caption stored inline in the existing `hotels` JSONB column
-- (each photo becomes { url, credit, caption }). No schema change needed for that.
-- Body-image credit/caption are stored inline in the markdown via the standard
-- markdown title attribute: ![caption](url "credit"). No schema change needed.
