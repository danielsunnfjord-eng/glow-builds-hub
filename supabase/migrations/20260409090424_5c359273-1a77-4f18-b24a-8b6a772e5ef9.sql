
CREATE TABLE public.trip_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  phone TEXT,
  destination TEXT,
  departure TEXT,
  group_size INTEGER NOT NULL DEFAULT 1,
  trip_duration TEXT,
  start_date DATE,
  end_date DATE,
  estimated_budget TEXT,
  notes TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a trip request (no auth required)
CREATE POLICY "Anyone can submit a trip request"
ON public.trip_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated users can view requests
CREATE POLICY "Authenticated users can view trip requests"
ON public.trip_requests
FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can update requests
CREATE POLICY "Authenticated users can update trip requests"
ON public.trip_requests
FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can delete requests
CREATE POLICY "Authenticated users can delete trip requests"
ON public.trip_requests
FOR DELETE
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_trip_requests_updated_at
BEFORE UPDATE ON public.trip_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
