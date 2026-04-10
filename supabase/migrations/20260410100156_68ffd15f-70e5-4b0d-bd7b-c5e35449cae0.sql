
ALTER TABLE public.trip_requests
  ADD COLUMN interests text[] DEFAULT '{}',
  ADD COLUMN mobility_notes text,
  ADD COLUMN accommodation_type text,
  ADD COLUMN dietary_restrictions text,
  ADD COLUMN must_have_experiences text,
  ADD COLUMN travel_pace text,
  ADD COLUMN visited_before boolean DEFAULT false;
