import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runTests() {
  console.log("Starting DB tests...");

  // Test 1: Anonymous access
  const { data: anonData, error: anonError } = await supabase.from('admin_users').select('*');
  console.log("Anon Read admin_users error:", anonError?.message || anonError?.details || anonError?.code);

  const { data: anonRpcData, error: anonRpcError } = await supabase.rpc('is_admin');
  console.log("Anon is_admin() result:", anonRpcData, "error:", anonRpcError?.message || anonRpcError?.details || anonRpcError?.code);

  // Sign up a dummy user
  const email = `test_user_${Date.now()}@example.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123'
  });

  if (authError) {
    console.error("Auth error:", authError);
    return;
  }
  
  console.log("Logged in as new normal user:", authData.user.id);

  // Test 2: Auth user read admin_users
  const { data: authReadData, error: authReadError } = await supabase.from('admin_users').select('*');
  console.log("Auth Read admin_users error/data:", authReadError ? authReadError.message : authReadData.length + " rows (should be 0)");

  // Test 3: Auth user insert admin_users
  const { error: authInsertError } = await supabase.from('admin_users').insert([{ user_id: authData.user.id }]);
  console.log("Auth Insert admin_users error:", authInsertError ? authInsertError.message : "Success (BAD)");

  // Test 4: Auth user update admin_users
  const { error: authUpdateError } = await supabase.from('admin_users').update({ created_at: new Date().toISOString() }).eq('user_id', authData.user.id);
  console.log("Auth Update admin_users error:", authUpdateError ? authUpdateError.message : "Success (BAD)");

  // Test 5: Auth user is_admin()
  const { data: authRpcData, error: authRpcError } = await supabase.rpc('is_admin');
  console.log("Auth is_admin() result:", authRpcData, "error:", authRpcError?.message);

}

runTests().catch(console.error);
