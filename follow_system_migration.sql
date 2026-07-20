-- Dhoke Hassu Connect: Modern Follow System Migration

-- 1. Add privacy and count columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS privacy_type text DEFAULT 'public' CHECK (privacy_type IN ('public', 'private')),
ADD COLUMN IF NOT EXISTS message_privacy text DEFAULT 'everyone' CHECK (message_privacy IN ('everyone', 'followers', 'nobody')),
ADD COLUMN IF NOT EXISTS story_privacy text DEFAULT 'everyone' CHECK (story_privacy IN ('everyone', 'followers', 'close_friends', 'only_me')),
ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;

-- 2. Create Followers Table
CREATE TABLE IF NOT EXISTS public.followers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    following_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'following')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Prevent duplicate follow records
    CONSTRAINT unique_follower_following UNIQUE (follower_id, following_id),
    -- Prevent self-following
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_status ON public.followers(status);

-- 3. Create User Blocks Table
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    blocked_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON public.user_blocks(blocked_id);

-- 4. Enable Row Level Security
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Followers
-- Anyone can view approved follows if they are involved or if it's public (simplified: authenticated users can read all)
CREATE POLICY "Users can view follows" ON public.followers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert their own follow requests
CREATE POLICY "Users can create their own follow requests" ON public.followers
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can update requests sent to them (accept/reject)
CREATE POLICY "Users can update requests sent to them" ON public.followers
    FOR UPDATE USING (auth.uid() = following_id);

-- Users can delete their own follows (unfollow) or remove followers
CREATE POLICY "Users can delete follows" ON public.followers
    FOR DELETE USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- 6. RLS Policies for User Blocks
CREATE POLICY "Users can view their own blocks" ON public.user_blocks
    FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can block others" ON public.user_blocks
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others" ON public.user_blocks
    FOR DELETE USING (auth.uid() = blocker_id);

-- 7. Sync Functions & Triggers for Follower Counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'following' THEN
        UPDATE public.profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
        UPDATE public.profiles SET followers_count = followers_count + 1 WHERE user_id = NEW.following_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'requested' AND NEW.status = 'following' THEN
        UPDATE public.profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
        UPDATE public.profiles SET followers_count = followers_count + 1 WHERE user_id = NEW.following_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'following' THEN
        UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE user_id = OLD.follower_id;
        UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE user_id = OLD.following_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_follower_counts ON public.followers;
CREATE TRIGGER trg_update_follower_counts
AFTER INSERT OR UPDATE OR DELETE ON public.followers
FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- 8. Trigger to remove follows when a user is blocked
CREATE OR REPLACE FUNCTION remove_follows_on_block()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.followers 
    WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
       OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_remove_follows_on_block ON public.user_blocks;
CREATE TRIGGER trg_remove_follows_on_block
AFTER INSERT ON public.user_blocks
FOR EACH ROW EXECUTE FUNCTION remove_follows_on_block();
