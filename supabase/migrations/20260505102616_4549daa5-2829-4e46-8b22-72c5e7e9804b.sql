
-- 1. Tighten shared_itineraries: remove public read, expose sanitized data via RPC

DROP POLICY IF EXISTS "Anyone can view published shared itineraries" ON public.shared_itineraries;

CREATE POLICY "Owners can view their shared itineraries"
  ON public.shared_itineraries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Sanitized public accessor: returns only first name + non-PII trip data
CREATE OR REPLACE FUNCTION public.get_shared_itinerary(_token text)
RETURNS TABLE (
  id uuid,
  share_token text,
  client_first_name text,
  destination text,
  trip_duration text,
  start_date date,
  end_date date,
  group_size integer,
  language text,
  cover_image_url text,
  markdown_content text,
  days jsonb,
  practical_info jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.share_token,
    split_part(trim(s.client_name), ' ', 1) AS client_first_name,
    s.destination,
    s.trip_duration,
    s.start_date,
    s.end_date,
    s.group_size,
    s.language,
    s.cover_image_url,
    s.markdown_content,
    s.days,
    s.practical_info
  FROM public.shared_itineraries s
  WHERE s.share_token = _token
    AND s.is_published = true
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_itinerary(text) TO anon, authenticated;

-- 2. Make itineraries storage bucket private
UPDATE storage.buckets SET public = false WHERE id = 'itineraries';

-- Drop any permissive public read policies on itineraries bucket
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual ILIKE '%itineraries%' OR with_check ILIKE '%itineraries%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- Only owners (advisors) can manage their PDFs; first folder = user_id
CREATE POLICY "Advisors read own itinerary PDFs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'itineraries' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Advisors upload own itinerary PDFs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'itineraries' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Advisors update own itinerary PDFs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'itineraries' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Advisors delete own itinerary PDFs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'itineraries' AND auth.uid()::text = (storage.foldername(name))[1]);
