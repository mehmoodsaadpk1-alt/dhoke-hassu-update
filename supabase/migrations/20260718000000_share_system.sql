-- Migration for Facebook-style Share System

-- Add Polymorphic Share Columns to `posts` table
ALTER TABLE IF EXISTS public.posts
ADD COLUMN IF NOT EXISTS shared_entity_type text,
ADD COLUMN IF NOT EXISTS shared_entity_id uuid,
ADD COLUMN IF NOT EXISTS shared_caption text,
ADD COLUMN IF NOT EXISTS shares integer DEFAULT 0;

-- Add `shares` count to all feed-relevant tables
ALTER TABLE IF EXISTS public.jobs ADD COLUMN IF NOT EXISTS shares integer DEFAULT 0;
ALTER TABLE IF EXISTS public.properties ADD COLUMN IF NOT EXISTS shares integer DEFAULT 0;
ALTER TABLE IF EXISTS public.marketplace_items ADD COLUMN IF NOT EXISTS shares integer DEFAULT 0;
ALTER TABLE IF EXISTS public.events ADD COLUMN IF NOT EXISTS shares integer DEFAULT 0;
ALTER TABLE IF EXISTS public.services ADD COLUMN IF NOT EXISTS shares integer DEFAULT 0;

-- Add share columns to stories
ALTER TABLE IF EXISTS public.stories
ADD COLUMN IF NOT EXISTS shared_entity_type text,
ADD COLUMN IF NOT EXISTS shared_entity_id uuid;
