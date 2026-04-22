-- Shared itineraries: public, tokenised travel plans for the customer mobile app
CREATE TABLE public.shared_itineraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.client_projects(id) ON DELETE SET NULL,
  draft_id UUID REFERENCES public.itinerary_drafts(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  destination TEXT,
  trip_duration TEXT,
  start_date DATE,
  end_date DATE,
  group_size INTEGER NOT NULL DEFAULT 1,
  language TEXT NOT NULL DEFAULT 'en',
  cover_image_url TEXT,
  -- Markdown fallback (current PDF content)
  markdown_content TEXT NOT NULL DEFAULT '',
  -- Structured day-by-day data: [{ day: 1, date, title, location, items: [{ time, title, description, location, lat, lng, image_url, type }] }]
  days JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Practical info shown in the app
  practical_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_shared_itineraries_token ON public.shared_itineraries(share_token);
CREATE INDEX idx_shared_itineraries_user ON public.shared_itineraries(user_id);
CREATE INDEX idx_shared_itineraries_project ON public.shared_itineraries(project_id);

ALTER TABLE public.shared_itineraries ENABLE ROW LEVEL SECURITY;

-- Public can read published itineraries (they need the token to find them anyway)
CREATE POLICY "Anyone can view published shared itineraries"
ON public.shared_itineraries
FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- Only the owning advisor can manage them
CREATE POLICY "Advisors can create their own shared itineraries"
ON public.shared_itineraries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Advisors can update their own shared itineraries"
ON public.shared_itineraries
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Advisors can delete their own shared itineraries"
ON public.shared_itineraries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Reuse existing updated_at trigger pattern
CREATE OR REPLACE FUNCTION public.update_shared_itineraries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_shared_itineraries_updated_at
BEFORE UPDATE ON public.shared_itineraries
FOR EACH ROW
EXECUTE FUNCTION public.update_shared_itineraries_updated_at();

-- Public RPC to safely increment view count without exposing UPDATE rights
CREATE OR REPLACE FUNCTION public.increment_itinerary_view(_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shared_itineraries
  SET view_count = view_count + 1,
      last_viewed_at = now()
  WHERE share_token = _token AND is_published = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_itinerary_view(TEXT) TO anon, authenticated;