-- 011_add_pc_login_requests.sql

-- 1. Create public status table
CREATE TABLE public.pc_login_requests (
    id UUID PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '2 minutes',
    device_info JSONB
);

-- 2. Create private secrets table
CREATE TABLE public.pc_login_secrets (
    request_id UUID PRIMARY KEY REFERENCES public.pc_login_requests(id) ON DELETE CASCADE,
    challenge_hash TEXT NOT NULL,
    approved_user_id UUID,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.pc_login_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pc_login_secrets ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- pc_login_requests: strict deny all for anon to prevent enumeration.
CREATE POLICY "Strict deny anon select" ON public.pc_login_requests FOR SELECT TO anon USING (false);
CREATE POLICY "Strict deny anon insert" ON public.pc_login_requests FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Strict deny anon update" ON public.pc_login_requests FOR UPDATE TO anon USING (false);
CREATE POLICY "Strict deny anon delete" ON public.pc_login_requests FOR DELETE TO anon USING (false);

-- pc_login_secrets: strict deny all
CREATE POLICY "Strict deny all" ON public.pc_login_secrets FOR ALL USING (false);

-- 4. Secure RPC to create a request
CREATE OR REPLACE FUNCTION public.create_pc_login_request(
    p_id UUID,
    p_challenge_hash TEXT,
    p_device_info JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.pc_login_requests (id, device_info)
    VALUES (p_id, p_device_info);
    
    INSERT INTO public.pc_login_secrets (request_id, challenge_hash)
    VALUES (p_id, p_challenge_hash);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_pc_login_request(UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_pc_login_request(UUID, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.create_pc_login_request(UUID, TEXT, JSONB) TO authenticated;

-- 5. Secure RPC to check status (Polling fallback since Realtime is restricted)
CREATE OR REPLACE FUNCTION public.check_pc_login_status(
    p_id UUID,
    p_challenge_hash TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT;
    v_stored_hash TEXT;
BEGIN
    -- Verify the hash matches before returning status
    SELECT challenge_hash INTO v_stored_hash
    FROM public.pc_login_secrets
    WHERE request_id = p_id;
    
    IF v_stored_hash IS NULL OR v_stored_hash != p_challenge_hash THEN
        RETURN 'invalid';
    END IF;
    
    SELECT status INTO v_status
    FROM public.pc_login_requests
    WHERE id = p_id;
    
    RETURN v_status;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_pc_login_status(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_pc_login_status(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_pc_login_status(UUID, TEXT) TO authenticated;

-- 6. RPC to simulate approval (For Phase 1 Testing Only)
CREATE OR REPLACE FUNCTION public.simulate_approve_pc_login(
    p_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.pc_login_requests
    SET status = 'approved'
    WHERE id = p_id AND status = 'pending';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.simulate_approve_pc_login(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.simulate_approve_pc_login(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.simulate_approve_pc_login(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.simulate_approve_pc_login(UUID) TO service_role;
