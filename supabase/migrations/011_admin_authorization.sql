-- ============================================================================
-- 011_admin_authorization.sql
-- Description: Creates the secure backend admin role system for Dhoke Hassu Connect.
-- ============================================================================

-- 1. Create the admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Secure the table with Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Deny all access by default to ensure no normal user can read or modify the list.
-- The is_admin function will use SECURITY DEFINER to bypass this securely.
DROP POLICY IF EXISTS "Deny all access to admin_users" ON public.admin_users;
CREATE POLICY "Deny all access to admin_users" ON public.admin_users FOR ALL USING (false);

-- 3. Create the secure helper function
-- Must use SECURITY DEFINER to read the locked-down admin_users table.
-- Must set search_path = public for security.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Manage execution privileges
-- Revoke execute from public to prevent arbitrary unauthenticated calls
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
-- Grant execute only to authenticated users (or service role)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- Note: To manually add the first admin, run the following in the Supabase SQL editor:
-- INSERT INTO public.admin_users (user_id) VALUES ('YOUR-USER-UUID-HERE');
