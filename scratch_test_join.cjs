const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoin() {
  console.log("Fetching foreign keys for story_reactions...");
  // Attempt to query information_schema if RLS allows (unlikely via anon key, but we can try).
  const { data, error } = await supabase.rpc('get_foreign_keys', { table_name: 'story_reactions' });
  console.log("RPC get_foreign_keys:", data, error);

  const { data: d2, error: e2 } = await supabase.from('story_reactions').select('*').limit(1);
  console.log("Raw reaction:", d2, e2);
}

testJoin();
