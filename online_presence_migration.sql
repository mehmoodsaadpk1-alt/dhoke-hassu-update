-- Migration to add Online Presence tracking to Dhoke Hassu Connect

-- Add columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS online_privacy VARCHAR DEFAULT 'everyone';

-- We do not enforce strict constraints on online_privacy since it's handled by application logic,
-- but typically it will be 'everyone', 'followers', or 'nobody'.

-- Create a helper function to automatically reset offline users if they haven't sent a heartbeat.
-- A cron job or pg_cron could call this, but the application will primarily rely on the 
-- 'last_seen' timestamp to determine if someone is actually offline if their browser crashed.
-- The formula is: If now() - last_seen > 90 seconds, they are considered offline.

CREATE OR REPLACE FUNCTION public.get_user_online_status(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    u_is_online BOOLEAN;
    u_last_seen TIMESTAMPTZ;
BEGIN
    SELECT is_online, last_seen INTO u_is_online, u_last_seen
    FROM public.profiles
    WHERE user_id = target_user_id;
    
    -- If they are marked online but last seen was over 90 seconds ago, they are effectively offline.
    IF u_is_online AND EXTRACT(EPOCH FROM (NOW() - u_last_seen)) > 90 THEN
        RETURN FALSE;
    END IF;
    
    RETURN u_is_online;
END;
$$;
