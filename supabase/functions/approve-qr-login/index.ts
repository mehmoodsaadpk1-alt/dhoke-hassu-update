import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Validate Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'unauthenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }
    const token = authHeader.replace('Bearer ', '')

    // Create standard client to verify user
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'unauthenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // 3. Parse Request Payload
    const body = await req.json().catch(() => ({}))
    const requestId = body.requestId || body.request_id
    const rawChallenge = body.rawChallenge || body.raw_challenge

    if (!requestId || typeof requestId !== 'string' || !rawChallenge || typeof rawChallenge !== 'string') {
      return new Response(JSON.stringify({ error: 'malformed_request' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 4. Hash the raw challenge
    const encoder = new TextEncoder()
    const data = encoder.encode(rawChallenge)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const challengeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // 5. Use Service Role key for atomic database operation
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // 6. Call atomic RPC
    const { data: rpcResult, error: rpcError } = await adminClient.rpc('approve_pc_login_request', {
      p_request_id: requestId,
      p_challenge_hash: challengeHash,
      p_user_id: user.id
    })

    if (rpcError) {
      return new Response(JSON.stringify({ error: 'internal_error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // 7. Handle RPC Results safely
    switch (rpcResult) {
      case 'success':
        return new Response(JSON.stringify({ success: true, status: 'approved' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      case 'not_found':
        return new Response(JSON.stringify({ error: 'unknown_request' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        })
      case 'invalid_challenge':
        return new Response(JSON.stringify({ error: 'challenge_mismatch' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        })
      case 'expired':
        return new Response(JSON.stringify({ error: 'expired' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      case 'already_approved':
        return new Response(JSON.stringify({ error: 'already_used' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      case 'cancelled':
        return new Response(JSON.stringify({ error: 'cancelled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      case 'invalid_status':
        return new Response(JSON.stringify({ error: 'invalid_status' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      default:
        return new Response(JSON.stringify({ error: 'internal_error' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        })
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: 'malformed_request' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
