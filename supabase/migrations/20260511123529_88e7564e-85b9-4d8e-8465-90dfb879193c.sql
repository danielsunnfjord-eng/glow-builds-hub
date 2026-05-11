ALTER TABLE public.catalog_itineraries
ADD COLUMN IF NOT EXISTS client_document_draft jsonb,
ADD COLUMN IF NOT EXISTS client_document_language text NOT NULL DEFAULT 'en';