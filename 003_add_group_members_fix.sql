
-- SQL Fix for missing group_members table
-- The original 001_add_pages_and_groups.sql migration failed because it tried to redefine public.groups
-- and incorrectly used UUID for group_id instead of TEXT (as defined in supabase_schema.sql).

CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id TEXT REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Member',
    status TEXT NOT NULL DEFAULT 'Approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all on group_members" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Enable all access for group_members" ON public.group_members USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);

