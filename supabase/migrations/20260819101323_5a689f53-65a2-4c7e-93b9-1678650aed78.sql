ALTER TABLE public.catalog_itineraries
  ADD COLUMN IF NOT EXISTS pdf_path_en text,
  ADD COLUMN IF NOT EXISTS pdf_path_pt text,
  ADD COLUMN IF NOT EXISTS pdf_path_no text,
  ADD COLUMN IF NOT EXISTS translation_status jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.catalog_itineraries
SET pdf_path_en = COALESCE(pdf_path_en, CASE WHEN primary_language = 'en' THEN pdf_path END),
    pdf_path_pt = COALESCE(pdf_path_pt, CASE WHEN primary_language = 'pt' THEN pdf_path END),
    pdf_path_no = COALESCE(pdf_path_no, CASE WHEN primary_language = 'no' THEN pdf_path END)
WHERE pdf_path IS NOT NULL;