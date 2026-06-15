CREATE TABLE public.project_itinerary_editor_drafts (
  project_id uuid PRIMARY KEY REFERENCES public.client_projects(id) ON DELETE CASCADE,
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_itinerary_editor_drafts TO authenticated;
GRANT ALL ON public.project_itinerary_editor_drafts TO service_role;

ALTER TABLE public.project_itinerary_editor_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view project itinerary editor drafts"
ON public.project_itinerary_editor_drafts
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert project itinerary editor drafts"
ON public.project_itinerary_editor_drafts
FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update project itinerary editor drafts"
ON public.project_itinerary_editor_drafts
FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete project itinerary editor drafts"
ON public.project_itinerary_editor_drafts
FOR DELETE
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE TRIGGER project_itinerary_editor_drafts_updated_at
BEFORE UPDATE ON public.project_itinerary_editor_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();