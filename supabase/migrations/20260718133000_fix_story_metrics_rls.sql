-- Fix missing RLS policies for Story metrics

-- Enable RLS (Should already be enabled, but ensure it)
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;

-- 1. Policies for `story_views`
DROP POLICY IF EXISTS "Views are viewable by everyone" ON public.story_views;
CREATE POLICY "Views are viewable by everyone" ON public.story_views 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can log story views" ON public.story_views;
CREATE POLICY "Users can log story views" ON public.story_views 
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- 2. Policies for `story_reactions`
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.story_reactions;
CREATE POLICY "Reactions are viewable by everyone" ON public.story_reactions 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can react to stories" ON public.story_reactions;
CREATE POLICY "Users can react to stories" ON public.story_reactions 
    FOR INSERT WITH CHECK (auth.uid() = reactor_id);

DROP POLICY IF EXISTS "Users can update their reactions" ON public.story_reactions;
CREATE POLICY "Users can update their reactions" ON public.story_reactions 
    FOR UPDATE USING (auth.uid() = reactor_id);

DROP POLICY IF EXISTS "Users can remove their reactions" ON public.story_reactions;
CREATE POLICY "Users can remove their reactions" ON public.story_reactions 
    FOR DELETE USING (auth.uid() = reactor_id);

-- 3. Policies for `story_replies`
DROP POLICY IF EXISTS "Replies are viewable by everyone" ON public.story_replies;
CREATE POLICY "Replies are viewable by everyone" ON public.story_replies 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can reply to stories" ON public.story_replies;
CREATE POLICY "Users can reply to stories" ON public.story_replies 
    FOR INSERT WITH CHECK (auth.uid() = sender_id);
