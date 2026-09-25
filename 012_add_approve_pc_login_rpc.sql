-- 012_add_approve_pc_login_rpc.sql

CREATE OR REPLACE FUNCTION public.approve_pc_login_request(
    p_request_id UUID,
    p_challenge_hash TEXT,
    p_user_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_stored_hash TEXT;
BEGIN
    -- Lock rows to prevent race conditions during atomic approval
    SELECT r.status, r.expires_at, s.challenge_hash
    INTO v_status, v_expires_at, v_stored_hash
    FROM public.pc_login_requests r
    JOIN public.pc_login_secrets s ON s.request_id = r.id
    WHERE r.id = p_request_id 
    FOR UPDATE OF r, s;

    -- Verify existence
    IF v_status IS NULL THEN
        RETURN 'not_found';
    END IF;

    -- Verify challenge hash securely
    IF v_stored_hash IS NULL OR v_stored_hash != p_challenge_hash THEN
        RETURN 'invalid_challenge';
    END IF;

    -- Verify expiration
    IF v_expires_at <= NOW() THEN
        RETURN 'expired';
    END IF;

    -- Verify status
    IF v_status = 'approved' THEN
        RETURN 'already_approved';
    ELSIF v_status = 'cancelled' THEN
        RETURN 'cancelled';
    ELSIF v_status != 'pending' THEN
        RETURN 'invalid_status';
    END IF;

    -- Atomically apply updates
    UPDATE public.pc_login_requests
    SET status = 'approved'
    WHERE id = p_request_id;

    UPDATE public.pc_login_secrets
    SET approved_user_id = p_user_id,
        approved_at = NOW()
    WHERE request_id = p_request_id;

    RETURN 'success';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_pc_login_request(UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_pc_login_request(UUID, TEXT, UUID) TO service_role;
