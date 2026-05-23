CREATE TABLE public.route_maker_itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled route',
  status TEXT NOT NULL DEFAULT 'draft',
  brief_text TEXT NOT NULL DEFAULT '',
  brief_analysis JSONB,
  route JSONB,
  days JSONB,
  experiences JSONB,
  accommodations JSONB,
  logistics JSONB,
  quality JSONB,
  sales_copy JSONB,
  seo JSONB,
  pdf_intro TEXT,
  packing JSONB,
  upsell TEXT,
  budget JSONB,
  route_approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.route_maker_itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view route maker itineraries"
  ON public.route_maker_itineraries FOR SELECT
  TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert route maker itineraries"
  ON public.route_maker_itineraries FOR INSERT
  TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Staff can update route maker itineraries"
  ON public.route_maker_itineraries FOR UPDATE
  TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete route maker itineraries"
  ON public.route_maker_itineraries FOR DELETE
  TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER set_route_maker_updated_at
  BEFORE UPDATE ON public.route_maker_itineraries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX route_maker_user_idx ON public.route_maker_itineraries(user_id, updated_at DESC);