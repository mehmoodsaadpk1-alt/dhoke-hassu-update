-- ============================================================================
-- DHOKE HASSU CONNECT - MARKETPLACE TABLES & STORAGE MIGRATION
-- 
-- Run this script in your Supabase SQL Editor to provision all tables,
-- foreign keys, indexes, and Row Level Security (RLS) policies for the
-- redesigned Real-time Marketplace.
-- ============================================================================

-- 1. Create Marketplace Items Table
CREATE TABLE IF NOT EXISTS public.marketplace_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC,
    "priceText" TEXT, -- e.g. "Negotiable", "Call for price"
    category TEXT NOT NULL,
    condition TEXT CHECK (condition IN ('New', 'Used', 'Fair')),
    location TEXT NOT NULL DEFAULT 'Dhoke Hassu',
    posted_by UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_sold BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0
);

-- 2. Create Item Images Table
CREATE TABLE IF NOT EXISTS public.item_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    "order" INTEGER DEFAULT 0
);

-- 3. Create Item Chats Table
CREATE TABLE IF NOT EXISTS public.item_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Item Favorites Table
CREATE TABLE IF NOT EXISTS public.item_favorites (
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, item_id)
);

-- 5. Create Item Reports Table
CREATE TABLE IF NOT EXISTS public.item_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Setup Storage Bucket for Marketplace Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace_images', 'marketplace_images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Marketplace tables
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to marketplace items" ON public.marketplace_items FOR SELECT USING (true);
CREATE POLICY "Allow users to insert marketplace items" ON public.marketplace_items FOR INSERT TO authenticated WITH CHECK (posted_by = auth.uid());
CREATE POLICY "Allow users to update own marketplace items" ON public.marketplace_items FOR UPDATE TO authenticated USING (posted_by = auth.uid()) WITH CHECK (posted_by = auth.uid());
CREATE POLICY "Allow users to delete own marketplace items" ON public.marketplace_items FOR DELETE TO authenticated USING (posted_by = auth.uid());

ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to item images" ON public.item_images FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage item images" ON public.item_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.item_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow participants to view chats" ON public.item_chats FOR SELECT TO authenticated
    USING (
        sender_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.marketplace_items 
            WHERE marketplace_items.id = item_chats.item_id AND marketplace_items.posted_by = auth.uid()
        )
    );
CREATE POLICY "Allow authenticated users to send chat messages" ON public.item_chats FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
    );

ALTER TABLE public.item_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view own favorites" ON public.item_favorites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Allow users to manage own favorites" ON public.item_favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.item_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to submit reports" ON public.item_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Allow admins to view reports" ON public.item_reports FOR SELECT TO authenticated USING (true);

-- Storage bucket security policy
CREATE POLICY "Allow public read access to marketplace_images bucket" ON storage.objects FOR SELECT USING (bucket_id = 'marketplace_images');
CREATE POLICY "Allow authenticated inserts to marketplace_images bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketplace_images' AND auth.role() = 'authenticated');
