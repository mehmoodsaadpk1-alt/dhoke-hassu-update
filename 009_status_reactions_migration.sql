ALTER TABLE public.story_reactions ADD COLUMN IF NOT EXISTS receiver_id UUID;  
ALTER TABLE public.story_replies ADD COLUMN IF NOT EXISTS receiver_id UUID;  
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;  
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_replies; 
