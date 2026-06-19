CREATE TABLE public.geocode_cache (
  query text PRIMARY KEY,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.geocode_cache TO service_role;
ALTER TABLE public.geocode_cache ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (edge functions) accesses this table.