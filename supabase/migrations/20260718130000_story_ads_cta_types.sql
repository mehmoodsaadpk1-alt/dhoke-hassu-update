-- Add CTA type and value columns for flexible Story Ad redirects
ALTER TABLE public.story_ads 
ADD COLUMN IF NOT EXISTS cta_type TEXT DEFAULT 'Website',
ADD COLUMN IF NOT EXISTS cta_value TEXT;
