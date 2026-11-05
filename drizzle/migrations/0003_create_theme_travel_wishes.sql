CREATE TABLE public.theme_travel_wishes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 name text NOT NULL,
 email text NOT NULL,
 wish text NOT NULL,
 locale text NOT NULL,
 consent boolean NOT NULL,
 consent_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.theme_travel_wishes TO authenticated;
GRANT ALL ON public.theme_travel_wishes TO service_role;
ALTER TABLE public.theme_travel_wishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read theme wishes" ON public.theme_travel_wishes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));