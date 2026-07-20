-- Migration: Add views and ctr columns to ads table
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ctr NUMERIC DEFAULT 0;
