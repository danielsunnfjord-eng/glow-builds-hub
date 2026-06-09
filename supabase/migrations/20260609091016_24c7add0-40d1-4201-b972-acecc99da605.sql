ALTER TABLE public.client_projects 
  ADD COLUMN IF NOT EXISTS itinerary_content text,
  ADD COLUMN IF NOT EXISTS internal_notes text;