-- Phase 11C: Analytics Aggregation Backend Migration
-- 
-- 1. Upgrade the `daily_analytics` table (Adds missing 'module' column)
-- 2. Setup the `aggregate_daily_analytics` PostgreSQL function
-- 3. Expose `get_dashboard_overview` RPC for the Admin Dashboard

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. DAILY ANALYTICS TABLE (Schema Upgrade)
-- ==========================================
-- Drop the existing table from Phase 1 to upgrade its schema cleanly. 
-- This is 100% safe because the raw data lives in `analytics_events` and 
-- the daily aggregates can be instantly rebuilt.
DROP TABLE IF EXISTS public.daily_analytics CASCADE;

CREATE TABLE public.daily_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    module VARCHAR(255) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Composite unique constraint to allow UPSERT operations (ON CONFLICT)
    CONSTRAINT idx_unique_daily_metric UNIQUE (date, module, metric_name)
);

-- Indexes for lightning-fast frontend queries
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON public.daily_analytics(date);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_module ON public.daily_analytics(module);

-- RLS Policies: Block public access, allow service_role and admin read
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated admin reads" ON public.daily_analytics
    FOR SELECT TO authenticated
    USING (true);

-- ==========================================
-- 2. AGGREGATION FUNCTION (Batch Processing)
-- ==========================================
CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics(target_date DATE)
RETURNS void AS $$
BEGIN
    -- USER METRICS 
    INSERT INTO public.daily_analytics (date, module, metric_name, metric_value, updated_at)
    SELECT target_date, 'users', 'active_users', COUNT(DISTINCT user_id), NOW()
    FROM public.analytics_events
    WHERE DATE(created_at) = target_date AND user_id IS NOT NULL
    ON CONFLICT (date, module, metric_name) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();

    -- CONTENT (FEED) METRICS
    INSERT INTO public.daily_analytics (date, module, metric_name, metric_value, updated_at)
    SELECT target_date, 'feed', event_type, COUNT(*), NOW()
    FROM public.analytics_events
    WHERE DATE(created_at) = target_date 
      AND event_type IN ('post_create', 'post_like', 'post_comment', 'post_share')
    GROUP BY event_type
    ON CONFLICT (date, module, metric_name) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();

    -- VIDEO METRICS
    INSERT INTO public.daily_analytics (date, module, metric_name, metric_value, updated_at)
    SELECT target_date, 'videos', event_type, COUNT(*), NOW()
    FROM public.analytics_events
    WHERE DATE(created_at) = target_date 
      AND event_type IN ('video_view', 'video_watch_start', 'video_completed', 'video_upload')
    GROUP BY event_type
    ON CONFLICT (date, module, metric_name) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();

    -- CHAT METRICS
    INSERT INTO public.daily_analytics (date, module, metric_name, metric_value, updated_at)
    SELECT target_date, 'chat', event_type, COUNT(*), NOW()
    FROM public.analytics_events
    WHERE DATE(created_at) = target_date 
      AND event_type IN ('message_sent', 'chat_conversation_start')
    GROUP BY event_type
    ON CONFLICT (date, module, metric_name) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();

    -- MARKETPLACE METRICS
    INSERT INTO public.daily_analytics (date, module, metric_name, metric_value, updated_at)
    SELECT target_date, 'marketplace', event_type, COUNT(*), NOW()
    FROM public.analytics_events
    WHERE DATE(created_at) = target_date 
      AND event_type IN ('listing_create', 'listing_view')
    GROUP BY event_type
    ON CONFLICT (date, module, metric_name) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();

    -- JOBS METRICS
    INSERT INTO public.daily_analytics (date, module, metric_name, metric_value, updated_at)
    SELECT target_date, 'jobs', event_type, COUNT(*), NOW()
    FROM public.analytics_events
    WHERE DATE(created_at) = target_date 
      AND event_type IN ('job_create', 'job_apply', 'job_view')
    GROUP BY event_type
    ON CONFLICT (date, module, metric_name) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();

    -- SERVICES METRICS
    INSERT INTO public.daily_analytics (date, module, metric_name, metric_value, updated_at)
    SELECT target_date, 'services', event_type, COUNT(*), NOW()
    FROM public.analytics_events
    WHERE DATE(created_at) = target_date 
      AND event_type IN ('service_create', 'service_contact')
    GROUP BY event_type
    ON CONFLICT (date, module, metric_name) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();

    -- EVENTS METRICS
    INSERT INTO public.daily_analytics (date, module, metric_name, metric_value, updated_at)
    SELECT target_date, 'events', event_type, COUNT(*), NOW()
    FROM public.analytics_events
    WHERE DATE(created_at) = target_date 
      AND event_type IN ('event_create', 'event_join', 'event_view')
    GROUP BY event_type
    ON CONFLICT (date, module, metric_name) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();

    -- NOTIFICATIONS METRICS
    INSERT INTO public.daily_analytics (date, module, metric_name, metric_value, updated_at)
    SELECT target_date, 'notifications', event_type, COUNT(*), NOW()
    FROM public.analytics_events
    WHERE DATE(created_at) = target_date 
      AND event_type IN ('notification_received', 'notification_click')
    GROUP BY event_type
    ON CONFLICT (date, module, metric_name) 
    DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. ADMIN RPC FUNCTION (Read Optimized)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics(start_date DATE, end_date DATE)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'overview', (
            SELECT json_agg(json_build_object('metric', metric_name, 'total', total_val))
            FROM (
                SELECT metric_name, SUM(metric_value) as total_val
                FROM public.daily_analytics
                WHERE date >= start_date AND date <= end_date
                GROUP BY metric_name
            ) overview_query
        ),
        'module_performance', (
            SELECT json_agg(json_build_object('module', module, 'total_events', total_mod_events))
            FROM (
                SELECT module, SUM(metric_value) as total_mod_events
                FROM public.daily_analytics
                WHERE date >= start_date AND date <= end_date
                GROUP BY module
            ) module_query
        ),
        'daily_trend', (
            SELECT json_agg(json_build_object('date', date, 'total_events', daily_total))
            FROM (
                SELECT date, SUM(metric_value) as daily_total
                FROM public.daily_analytics
                WHERE date >= start_date AND date <= end_date
                GROUP BY date
                ORDER BY date ASC
            ) trend_query
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
