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
    // 2. Parse Request Payload
    const body = await req.json().catch(() => ({}))
    const requestId = body.requestId || body.request_id
    const rawChallenge = body.rawChallenge || body.raw_challenge

    if (!requestId || typeof requestId !== 'string' || !rawChallenge || typeof rawChallenge !== 'string') {
      return new Response(JSON.stringify({ error: 'malformed_request' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 3. Hash the raw challenge
    const encoder = new TextEncoder()
    const data = encoder.encode(rawChallenge)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const challengeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // 4. Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // 5. Call atomic consumption RPC
    const { data: approvedUserId, error: rpcError } = await adminClient.rpc('consume_pc_login_request', {
      p_request_id: requestId,
      p_challenge_hash: challengeHash
    })

    if (rpcError) {
      // Handle known RPC exceptions mapped by our PostgreSQL RAISE EXCEPTION
      const msg = rpcError.message;
      if (msg.includes('not_found')) {
        return new Response(JSON.stringify({ error: 'unknown_request' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 })
      }
      if (msg.includes('invalid_challenge')) {
        return new Response(JSON.stringify({ error: 'challenge_mismatch' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
      }
      if (msg.includes('expired')) {
        return new Response(JSON.stringify({ error: 'expired' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
      }
      if (msg.includes('already_consumed')) {
        return new Response(JSON.stringify({ error: 'already_used' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
      }
      if (msg.includes('invalid_status')) {
        return new Response(JSON.stringify({ error: 'invalid_status' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
      }
      
      return new Response(JSON.stringify({ error: 'internal_error' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    if (!approvedUserId) {
      return new Response(JSON.stringify({ error: 'internal_error' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    // 6. Fetch User to verify email exists
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(approvedUserId)
    
    if (userError || !userData || !userData.user) {
      return new Response(JSON.stringify({ error: 'user_not_found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    const userEmail = userData.user.email;
    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'pc_login_requires_email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 7. Generate Magic Link using Admin API
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail
    })

    if (linkError || !linkData || !linkData.properties || !linkData.properties.hashed_token) {
      return new Response(JSON.stringify({ error: 'failed_to_generate_token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // 8. Return strictly only the token hash needed by the PC
    return new Response(JSON.stringify({
      success: true,
      token_hash: linkData.properties.hashed_token
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: 'malformed_request' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
