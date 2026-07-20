-- 1. Create Tables with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.video_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(video_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.video_saves (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(video_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.video_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL, -- Nullable to support anonymous visitors
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.video_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    parent_id uuid REFERENCES public.video_comments(id) ON DELETE CASCADE,
    content text NOT NULL,
    likes_count integer DEFAULT 0,
    is_deleted boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.video_comment_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id uuid NOT NULL REFERENCES public.video_comments(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    reaction text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(comment_id, user_id)
);

-- 2. Create Indexes safely
CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON public.video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON public.video_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_video_saves_video_id ON public.video_saves(video_id);
CREATE INDEX IF NOT EXISTS idx_video_saves_user_id ON public.video_saves(user_id);

CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON public.video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_created_at ON public.video_views(created_at);

CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON public.video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_parent_id ON public.video_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_created_at ON public.video_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_video_comment_reactions_comment_id ON public.video_comment_reactions(comment_id);

-- 3. Enable RLS
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comment_reactions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies (Dropping them first to ensure script is idempotent and safe to execute multiple times)

-- video_likes
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.video_likes;
CREATE POLICY "Likes are viewable by everyone" ON public.video_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like videos" ON public.video_likes;
CREATE POLICY "Users can like videos" ON public.video_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike videos" ON public.video_likes;
CREATE POLICY "Users can unlike videos" ON public.video_likes FOR DELETE USING (auth.uid() = user_id);

-- video_saves
DROP POLICY IF EXISTS "Users can see their own saves" ON public.video_saves;
CREATE POLICY "Users can see their own saves" ON public.video_saves FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save videos" ON public.video_saves;
CREATE POLICY "Users can save videos" ON public.video_saves FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave videos" ON public.video_saves;
CREATE POLICY "Users can unsave videos" ON public.video_saves FOR DELETE USING (auth.uid() = user_id);

-- video_views
DROP POLICY IF EXISTS "Views are insertable by everyone" ON public.video_views;
CREATE POLICY "Views are insertable by everyone" ON public.video_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read their own views" ON public.video_views;
CREATE POLICY "Users can read their own views" ON public.video_views FOR SELECT USING (auth.uid() = user_id);

-- video_comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.video_comments;
CREATE POLICY "Comments are viewable by everyone" ON public.video_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert comments" ON public.video_comments;
CREATE POLICY "Users can insert comments" ON public.video_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.video_comments;
CREATE POLICY "Users can update own comments" ON public.video_comments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.video_comments;
CREATE POLICY "Users can delete own comments" ON public.video_comments FOR DELETE USING (auth.uid() = user_id);

-- video_comment_reactions
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.video_comment_reactions;
CREATE POLICY "Reactions are viewable by everyone" ON public.video_comment_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can react" ON public.video_comment_reactions;
CREATE POLICY "Users can react" ON public.video_comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their reaction" ON public.video_comment_reactions;
CREATE POLICY "Users can update their reaction" ON public.video_comment_reactions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their reaction" ON public.video_comment_reactions;
CREATE POLICY "Users can delete their reaction" ON public.video_comment_reactions FOR DELETE USING (auth.uid() = user_id);
