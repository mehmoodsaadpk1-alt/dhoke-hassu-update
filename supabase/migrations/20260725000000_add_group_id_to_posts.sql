-- Add group_id, area_id, and page_id to posts table if they don't exist
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS group_id TEXT REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS area_id TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS page_id TEXT;
