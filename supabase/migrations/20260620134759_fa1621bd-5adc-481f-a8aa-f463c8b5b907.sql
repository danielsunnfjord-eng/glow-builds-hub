ALTER TABLE public.catalog_itineraries
  ADD COLUMN IF NOT EXISTS subpage_highlights jsonb,
  ADD COLUMN IF NOT EXISTS subpage_checklist jsonb,
  ADD COLUMN IF NOT EXISTS subpage_day_overview jsonb,
  ADD COLUMN IF NOT EXISTS subpage_map_url text;