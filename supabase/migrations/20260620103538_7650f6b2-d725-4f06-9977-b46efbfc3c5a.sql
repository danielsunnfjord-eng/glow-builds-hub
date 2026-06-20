CREATE TABLE public.catalog_itinerary_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL REFERENCES public.catalog_itineraries(id) ON DELETE CASCADE,
  label text NOT NULL,
  draft jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX catalog_itinerary_snapshots_itinerary_idx ON public.catalog_itinerary_snapshots (itinerary_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_itinerary_snapshots TO authenticated;
GRANT ALL ON public.catalog_itinerary_snapshots TO service_role;
ALTER TABLE public.catalog_itinerary_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view catalog itinerary snapshots" ON public.catalog_itinerary_snapshots FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert catalog itinerary snapshots" ON public.catalog_itinerary_snapshots FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete catalog itinerary snapshots" ON public.catalog_itinerary_snapshots FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));