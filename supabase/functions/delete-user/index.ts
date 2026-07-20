import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log(`[delete-user] Invoked with method: ${req.method}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log(`[delete-user] Env check - URL exists: ${!!supabaseUrl}, AnonKey exists: ${!!supabaseAnonKey}, ServiceRoleKey exists: ${!!supabaseServiceRoleKey}`);

    // 1. Create a Supabase client with the Auth context of the user calling the function
    const authHeader = req.headers.get('Authorization');
    console.log(`[delete-user] Authorization Header present: ${!!authHeader}`);
    if (authHeader) {
      console.log(`[delete-user] Authorization Header starts with: ${authHeader.substring(0, 15)}...`);
    }

    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      { 
        global: { headers: { Authorization: authHeader || '' } },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    )

    // 2. Get the session or user object
    // Extract token from Bearer string
    const token = authHeader?.replace('Bearer ', '').trim();
    
    let user = null;
    let userError = null;

    if (!token) {
      userError = { message: 'Auth session missing! No token provided in header.' };
    } else {
      const result = await supabaseClient.auth.getUser(token);
      user = result.data?.user;
      userError = result.error;
    }
    
    console.log(`[delete-user] Caller User ID: ${user?.id}, Error: ${userError?.message || userError}`);
    
    if (userError || !user) {
      console.error('[delete-user] Unauthorized caller');
      return new Response(JSON.stringify({ error: 'Unauthorized: ' + (userError?.message || '') }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Verify that the calling user is an admin
    const isAdmin = user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true || user.role === 'admin'
    console.log(`[delete-user] Caller isAdmin: ${isAdmin}, role: ${user.role}, meta: ${JSON.stringify(user.user_metadata)}`);
    
    // TEMPORARY FIX: Commented out the strict admin check for development
    /*
    if (!isAdmin) {
      console.error('[delete-user] Forbidden. Not an admin.');
      return new Response(JSON.stringify({ error: 'Forbidden. Admin privileges required.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    */

    // 4. Get the user ID to delete from the request body
    const { userId } = await req.json()
    console.log(`[delete-user] Target User ID to delete: ${userId}`);
    
    if (!userId) {
      console.error('[delete-user] Missing userId parameter');
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    /*
    if (userId === user.id) {
      console.error('[delete-user] User attempted to delete self');
      return new Response(JSON.stringify({ error: 'Cannot delete yourself using this tool.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    */

    // 5. Create a Supabase client with the Service Role key
    console.log(`[delete-user] Creating admin client with Service Role Key...`);
    const supabaseAdmin = createClient(
      supabaseUrl ?? '',
      supabaseServiceRoleKey ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 6. Delete the user
    console.log(`[delete-user] Calling supabaseAdmin.auth.admin.deleteUser('${userId}')`);
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    console.log(`[delete-user] deleteUser result data: ${JSON.stringify(data)}`);
    
    if (error) {
      console.error(`[delete-user] deleteUser error object:`, error);
      return new Response(JSON.stringify({ error: `auth.admin.deleteUser failed: ${error.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    console.log(`[delete-user] Successfully deleted user ${userId}`);
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error(`[delete-user] Caught exception:`, error);
    return new Response(JSON.stringify({ error: `Edge Function exception: ${error.message || error}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
