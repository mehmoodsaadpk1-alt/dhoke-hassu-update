-- Migration: Ensure groups bucket exists and has correct RLS policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('groups', 'groups', true) 
ON CONFLICT (id) DO NOTHING;

-- Policy to allow anyone to read
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'groups' );

-- Policy to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'groups' AND auth.role() = 'authenticated' );

-- Policy to allow users to update their own files
CREATE POLICY "Users can update own files" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'groups' AND auth.uid() = owner );

-- Policy to allow users to delete their own files
CREATE POLICY "Users can delete own files" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'groups' AND auth.uid() = owner );
