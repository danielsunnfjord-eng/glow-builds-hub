
ALTER TABLE public.catalog_itineraries
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_catalog_view(_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.catalog_itineraries
  SET view_count = view_count + 1
  WHERE slug = _slug AND is_published = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_catalog_sales_counts()
RETURNS TABLE(itinerary_id uuid, sales_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT itinerary_id, COUNT(*)::bigint AS sales_count
  FROM public.catalog_purchases
  WHERE status = 'paid'
  GROUP BY itinerary_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_catalog_view(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_catalog_sales_counts() TO anon, authenticated;
