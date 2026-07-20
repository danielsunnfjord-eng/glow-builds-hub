CREATE TABLE public.traveler_personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  notes TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT traveler_personas_origin_destination_unique UNIQUE (origin, destination)
);

CREATE INDEX traveler_personas_lookup_idx ON public.traveler_personas (origin, destination) WHERE is_active = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.traveler_personas TO authenticated;
GRANT ALL ON public.traveler_personas TO service_role;

ALTER TABLE public.traveler_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active personas"
  ON public.traveler_personas
  FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert personas"
  ON public.traveler_personas
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update personas"
  ON public.traveler_personas
  FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete personas"
  ON public.traveler_personas
  FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_traveler_personas_updated_at
  BEFORE UPDATE ON public.traveler_personas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();