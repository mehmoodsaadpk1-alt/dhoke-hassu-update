-- Migration: Add Video Upload Support
-- Add video_url column to public.posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Note: We are reusing the existing 'posts' bucket for video uploads.
-- If the bucket has size limits in its policies, they might need to be adjusted,
-- but typically Supabase storage policies do not restrict file sizes natively in SQL,
-- file size limits are configured in the Dashboard or via API.
