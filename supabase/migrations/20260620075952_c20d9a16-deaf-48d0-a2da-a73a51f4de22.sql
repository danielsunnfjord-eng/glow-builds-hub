
ALTER TABLE public.catalog_itineraries
  ADD COLUMN IF NOT EXISTS gdrive_folder_id text,
  ADD COLUMN IF NOT EXISTS gdoc_id text,
  ADD COLUMN IF NOT EXISTS gdoc_url text,
  ADD COLUMN IF NOT EXISTS gdoc_last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS pdf_drive_file_id text;

CREATE TABLE IF NOT EXISTS public.drive_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drafts_folder_id text,
  published_folder_id text,
  root_folder_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.drive_settings TO authenticated;
GRANT ALL ON public.drive_settings TO service_role;
ALTER TABLE public.drive_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read drive settings"
  ON public.drive_settings FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update drive settings"
  ON public.drive_settings FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert drive settings"
  ON public.drive_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER update_drive_settings_updated_at
  BEFORE UPDATE ON public.drive_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
