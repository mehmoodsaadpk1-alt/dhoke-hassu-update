-- 013_pc_login_consumption.sql

-- 1. Add consumed_at to track one-time consumption securely
ALTER TABLE public.pc_login_secrets 
ADD COLUMN consumed_at TIMESTAMP WITH TIME ZONE;

-- 2. Create the secure atomic consumption RPC
CREATE OR REPLACE FUNCTION public.consume_pc_login_request(
    p_request_id UUID,
    p_challenge_hash TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_stored_hash TEXT;
    v_approved_user_id UUID;
    v_consumed_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Lock rows atomically to prevent concurrent exchanges
    SELECT r.status, r.expires_at, s.challenge_hash, s.approved_user_id, s.consumed_at
    INTO v_status, v_expires_at, v_stored_hash, v_approved_user_id, v_consumed_at
    FROM public.pc_login_requests r
    JOIN public.pc_login_secrets s ON s.request_id = r.id
    WHERE r.id = p_request_id 
    FOR UPDATE OF r, s;

    -- Verify existence
    IF v_status IS NULL THEN
        RAISE EXCEPTION 'not_found';
    END IF;

    -- Verify challenge hash
    IF v_stored_hash IS NULL OR v_stored_hash != p_challenge_hash THEN
        RAISE EXCEPTION 'invalid_challenge';
    END IF;

    -- Verify status
    IF v_status != 'approved' THEN
        RAISE EXCEPTION 'invalid_status';
    END IF;

    -- Verify expiration
    IF v_expires_at <= NOW() THEN
        RAISE EXCEPTION 'expired';
    END IF;

    -- Verify it hasn't already been consumed
    IF v_consumed_at IS NOT NULL THEN
        RAISE EXCEPTION 'already_consumed';
    END IF;

    -- Atomically mark as consumed
    UPDATE public.pc_login_secrets
    SET consumed_at = NOW()
    WHERE request_id = p_request_id;

    -- Return the approved user ID securely to the Edge Function
    RETURN v_approved_user_id;
END;
$$;

-- Secure the RPC so anonymous users cannot call it to extract the user ID
REVOKE EXECUTE ON FUNCTION public.consume_pc_login_request(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consume_pc_login_request(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_pc_login_request(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_pc_login_request(UUID, TEXT) TO service_role;
