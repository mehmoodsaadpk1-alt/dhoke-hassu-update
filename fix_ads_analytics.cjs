const fs = require('fs');

const sql = `
ALTER TABLE public.story_ads 
ADD COLUMN IF NOT EXISTS completions bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS skips bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS exits bigint DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_ad_metric(ad_id uuid, metric_column text)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmFzbGxucGJvanBmcnp0YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk5ODcsImV4cCI6MjA5ODMwNTk4N30.wWOUYD41MtJWSAZifBb7thJb3cSsh7fr4iXMsORVA4M';

fetch('https://gsbasllnpbojpfrztarv.supabase.co/rest/v1/rpc/exec_sql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': 'Bearer ' + key
  },
  body: JSON.stringify({ sql_query: sql })
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
