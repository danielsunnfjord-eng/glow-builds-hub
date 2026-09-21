ALTER TABLE public.catalog_itineraries
  ADD COLUMN IF NOT EXISTS viator_widget_ref text,
  ADD COLUMN IF NOT EXISTS viator_partner_id text;