-- Migration: Add logo_url and location to groups table
-- Date: 2026-07-12

ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;
