ALTER TABLE public.story_ads 
ADD COLUMN IF NOT EXISTS completions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS skips INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exits INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_ad_metric(ad_id UUID, metric_column TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF metric_column = 'impressions' THEN
        UPDATE public.story_ads SET impressions = impressions + 1 WHERE id = ad_id;
    ELSIF metric_column = 'clicks' THEN
        UPDATE public.story_ads SET clicks = clicks + 1 WHERE id = ad_id;
    ELSIF metric_column = 'completions' THEN
        UPDATE public.story_ads SET completions = completions + 1 WHERE id = ad_id;
    ELSIF metric_column = 'skips' THEN
        UPDATE public.story_ads SET skips = skips + 1 WHERE id = ad_id;
    ELSIF metric_column = 'exits' THEN
        UPDATE public.story_ads SET exits = exits + 1 WHERE id = ad_id;
    END IF;
END;
$$;
