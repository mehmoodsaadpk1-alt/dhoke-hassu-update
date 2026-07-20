-- Enable realtime for story_views if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;

-- Ensure foreign keys exist for efficient joins (IF NOT EXISTS requires DO block in pg, but we'll try standard alter table)
DO 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_views_viewer_id_fkey') THEN
    ALTER TABLE public.story_views ADD CONSTRAINT story_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_reactions_reactor_id_fkey') THEN
    ALTER TABLE public.story_reactions ADD CONSTRAINT story_reactions_reactor_id_fkey FOREIGN KEY (reactor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_replies_sender_id_fkey') THEN
    ALTER TABLE public.story_replies ADD CONSTRAINT story_replies_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END ;
