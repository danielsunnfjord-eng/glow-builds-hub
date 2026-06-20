-- 1. Revoke anon read access on sensitive catalog columns
REVOKE SELECT (gdrive_folder_id, gdoc_id, gdoc_url, gdoc_last_synced_at, audit_report, audited_at)
  ON public.catalog_itineraries FROM anon;

-- Keep authenticated (staff) access on all columns — re-grant explicitly to be safe
GRANT SELECT ON public.catalog_itineraries TO authenticated;

-- 2. Geocode cache: service-role-only policy
CREATE POLICY "Service role manages geocode cache"
  ON public.geocode_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.geocode_cache TO service_role;