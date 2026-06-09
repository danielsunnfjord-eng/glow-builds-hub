ALTER TABLE public.client_projects
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS cover_tagline text;