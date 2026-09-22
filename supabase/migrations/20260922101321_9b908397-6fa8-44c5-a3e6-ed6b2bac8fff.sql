DROP POLICY IF EXISTS "Anyone can submit a trip request" ON public.trip_requests;

CREATE POLICY "Public can submit a trip request"
ON public.trip_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND language IN ('en','pt','no')
  AND length(btrim(client_name)) BETWEEN 1 AND 120
  AND client_email ~* '^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$'
  AND length(client_email) <= 254
  AND (phone IS NULL OR length(phone) <= 40)
  AND (destination IS NULL OR length(destination) <= 200)
  AND (departure IS NULL OR length(departure) <= 200)
  AND (trip_duration IS NULL OR length(trip_duration) <= 100)
  AND (estimated_budget IS NULL OR length(estimated_budget) <= 100)
  AND (accommodation_type IS NULL OR length(accommodation_type) <= 100)
  AND (travel_pace IS NULL OR length(travel_pace) <= 100)
  AND (notes IS NULL OR length(notes) <= 5000)
  AND (mobility_notes IS NULL OR length(mobility_notes) <= 2000)
  AND (dietary_restrictions IS NULL OR length(dietary_restrictions) <= 2000)
  AND (must_have_experiences IS NULL OR length(must_have_experiences) <= 5000)
  AND group_size BETWEEN 1 AND 100
  AND adults BETWEEN 1 AND 100
  AND children_count BETWEEN 0 AND 50
  AND (interests IS NULL OR array_length(interests, 1) IS NULL OR array_length(interests, 1) <= 30)
  AND (children_ages IS NULL OR array_length(children_ages, 1) IS NULL OR array_length(children_ages, 1) <= 50)
  AND (start_date IS NULL OR start_date >= current_date - interval '1 day')
  AND (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);