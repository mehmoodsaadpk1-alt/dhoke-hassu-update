-- 008_hashtags_and_mentions.sql

-- Create hashtags table
CREATE TABLE IF NOT EXISTS public.hashtags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag TEXT UNIQUE NOT NULL,
    count INTEGER DEFAULT 1,
    is_blocked BOOLEAN DEFAULT false,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

-- Policies for hashtags
CREATE POLICY "Hashtags are viewable by everyone" ON public.hashtags
    FOR SELECT USING (true);

CREATE POLICY "Users can insert hashtags" ON public.hashtags
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update hashtags" ON public.hashtags
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Function to safely upsert hashtags and increment counts
CREATE OR REPLACE FUNCTION upsert_hashtag(hashtag_text TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.hashtags (tag, count, last_used_at)
    VALUES (LOWER(hashtag_text), 1, NOW())
    ON CONFLICT (tag) DO UPDATE 
    SET count = public.hashtags.count + 1,
        last_used_at = NOW();
END;
$$;
