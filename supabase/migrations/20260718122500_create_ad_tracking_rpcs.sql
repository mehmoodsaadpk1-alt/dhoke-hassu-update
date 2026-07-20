DROP FUNCTION IF EXISTS public.increment_ad_metric(text, text);
DROP FUNCTION IF EXISTS public.increment_ad_metric(uuid, text);

CREATE OR REPLACE FUNCTION public.increment_story_ad_view(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.story_ads SET impressions = COALESCE(impressions, 0) + 1 WHERE id = ad_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_story_ad_click(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.story_ads SET clicks = COALESCE(clicks, 0) + 1 WHERE id = ad_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_story_ad_completion(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.story_ads SET completions = COALESCE(completions, 0) + 1 WHERE id = ad_id;
END;
$$;
