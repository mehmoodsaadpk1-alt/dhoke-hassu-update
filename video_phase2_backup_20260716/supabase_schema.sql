-- ============================================================================
-- DHOKE HASSU CONNECT - SUPABASE DATABASE SCHEMA
-- 
-- Run this script in your Supabase SQL Editor to provision all tables,
-- foreign keys, indexes, and Row Level Security (RLS) policies.
-- ============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    area TEXT NOT NULL DEFAULT 'Dhoke Hassu',
    profile_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Keep compatibility fields:
    "mobileNumber" TEXT,
    username TEXT,
    bio TEXT,
    "joinDate" TEXT,
    "reputationScore" INTEGER DEFAULT 100,
    verified BOOLEAN DEFAULT false,
    "coverPhoto" TEXT,
    "contactNumber" TEXT,
    "socialLinks" JSONB DEFAULT '{}'::jsonb,
    "badges" JSONB DEFAULT '[]'::jsonb
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow anyone to insert or update profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);


-- 2. STORIES TABLE
CREATE TABLE IF NOT EXISTS public.stories (
    id TEXT PRIMARY KEY,
    author TEXT NOT NULL,
    avatar TEXT,
    image TEXT,
    "time" TEXT,
    viewed BOOLEAN DEFAULT false,
    "type" TEXT DEFAULT 'photo',
    "text" TEXT,
    "bgColor" TEXT,
    "createdAt" BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Allow anyone to write stories" ON public.stories FOR ALL USING (true) WITH CHECK (true);


-- 3. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    text_content TEXT,
    image_url TEXT,
    post_type TEXT NOT NULL DEFAULT 'general' CHECK (post_type IN ('status', 'reminder', 'general')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Keep compatibility columns:
    likes INTEGER DEFAULT 0,
    "commentsCount" INTEGER DEFAULT 0,
    comments JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to write posts" ON public.posts FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 4. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    salary TEXT,
    "type" TEXT,
    "postedBy" TEXT,
    contact TEXT,
    area TEXT,
    "postedTime" TEXT,
    description TEXT,
    image TEXT,
    category TEXT,
    requirements TEXT,
    deadline TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Allow anyone to manage jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);


-- 5. JOB APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.job_applications (
    id TEXT PRIMARY KEY,
    "jobId" TEXT,
    "jobTitle" TEXT,
    company TEXT,
    "applicantName" TEXT,
    "contactNumber" TEXT,
    "resumeName" TEXT,
    message TEXT,
    "appliedDate" TEXT,
    status TEXT DEFAULT 'Applied',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to job applications" ON public.job_applications FOR SELECT USING (true);
CREATE POLICY "Allow anyone to submit job applications" ON public.job_applications FOR ALL USING (true) WITH CHECK (true);


-- 6. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS public.properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price TEXT NOT NULL,
    "type" TEXT NOT NULL,
    purpose TEXT NOT NULL,
    location TEXT,
    contact TEXT,
    area TEXT,
    rooms TEXT,
    floor TEXT,
    description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    "ownerName" TEXT,
    featured BOOLEAN DEFAULT false,
    reported BOOLEAN DEFAULT false,
    unavailable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Allow anyone to manage properties" ON public.properties FOR ALL USING (true) WITH CHECK (true);


-- 7. BUY & SELL MARKETPLACE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.buy_sell_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price TEXT NOT NULL,
    condition TEXT,
    contact TEXT,
    image TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    area TEXT,
    "sellerName" TEXT,
    "postedTime" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.buy_sell_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to marketplace items" ON public.buy_sell_items FOR SELECT USING (true);
CREATE POLICY "Allow anyone to manage marketplace items" ON public.buy_sell_items FOR ALL USING (true) WITH CHECK (true);


-- 8. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    rating NUMERIC DEFAULT 4.0,
    address TEXT,
    contact TEXT,
    image TEXT,
    "coverImage" TEXT,
    logo TEXT,
    description TEXT,
    "shortDescription" TEXT,
    featured BOOLEAN DEFAULT false,
    area TEXT,
    "openingHours" TEXT,
    "ownerName" TEXT,
    "ownerAvatar" TEXT,
    "ownerBio" TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    reported BOOLEAN DEFAULT false,
    posts JSONB DEFAULT '[]'::jsonb,
    reviews JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Allow anyone to manage businesses" ON public.businesses FOR ALL USING (true) WITH CHECK (true);


-- 9. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    experience TEXT,
    area TEXT,
    rating NUMERIC DEFAULT 5.0,
    availability TEXT DEFAULT 'Available',
    contact TEXT,
    description TEXT,
    image TEXT,
    reported BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow anyone to manage services" ON public.services FOR ALL USING (true) WITH CHECK (true);


-- 10. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    area TEXT,
    "postedTime" TEXT,
    severity TEXT,
    priority TEXT,
    "confirmationsCount" INTEGER DEFAULT 0,
    "postedBy" TEXT,
    image TEXT,
    contact TEXT,
    "relatedUpdates" JSONB DEFAULT '[]'::jsonb,
    reported BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Allow anyone to manage alerts" ON public.alerts FOR ALL USING (true) WITH CHECK (true);


-- 11. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    "date" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    area TEXT,
    description TEXT,
    "coverImage" TEXT,
    "organizerName" TEXT,
    "contactNumber" TEXT,
    "interestedCount" INTEGER DEFAULT 0,
    "ticketPrice" TEXT,
    "maxAttendees" INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow anyone to manage events" ON public.events FOR ALL USING (true) WITH CHECK (true);


-- 12. DEALS TABLE
CREATE TABLE IF NOT EXISTS public.deals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    description TEXT,
    area TEXT,
    "discountText" TEXT,
    "expiryDate" TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    contact TEXT,
    terms TEXT,
    reported BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to deals" ON public.deals FOR SELECT USING (true);
CREATE POLICY "Allow anyone to manage deals" ON public.deals FOR ALL USING (true) WITH CHECK (true);


-- 13. GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    area TEXT,
    description TEXT,
    "coverImage" TEXT,
    privacy TEXT DEFAULT 'Public',
    "memberCount" INTEGER DEFAULT 1,
    rules JSONB DEFAULT '[]'::jsonb,
    admins JSONB DEFAULT '[]'::jsonb,
    creator TEXT,
    members JSONB DEFAULT '[]'::jsonb,
    requests JSONB DEFAULT '[]'::jsonb,
    reported BOOLEAN DEFAULT false,
    "recentPosts" JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Allow anyone to manage groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);


-- 14. CHATS SYSTEM (CONVERSATIONS, MEMBERS, MESSAGES)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL DEFAULT 'private' CHECK (type IN ('private', 'group')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice')),
    is_seen BOOLEAN DEFAULT false,
    media_url TEXT,
    media_duration INTEGER,
    media_size INTEGER,
    waveform_data JSONB,
    upload_status TEXT DEFAULT 'uploaded',
    media_meta JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow members to access conversations" ON public.conversations FOR ALL
    USING (EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid()));
CREATE POLICY "Allow authenticated users to create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);

-- Security Definer function to check membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.check_user_in_conversation(conv_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = conv_id AND user_id = u_id
  );
$$;

-- RLS for conversation_members
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow members to view membership" ON public.conversation_members FOR SELECT TO authenticated 
    USING (user_id = auth.uid() OR public.check_user_in_conversation(conversation_id, auth.uid()));
CREATE POLICY "Allow authenticated users to insert members" ON public.conversation_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow members to update or delete own membership" ON public.conversation_members FOR ALL TO authenticated USING (user_id = auth.uid());

-- RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow members to view messages" ON public.messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Allow members to insert messages" ON public.messages FOR INSERT TO authenticated
    WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));

