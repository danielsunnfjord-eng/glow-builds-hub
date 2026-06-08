
-- 1. Staff SELECT policy for client_projects
CREATE POLICY "Staff can view all client projects"
ON public.client_projects FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- 2. Drop overly-broad SELECT policies on public storage buckets to prevent listing.
-- Public buckets continue to serve files via their public URL without RLS.
DROP POLICY IF EXISTS "Anyone can view itinerary images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view catalog images" ON storage.objects;

-- 3. Set search_path on email queue helper functions and revoke EXECUTE from anon/authenticated.
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq, extensions;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq, extensions;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq, extensions;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq, extensions;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;

-- Also lock down sales counts helper (admin-only data) from anon/authenticated direct RPC.
REVOKE EXECUTE ON FUNCTION public.get_catalog_sales_counts() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_catalog_sales_counts() TO service_role;
