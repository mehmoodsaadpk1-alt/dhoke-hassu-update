-- Fix RLS policies for story_ads to align with the application's admin definition
-- Date: 2026-07-18

-- Drop the overly restrictive policy that was rejecting INSERTs
DROP POLICY IF EXISTS "Admins have full access to story ads" ON public.story_ads;

-- Create a robust policy that explicitly supports SELECT, INSERT, UPDATE, DELETE
-- by verifying admin claims in JWT or matching the frontend's admin criteria (email/name)
CREATE POLICY "Admins have full access to story ads" ON public.story_ads
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true OR
        auth.jwt() ->> 'email' ILIKE '%admin%' OR
        auth.jwt() ->> 'email' ILIKE '%moderator%' OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND (full_name ILIKE '%admin%' OR full_name ILIKE '%moderator%')
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'role' = 'admin' OR 
        (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true OR
        auth.jwt() ->> 'email' ILIKE '%admin%' OR
        auth.jwt() ->> 'email' ILIKE '%moderator%' OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND (full_name ILIKE '%admin%' OR full_name ILIKE '%moderator%')
        )
    );
