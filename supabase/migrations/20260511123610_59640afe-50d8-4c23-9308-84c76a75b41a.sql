ALTER TABLE public.catalog_itineraries
DROP COLUMN IF EXISTS client_document_draft,
DROP COLUMN IF EXISTS client_document_language;

CREATE TABLE IF NOT EXISTS public.catalog_itinerary_drafts (
  itinerary_id uuid PRIMARY KEY REFERENCES public.catalog_itineraries(id) ON DELETE CASCADE,
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  language text NOT NULL DEFAULT 'en',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_itinerary_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view catalog itinerary drafts" ON public.catalog_itinerary_drafts;
DROP POLICY IF EXISTS "Staff can insert catalog itinerary drafts" ON public.catalog_itinerary_drafts;
DROP POLICY IF EXISTS "Staff can update catalog itinerary drafts" ON public.catalog_itinerary_drafts;
DROP POLICY IF EXISTS "Staff can delete catalog itinerary drafts" ON public.catalog_itinerary_drafts;

CREATE POLICY "Staff can view catalog itinerary drafts"
  ON public.catalog_itinerary_drafts FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert catalog itinerary drafts"
  ON public.catalog_itinerary_drafts FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update catalog itinerary drafts"
  ON public.catalog_itinerary_drafts FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete catalog itinerary drafts"
  ON public.catalog_itinerary_drafts FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS catalog_itinerary_drafts_updated_at ON public.catalog_itinerary_drafts;
CREATE TRIGGER catalog_itinerary_drafts_updated_at
  BEFORE UPDATE ON public.catalog_itinerary_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();