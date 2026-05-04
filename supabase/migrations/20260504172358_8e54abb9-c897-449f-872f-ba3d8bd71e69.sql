-- Restrict client_projects SELECT to owner only
DROP POLICY IF EXISTS "Authenticated users can view all projects" ON public.client_projects;
CREATE POLICY "Users can view their own projects"
ON public.client_projects FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Tighten itinerary-images storage policies to owner-scoped folder
DROP POLICY IF EXISTS "Authenticated users can delete itinerary images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload itinerary images" ON storage.objects;

CREATE POLICY "Users can upload their own itinerary images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'itinerary-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own itinerary images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'itinerary-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own itinerary images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'itinerary-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);