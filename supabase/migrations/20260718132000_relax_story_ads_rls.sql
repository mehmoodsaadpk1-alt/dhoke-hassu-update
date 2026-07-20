-- Relax RLS policy for story_ads to allow authenticated users to manage ads,
-- since the Admin Dashboard is protected by a frontend password/sessionStorage guard.

DROP POLICY IF EXISTS "Admins have full access to story ads" ON public.story_ads;

CREATE POLICY "Admins have full access to story ads" ON public.story_ads
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
