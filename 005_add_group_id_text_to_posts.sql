
-- Migration: Add group_id to posts table
-- Note: group_id is defined as TEXT to match the 'groups' table id column
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS group_id TEXT REFERENCES public.groups(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_posts_group_id ON public.posts(group_id);
NOTIFY pgrst, 'reload schema';

