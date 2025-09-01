-- Create storage buckets for user uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('listings', 'listings', true);

-- Set up storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up storage policies for listing images
CREATE POLICY "Listing images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'listings');

CREATE POLICY "Users can upload listing images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own listing images" ON storage.objects
FOR UPDATE USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own listing images" ON storage.objects
FOR DELETE USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);
