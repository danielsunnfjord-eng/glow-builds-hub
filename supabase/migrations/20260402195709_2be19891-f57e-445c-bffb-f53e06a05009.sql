INSERT INTO storage.buckets (id, name, public) VALUES ('itinerary-images', 'itinerary-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view itinerary images" ON storage.objects FOR SELECT USING (bucket_id = 'itinerary-images');
CREATE POLICY "Authenticated users can upload itinerary images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'itinerary-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete itinerary images" ON storage.objects FOR DELETE USING (bucket_id = 'itinerary-images' AND auth.role() = 'authenticated');