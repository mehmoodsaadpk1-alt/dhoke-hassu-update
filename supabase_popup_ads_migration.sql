-- Supabase Schema Migration: Premium Popup Ads
-- This script adds the missing columns to the existing public.ads table safely.

-- 1. Add 'format' column for Ad Format (Feed, Banner, Popup)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.ads ADD COLUMN format TEXT DEFAULT 'Feed';
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- 2. Add 'display_frequency' column for Popup frequency limiting
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.ads ADD COLUMN display_frequency INTEGER DEFAULT 20;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;

-- Note: The following fields are already handled by existing columns:
-- - popup_enabled -> Handled via format = 'Popup' and status = 'Active'
-- - priority -> Handled via existing 'priority' column
-- - phone_number -> Handled via existing 'advertiser_phone' column
-- - action_type -> Handled via existing 'cta_type' column
-- - action_url -> Handled via existing 'cta_link' column
-- - schedule_start -> Handled via existing 'start_date' column
-- - schedule_end -> Handled via existing 'end_date' column
