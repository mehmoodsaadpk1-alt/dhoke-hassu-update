-- Migration: Analytics Database Foundation Phase 1
-- Creates tables: analytics_events, daily_analytics, weekly_analytics, monthly_analytics, error_logs

-- 1. analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(255) NOT NULL,
  entity_type VARCHAR(255),
  entity_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. daily_analytics
CREATE TABLE IF NOT EXISTS public.daily_analytics (
  date DATE NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (date, metric_name)
);

-- 3. weekly_analytics
CREATE TABLE IF NOT EXISTS public.weekly_analytics (
  week_start DATE NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (week_start, metric_name)
);

-- 4. monthly_analytics
CREATE TABLE IF NOT EXISTS public.monthly_analytics (
  month_start DATE NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (month_start, metric_name)
);

-- 5. error_logs
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-performance queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);

-- Row Level Security (RLS)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_events
-- Only authenticated users may insert analytics events.
CREATE POLICY "Enable insert for authenticated users only" ON public.analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for error_logs
-- Only authenticated users may insert error logs (if logged in).
CREATE POLICY "Enable insert for authenticated users on error logs" ON public.error_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Note on SELECT policies:
-- Users must never read analytics tables. Therefore, no SELECT policies are created for authenticated/anon roles.
-- Only service_role or admin should read aggregated analytics.
-- In Supabase, the 'service_role' bypasses RLS by default.
