
ALTER TABLE public.route_maker_itineraries
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS price_eur numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS destination text,
  ADD COLUMN IF NOT EXISTS duration_label text,
  ADD COLUMN IF NOT EXISTS summary text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS route_maker_itineraries_slug_unique
  ON public.route_maker_itineraries (slug)
  WHERE slug IS NOT NULL;

-- Public can read published rows
DROP POLICY IF EXISTS "Public can view published route maker itineraries" ON public.route_maker_itineraries;
CREATE POLICY "Public can view published route maker itineraries"
  ON public.route_maker_itineraries
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

GRANT SELECT ON public.route_maker_itineraries TO anon;

-- View counter
CREATE OR REPLACE FUNCTION public.increment_route_maker_view(_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.route_maker_itineraries
  SET view_count = view_count + 1
  WHERE slug = _slug AND is_published = true;
END;
$$;
