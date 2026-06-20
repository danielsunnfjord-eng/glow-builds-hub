ALTER TABLE public.catalog_itineraries
  ADD COLUMN IF NOT EXISTS stripe_product_id_sandbox text,
  ADD COLUMN IF NOT EXISTS stripe_product_id_live text,
  ADD COLUMN IF NOT EXISTS stripe_tax_code text NOT NULL DEFAULT 'txcd_10000000',
  ADD COLUMN IF NOT EXISTS stripe_synced_at timestamptz;