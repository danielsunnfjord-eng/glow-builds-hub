-- Catalog itineraries
CREATE TABLE public.catalog_itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL,
  title_pt TEXT,
  title_no TEXT,
  summary_en TEXT NOT NULL DEFAULT '',
  summary_pt TEXT,
  summary_no TEXT,
  description_en TEXT NOT NULL DEFAULT '',
  description_pt TEXT,
  description_no TEXT,
  what_you_get_en TEXT NOT NULL DEFAULT '',
  what_you_get_pt TEXT,
  what_you_get_no TEXT,
  destination TEXT,
  duration TEXT,
  group_size_label TEXT,
  hero_image_url TEXT,
  gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  price_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_trip_budget TEXT,
  pdf_path TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published catalog itineraries"
  ON public.catalog_itineraries FOR SELECT
  USING (is_published = true);

CREATE POLICY "Staff can view all catalog itineraries"
  ON public.catalog_itineraries FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert catalog itineraries"
  ON public.catalog_itineraries FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update catalog itineraries"
  ON public.catalog_itineraries FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete catalog itineraries"
  ON public.catalog_itineraries FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER catalog_itineraries_updated_at
  BEFORE UPDATE ON public.catalog_itineraries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Purchases
CREATE TABLE public.catalog_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES public.catalog_itineraries(id) ON DELETE RESTRICT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  amount_total NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  stripe_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  download_token TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  download_expires_at TIMESTAMPTZ,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all purchases"
  ON public.catalog_purchases FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER catalog_purchases_updated_at
  BEFORE UPDATE ON public.catalog_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('catalog-pdfs', 'catalog-pdfs', false)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('catalog-images', 'catalog-images', true)
  ON CONFLICT (id) DO NOTHING;

-- catalog-images: public read, staff write
CREATE POLICY "Public can view catalog images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'catalog-images');

CREATE POLICY "Staff can upload catalog images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'catalog-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can update catalog images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'catalog-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete catalog images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'catalog-images' AND public.is_staff(auth.uid()));

-- catalog-pdfs: only staff can manage; downloads happen through edge function with service role
CREATE POLICY "Staff can manage catalog pdfs select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'catalog-pdfs' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can upload catalog pdfs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'catalog-pdfs' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can update catalog pdfs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'catalog-pdfs' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete catalog pdfs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'catalog-pdfs' AND public.is_staff(auth.uid()));

-- Public lookup of a purchase by download token (for success page)
CREATE OR REPLACE FUNCTION public.get_purchase_by_token(_token TEXT)
RETURNS TABLE (
  id UUID,
  itinerary_id UUID,
  itinerary_title TEXT,
  itinerary_slug TEXT,
  customer_email TEXT,
  status TEXT,
  amount_total NUMERIC,
  currency TEXT,
  download_expires_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.itinerary_id, c.title_en, c.slug, p.customer_email, p.status,
         p.amount_total, p.currency, p.download_expires_at
  FROM public.catalog_purchases p
  JOIN public.catalog_itineraries c ON c.id = p.itinerary_id
  WHERE p.download_token = _token;
$$;