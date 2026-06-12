ALTER TABLE public.catalog_itineraries
  ADD COLUMN IF NOT EXISTS hotels jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS audit_report text,
  ADD COLUMN IF NOT EXISTS audited_at timestamptz;