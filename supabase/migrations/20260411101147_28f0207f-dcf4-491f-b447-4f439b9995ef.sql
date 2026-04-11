ALTER TABLE public.trip_requests
  ADD COLUMN adults integer NOT NULL DEFAULT 1,
  ADD COLUMN children_count integer NOT NULL DEFAULT 0,
  ADD COLUMN children_ages integer[] DEFAULT '{}';
