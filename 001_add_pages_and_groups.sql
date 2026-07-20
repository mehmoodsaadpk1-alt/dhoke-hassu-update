-- MIGRATION: Add Pages and Groups
-- Date: 2026-07-12

-- ==========================================
-- 1. PAGES SYSTEM
-- ==========================================

CREATE TABLE public.pages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    cover_url TEXT,
    category TEXT NOT NULL,
    description TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    location TEXT,
    business_hours JSONB,
    social_links JSONB,
    verification_status TEXT DEFAULT 'None', -- None, Pending, Approved, Rejected
    visibility TEXT DEFAULT 'Public', -- Public, Unlisted
    followers_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.page_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Follower', -- Follower, Admin, Editor, Moderator, Owner
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(page_id, user_id)
);

CREATE TABLE public.page_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT,
    media_url TEXT,
    media_type TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. GROUPS SYSTEM
-- ==========================================

CREATE TABLE public.groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cover_url TEXT,
    description TEXT,
    rules TEXT,
    category TEXT NOT NULL,
    tags TEXT[],
    visibility TEXT DEFAULT 'Public', -- Public, Private, Hidden
    members_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Member', -- Member, Admin, Moderator, Owner
    status TEXT NOT NULL DEFAULT 'Approved', -- Approved, Pending, Blocked, Muted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE TABLE public.group_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT,
    media_url TEXT,
    media_type TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. REPORTS (Moderation)
-- ==========================================

CREATE TABLE public.page_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.group_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. POLICIES & INDEXES
-- ==========================================
-- We rely on App logic to filter if needed, but allow full read for public/unlisted.
-- Enable RLS and add open policies similar to the rest of the app if RLS is enabled.
-- Given existing app behavior uses wide open or anon key access for read, we'll mimic it.

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all on pages" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Enable read access for all on page_roles" ON public.page_roles FOR SELECT USING (true);
CREATE POLICY "Enable read access for all on page_posts" ON public.page_posts FOR SELECT USING (true);
CREATE POLICY "Enable read access for all on groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Enable read access for all on group_members" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Enable read access for all on group_posts" ON public.group_posts FOR SELECT USING (true);

-- (In a real Supabase setup, you'd add INSERT/UPDATE/DELETE policies, 
-- but given this is a frontend-heavy mock prototype, we'll allow all for simplicity 
-- to match the rest of the tables which are likely open).
CREATE POLICY "Enable all access for pages" ON public.pages USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for page_roles" ON public.page_roles USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for page_posts" ON public.page_posts USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for groups" ON public.groups USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for group_members" ON public.group_members USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for group_posts" ON public.group_posts USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for page_reports" ON public.page_reports USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for group_reports" ON public.group_reports USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_pages_slug ON public.pages(slug);
CREATE INDEX idx_page_roles_user ON public.page_roles(user_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_page_posts_page ON public.page_posts(page_id);
CREATE INDEX idx_group_posts_group ON public.group_posts(group_id);
