
-- Add column for PDF path
ALTER TABLE public.client_projects ADD COLUMN itinerary_pdf_path TEXT;

-- Create storage bucket for itinerary PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('itineraries', 'itineraries', true);

-- Storage policies: users can manage files in their own folder
CREATE POLICY "Authenticated users can upload itineraries"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'itineraries' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can view itineraries"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'itineraries');

CREATE POLICY "Authenticated users can update itineraries"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'itineraries' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can delete itineraries"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'itineraries' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public read access for download links sent to clients
CREATE POLICY "Public can view itineraries"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'itineraries');
