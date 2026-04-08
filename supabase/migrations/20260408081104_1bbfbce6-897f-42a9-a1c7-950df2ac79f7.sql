
CREATE TABLE public.itinerary_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.client_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Rascunho',
  content TEXT NOT NULL DEFAULT '',
  chat_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts"
ON public.itinerary_drafts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts"
ON public.itinerary_drafts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
ON public.itinerary_drafts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
ON public.itinerary_drafts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_itinerary_drafts_updated_at
BEFORE UPDATE ON public.itinerary_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
