-- ============================================================================
-- DHOKE HASSU CONNECT - ACCOUNT DEMOGRAPHICS MIGRATION
-- 
-- Run this script in your Supabase SQL Editor to safely add the gender 
-- and date of birth columns to your profiles table, set constraints, 
-- and index join keys.
-- ============================================================================

-- 1. Upgrade Profiles Table with Demographics
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Prefer not to say';
UPDATE public.profiles SET gender = 'Prefer not to say' WHERE gender = 'Unknown' OR gender IS NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_gender_check_v2;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_gender_check_v2 CHECK (gender IN ('Male', 'Female', 'Prefer not to say'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 2. Upgrade Poll Votes Table (For Legacy Support)
ALTER TABLE public.poll_votes DROP CONSTRAINT IF EXISTS poll_votes_gender_check;
ALTER TABLE public.poll_votes ADD CONSTRAINT poll_votes_gender_check CHECK (gender IN ('Male', 'Female', 'Prefer not to say', 'Unknown') OR gender IS NULL);

-- 3. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON public.poll_votes(user_id);