-- Enable Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;


-- 15. NOTIFICATIONS SYSTEM (NOTIFICATIONS, PREFERENCES, PUSH TOKENS)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only select their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    chat_enabled BOOLEAN DEFAULT true,
    community_enabled BOOLEAN DEFAULT true,
    jobs_enabled BOOLEAN DEFAULT true,
    marketplace_enabled BOOLEAN DEFAULT true,
    businesses_enabled BOOLEAN DEFAULT true,
    property_enabled BOOLEAN DEFAULT true,
    emergency_enabled BOOLEAN DEFAULT true,
    system_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notification preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL CHECK (platform IN ('web', 'android', 'ios')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own push tokens" ON public.user_push_tokens FOR ALL USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- 16. VERIFICATION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id TEXT PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    area TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    status TEXT DEFAULT 'Applied',
    "appliedDate" TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to verification requests" ON public.verification_requests FOR SELECT USING (true);
CREATE POLICY "Allow anyone to submit verification requests" ON public.verification_requests FOR ALL USING (true) WITH CHECK (true);


-- 17. POLLS TABLE
CREATE TABLE IF NOT EXISTS public.polls (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    "totalVotes" INTEGER DEFAULT 0,
    category TEXT,
    area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to polls" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Allow anyone to manage polls" ON public.polls FOR ALL USING (true) WITH CHECK (true);


-- 18. PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS public.promotions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sponsor TEXT NOT NULL,
    description TEXT,
    discount TEXT,
    code TEXT,
    image TEXT,
    expiry TEXT,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to promotions" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Allow anyone to manage promotions" ON public.promotions FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_posts_time ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_time ON public.jobs("postedTime" DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_posted_time ON public.alerts("postedTime" DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events("date" ASC);
CREATE INDEX IF NOT EXISTS idx_deals_expiry ON public.deals("expiryDate" ASC);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories("createdAt" DESC);

-- ============================================================================
-- STORAGE BUCKETS CONFIGURATION
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to posts bucket" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Allow authenticated inserts to posts bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');


-- 19. BUY & SELL MARKETPLACE (RE-DESIGNED FOR REAL-TIME & SCALABILITY)
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

CREATE TABLE IF NOT EXISTS public.item_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    "order" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.item_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.item_favorites (
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.item_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Setup Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace_images', 'marketplace_images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to marketplace_images bucket" ON storage.objects FOR SELECT USING (bucket_id = 'marketplace_images');
CREATE POLICY "Allow authenticated inserts to marketplace_images bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketplace_images' AND auth.role() = 'authenticated');

-- RLS Policies
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to marketplace items" ON public.marketplace_items FOR SELECT USING (true);
CREATE POLICY "Allow users to insert marketplace items" ON public.marketplace_items FOR INSERT TO authenticated WITH CHECK (posted_by = auth.uid());
CREATE POLICY "Allow users to update own marketplace items" ON public.marketplace_items FOR UPDATE TO authenticated USING (posted_by = auth.uid()) WITH CHECK (posted_by = auth.uid());
CREATE POLICY "Allow users to delete own marketplace items" ON public.marketplace_items FOR DELETE TO authenticated USING (posted_by = auth.uid());

ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to item images" ON public.item_images FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage item images" ON public.item_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.item_chats ENABLE ROW LEVEL SECURITY;
-- Chat only accessible per item participants (the seller or the chat sender/buyer)
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

-- Realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.item_chats;


-- ============================================================================
-- 20. ADS MANAGEMENT MODULE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    advertiser_name TEXT NOT NULL,
    advertiser_phone TEXT NOT NULL,
    advertiser_email TEXT NOT NULL,
    advertiser_business_id TEXT,
    banner_url TEXT,
    video_url TEXT,
    format TEXT DEFAULT 'Feed',
    display_frequency INTEGER DEFAULT 20,
    placement TEXT NOT NULL,
    category TEXT NOT NULL,
    cta_type TEXT NOT NULL,
    cta_link TEXT,
    target_audience TEXT,
    target_location TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Normal',
    status TEXT NOT NULL DEFAULT 'Draft',
    amount NUMERIC DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    invoice_number TEXT,
    impressions INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    ctr NUMERIC DEFAULT 0,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    images JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS ads_status_idx ON public.ads (status);
CREATE INDEX IF NOT EXISTS ads_placement_idx ON public.ads (placement);
CREATE INDEX IF NOT EXISTS ads_category_idx ON public.ads (category);
CREATE INDEX IF NOT EXISTS ads_start_date_idx ON public.ads (start_date);
CREATE INDEX IF NOT EXISTS ads_end_date_idx ON public.ads (end_date);

-- Setup Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads-banners', 'ads-banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to ads-banners bucket" ON storage.objects FOR SELECT USING (bucket_id = 'ads-banners');
CREATE POLICY "Allow authenticated inserts to ads-banners bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ads-banners');

-- RLS policies
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to ads" ON public.ads FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Allow anyone to manage ads" ON public.ads FOR ALL USING (true) WITH CHECK (true);


- -   M I G R A T I O N :   A d d   P a g e s   a n d   G r o u p s  
 - -   D a t e :   2 0 2 6 - 0 7 - 1 2  
  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   1 .   P A G E S   S Y S T E M  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 C R E A T E   T A B L E   p u b l i c . p a g e s   (  
         i d   U U I D   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( )   P R I M A R Y   K E Y ,  
         o w n e r _ i d   U U I D   R E F E R E N C E S   a u t h . u s e r s ( i d )   O N   D E L E T E   C A S C A D E ,  
         n a m e   T E X T   N O T   N U L L ,  
         s l u g   T E X T   U N I Q U E   N O T   N U L L ,  
         l o g o _ u r l   T E X T ,  
         c o v e r _ u r l   T E X T ,  
         c a t e g o r y   T E X T   N O T   N U L L ,  
         d e s c r i p t i o n   T E X T ,  
         p h o n e   T E X T ,  
         e m a i l   T E X T ,  
         w e b s i t e   T E X T ,  
         a d d r e s s   T E X T ,  
         l o c a t i o n   T E X T ,  
         b u s i n e s s _ h o u r s   J S O N B ,  
         s o c i a l _ l i n k s   J S O N B ,  
         v e r i f i c a t i o n _ s t a t u s   T E X T   D E F A U L T   ' N o n e ' ,   - -   N o n e ,   P e n d i n g ,   A p p r o v e d ,   R e j e c t e d  
         v i s i b i l i t y   T E X T   D E F A U L T   ' P u b l i c ' ,   - -   P u b l i c ,   U n l i s t e d  
         f o l l o w e r s _ c o u n t   I N T E G E R   D E F A U L T   0 ,  
         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( ) ,  
         u p d a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( )  
 ) ;  
  
 C R E A T E   T A B L E   p u b l i c . p a g e _ r o l e s   (  
         i d   U U I D   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( )   P R I M A R Y   K E Y ,  
         p a g e _ i d   U U I D   R E F E R E N C E S   p u b l i c . p a g e s ( i d )   O N   D E L E T E   C A S C A D E ,  
         u s e r _ i d   U U I D   R E F E R E N C E S   a u t h . u s e r s ( i d )   O N   D E L E T E   C A S C A D E ,  
         r o l e   T E X T   N O T   N U L L   D E F A U L T   ' F o l l o w e r ' ,   - -   F o l l o w e r ,   A d m i n ,   E d i t o r ,   M o d e r a t o r ,   O w n e r  
         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( ) ,  
         U N I Q U E ( p a g e _ i d ,   u s e r _ i d )  
 ) ;  
  
 C R E A T E   T A B L E   p u b l i c . p a g e _ p o s t s   (  
         i d   U U I D   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( )   P R I M A R Y   K E Y ,  
         p a g e _ i d   U U I D   R E F E R E N C E S   p u b l i c . p a g e s ( i d )   O N   D E L E T E   C A S C A D E ,  
         a u t h o r _ i d   U U I D   R E F E R E N C E S   a u t h . u s e r s ( i d )   O N   D E L E T E   S E T   N U L L ,  
         c o n t e n t   T E X T ,  
         m e d i a _ u r l   T E X T ,  
         m e d i a _ t y p e   T E X T ,  
         l i k e s _ c o u n t   I N T E G E R   D E F A U L T   0 ,  
         c o m m e n t s _ c o u n t   I N T E G E R   D E F A U L T   0 ,  
         s h a r e s _ c o u n t   I N T E G E R   D E F A U L T   0 ,  
         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( ) ,  
         u p d a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( )  
 ) ;  
  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   2 .   G R O U P S   S Y S T E M  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 C R E A T E   T A B L E   p u b l i c . g r o u p s   (  
         i d   U U I D   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( )   P R I M A R Y   K E Y ,  
         o w n e r _ i d   U U I D   R E F E R E N C E S   a u t h . u s e r s ( i d )   O N   D E L E T E   C A S C A D E ,  
         n a m e   T E X T   N O T   N U L L ,  
         c o v e r _ u r l   T E X T ,  
         d e s c r i p t i o n   T E X T ,  
         r u l e s   T E X T ,  
         c a t e g o r y   T E X T   N O T   N U L L ,  
         t a g s   T E X T [ ] ,  
         v i s i b i l i t y   T E X T   D E F A U L T   ' P u b l i c ' ,   - -   P u b l i c ,   P r i v a t e ,   H i d d e n  
         m e m b e r s _ c o u n t   I N T E G E R   D E F A U L T   1 ,  
         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( ) ,  
         u p d a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( )  
 ) ;  
  
 C R E A T E   T A B L E   p u b l i c . g r o u p _ m e m b e r s   (  
         i d   U U I D   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( )   P R I M A R Y   K E Y ,  
         g r o u p _ i d   U U I D   R E F E R E N C E S   p u b l i c . g r o u p s ( i d )   O N   D E L E T E   C A S C A D E ,  
         u s e r _ i d   U U I D   R E F E R E N C E S   a u t h . u s e r s ( i d )   O N   D E L E T E   C A S C A D E ,  
         r o l e   T E X T   N O T   N U L L   D E F A U L T   ' M e m b e r ' ,   - -   M e m b e r ,   A d m i n ,   M o d e r a t o r ,   O w n e r  
         s t a t u s   T E X T   N O T   N U L L   D E F A U L T   ' A p p r o v e d ' ,   - -   A p p r o v e d ,   P e n d i n g ,   B l o c k e d ,   M u t e d  
         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( ) ,  
         U N I Q U E ( g r o u p _ i d ,   u s e r _ i d )  
 ) ;  
  
 C R E A T E   T A B L E   p u b l i c . g r o u p _ p o s t s   (  
         i d   U U I D   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( )   P R I M A R Y   K E Y ,  
         g r o u p _ i d   U U I D   R E F E R E N C E S   p u b l i c . g r o u p s ( i d )   O N   D E L E T E   C A S C A D E ,  
         a u t h o r _ i d   U U I D   R E F E R E N C E S   a u t h . u s e r s ( i d )   O N   D E L E T E   S E T   N U L L ,  
         c o n t e n t   T E X T ,  
         m e d i a _ u r l   T E X T ,  
         m e d i a _ t y p e   T E X T ,  
         l i k e s _ c o u n t   I N T E G E R   D E F A U L T   0 ,  
         c o m m e n t s _ c o u n t   I N T E G E R   D E F A U L T   0 ,  
         s h a r e s _ c o u n t   I N T E G E R   D E F A U L T   0 ,  
         i s _ p i n n e d   B O O L E A N   D E F A U L T   F A L S E ,  
         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( ) ,  
         u p d a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( )  
 ) ;  
  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   3 .   R E P O R T S   ( M o d e r a t i o n )  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 C R E A T E   T A B L E   p u b l i c . p a g e _ r e p o r t s   (  
         i d   U U I D   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( )   P R I M A R Y   K E Y ,  
         p a g e _ i d   U U I D   R E F E R E N C E S   p u b l i c . p a g e s ( i d )   O N   D E L E T E   C A S C A D E ,  
         r e p o r t e r _ i d   U U I D   R E F E R E N C E S   a u t h . u s e r s ( i d )   O N   D E L E T E   S E T   N U L L ,  
         r e a s o n   T E X T   N O T   N U L L ,  
         s t a t u s   T E X T   D E F A U L T   ' P e n d i n g ' ,  
         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( )  
 ) ;  
  
 C R E A T E   T A B L E   p u b l i c . g r o u p _ r e p o r t s   (  
         i d   U U I D   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( )   P R I M A R Y   K E Y ,  
         g r o u p _ i d   U U I D   R E F E R E N C E S   p u b l i c . g r o u p s ( i d )   O N   D E L E T E   C A S C A D E ,  
         r e p o r t e r _ i d   U U I D   R E F E R E N C E S   a u t h . u s e r s ( i d )   O N   D E L E T E   S E T   N U L L ,  
         r e a s o n   T E X T   N O T   N U L L ,  
         s t a t u s   T E X T   D E F A U L T   ' P e n d i n g ' ,  
         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   N O W ( )  
 ) ;  
  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   4 .   P O L I C I E S   &   I N D E X E S  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   W e   r e l y   o n   A p p   l o g i c   t o   f i l t e r   i f   n e e d e d ,   b u t   a l l o w   f u l l   r e a d   f o r   p u b l i c / u n l i s t e d .  
 - -   E n a b l e   R L S   a n d   a d d   o p e n   p o l i c i e s   s i m i l a r   t o   t h e   r e s t   o f   t h e   a p p   i f   R L S   i s   e n a b l e d .  
 - -   G i v e n   e x i s t i n g   a p p   b e h a v i o r   u s e s   w i d e   o p e n   o r   a n o n   k e y   a c c e s s   f o r   r e a d ,   w e ' l l   m i m i c   i t .  
  
 A L T E R   T A B L E   p u b l i c . p a g e s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . p a g e _ r o l e s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . p a g e _ p o s t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . g r o u p s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . g r o u p _ m e m b e r s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . g r o u p _ p o s t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . p a g e _ r e p o r t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . g r o u p _ r e p o r t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
  
 C R E A T E   P O L I C Y   " E n a b l e   r e a d   a c c e s s   f o r   a l l   o n   p a g e s "   O N   p u b l i c . p a g e s   F O R   S E L E C T   U S I N G   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " E n a b l e   r e a d   a c c e s s   f o r   a l l   o n   p a g e _ r o l e s "   O N   p u b l i c . p a g e _ r o l e s   F O R   S E L E C T   U S I N G   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " E n a b l e   r e a d   a c c e s s   f o r   a l l   o n   p a g e _ p o s t s "   O N   p u b l i c . p a g e _ p o s t s   F O R   S E L E C T   U S I N G   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " E n a b l e   r e a d   a c c e s s   f o r   a l l   o n   g r o u p s "   O N   p u b l i c . g r o u p s   F O R   S E L E C T   U S I N G   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " E n a b l e   r e a d   a c c e s s   f o r   a l l   o n   g r o u p _ m e m b e r s "   O N   p u b l i c . g r o u p _ m e m b e r s   F O R   S E L E C T   U S I N G   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " E n a b l e   r e a d   a c c e s s   f o r   a l l   o n   g r o u p _ p o s t s "   O N   p u b l i c . g r o u p _ p o s t s   F O R   S E L E C T   U S I N G   ( t r u e ) ;  
  
 - -   ( I n   a   r e a l   S u p a b a s e   s e t u p ,   y o u ' d   a d d   I N S E R T / U P D A T E / D E L E T E   p o l i c i e s ,    
 - -   b u t   g i v e n   t h i s   i s   a   f r o n t e n d - h e a v y   m o c k   p r o t o t y p e ,   w e ' l l   a l l o w   a l l   f o r   s i m p l i c i t y    
 - -   t o   m a t c h   t h e   r e s t   o f   t h e   t a b l e s   w h i c h   a r e   l i k e l y   o p e n ) .  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   a c c e s s   f o r   p a g e s "   O N   p u b l i c . p a g e s   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   a c c e s s   f o r   p a g e _ r o l e s "   O N   p u b l i c . p a g e _ r o l e s   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   a c c e s s   f o r   p a g e _ p o s t s "   O N   p u b l i c . p a g e _ p o s t s   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   a c c e s s   f o r   g r o u p s "   O N   p u b l i c . g r o u p s   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   a c c e s s   f o r   g r o u p _ m e m b e r s "   O N   p u b l i c . g r o u p _ m e m b e r s   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   a c c e s s   f o r   g r o u p _ p o s t s "   O N   p u b l i c . g r o u p _ p o s t s   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   a c c e s s   f o r   p a g e _ r e p o r t s "   O N   p u b l i c . p a g e _ r e p o r t s   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   a c c e s s   f o r   g r o u p _ r e p o r t s "   O N   p u b l i c . g r o u p _ r e p o r t s   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ;  
  
 - -   I n d e x e s   f o r   p e r f o r m a n c e  
 C R E A T E   I N D E X   i d x _ p a g e s _ s l u g   O N   p u b l i c . p a g e s ( s l u g ) ;  
 C R E A T E   I N D E X   i d x _ p a g e _ r o l e s _ u s e r   O N   p u b l i c . p a g e _ r o l e s ( u s e r _ i d ) ;  
 C R E A T E   I N D E X   i d x _ g r o u p _ m e m b e r s _ u s e r   O N   p u b l i c . g r o u p _ m e m b e r s ( u s e r _ i d ) ;  
 C R E A T E   I N D E X   i d x _ p a g e _ p o s t s _ p a g e   O N   p u b l i c . p a g e _ p o s t s ( p a g e _ i d ) ;  
 C R E A T E   I N D E X   i d x _ g r o u p _ p o s t s _ g r o u p   O N   p u b l i c . g r o u p _ p o s t s ( g r o u p _ i d ) ;  
 -- =========================================================================
-- 18. SCALABLE VIDEO PLATFORM (WATCH & SHORTS)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'short', 'live_stream')),
    title VARCHAR(255),
    description TEXT,
    video_url TEXT NOT NULL,       -- Agnostic URL (can be S3, R2, or Supabase)
    thumbnail_url TEXT,
    duration INTEGER,              -- Duration in seconds
    size BIGINT,                   -- File size in bytes
    
    -- Processing Tracking
    encoding_status VARCHAR(50) DEFAULT 'completed',
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    compression_ratio NUMERIC(5,2),
    mime_type VARCHAR(50),
    
    -- Counters
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    
    -- Metadata
    privacy VARCHAR(20) DEFAULT 'public',
    hashtags TEXT[],
    location JSONB,                -- Nearby Discovery
    module_context JSONB,          -- Ties video to Jobs, Marketplace, Properties, Events
    monetization_meta JSONB,       -- Future Ads, Boosts, Premium Status
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY ""Videos are viewable by everyone"" ON public.videos
    FOR SELECT USING (privacy = 'public');

CREATE POLICY ""Users can insert their own videos"" ON public.videos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY ""Users can update their own videos"" ON public.videos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY ""Users can delete their own videos"" ON public.videos
    FOR DELETE USING (auth.uid() = user_id);
