-- ==============================================================================
-- STORY MODULE UPGRADE MIGRATIONS
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- 1. Modify existing `stories` table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'photo',
ADD COLUMN IF NOT EXISTS media_urls TEXT[],
ADD COLUMN IF NOT EXISTS bg_music_url TEXT,
ADD COLUMN IF NOT EXISTS music_volume NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS privacy TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS custom_audience_ids UUID[],
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + interval '24 hour'),
ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stickers JSONB,
ADD COLUMN IF NOT EXISTS text_styles JSONB;

-- 2. Create `story_views`
CREATE TABLE IF NOT EXISTS public.story_views (
  story_id UUID NOT NULL,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (story_id, viewer_id)
);

-- 3. Create `story_reactions`
CREATE TABLE IF NOT EXISTS public.story_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  reactor_id UUID NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create `story_replies`
CREATE TABLE IF NOT EXISTS public.story_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  reply_type TEXT DEFAULT 'text',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create `story_highlights`
CREATE TABLE IF NOT EXISTS public.story_highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create `story_highlight_items`
CREATE TABLE IF NOT EXISTS public.story_highlight_items (
  highlight_id UUID NOT NULL REFERENCES public.story_highlights(id) ON DELETE CASCADE,
  story_id UUID NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (highlight_id, story_id)
);

-- 7. Create `story_ads`
CREATE TABLE IF NOT EXISTS public.story_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'photo',
  cta_link TEXT,
  cta_text TEXT,
  duration INT DEFAULT 5,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  target_audience JSONB,
  frequency_cap INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create `user_story_settings`
CREATE TABLE IF NOT EXISTS public.user_story_settings (
  user_id UUID PRIMARY KEY,
  auto_save_archive BOOLEAN DEFAULT true,
  allow_replies BOOLEAN DEFAULT true,
  allow_sharing BOOLEAN DEFAULT true,
  default_privacy TEXT DEFAULT 'public',
  quality TEXT DEFAULT 'High'
);

-- 9. Create `story_moderation`
CREATE TABLE IF NOT EXISTS public.story_moderation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set default for expires_at (already set above)
-- Backfill existing rows
UPDATE public.stories SET expires_at = created_at + interval '24 hour' WHERE expires_at IS NULL;

-- Add index on expires_at for performance
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories (expires_at);
