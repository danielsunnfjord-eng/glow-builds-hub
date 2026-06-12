
ALTER TABLE public.catalog_itineraries
  ADD COLUMN IF NOT EXISTS experience_type text,
  ADD COLUMN IF NOT EXISTS season text;

CREATE TABLE IF NOT EXISTS public.customer_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination text NOT NULL,
  experience_type text,
  details text,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.customer_suggestions TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.customer_suggestions TO authenticated;
GRANT ALL ON public.customer_suggestions TO service_role;

ALTER TABLE public.customer_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a suggestion"
  ON public.customer_suggestions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(coalesce(destination, '')) BETWEEN 1 AND 200
    AND length(coalesce(email, '')) BETWEEN 3 AND 255
    AND length(coalesce(details, '')) <= 2000
    AND length(coalesce(experience_type, '')) <= 100
  );

CREATE POLICY "Staff can read suggestions"
  ON public.customer_suggestions FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update suggestions"
  ON public.customer_suggestions FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete suggestions"
  ON public.customer_suggestions FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));
