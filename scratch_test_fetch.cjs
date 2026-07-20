const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  const { data: reactions, error } = await supabase.from('story_reactions').select('*').limit(5);
  if (error || !reactions) return console.log(error);

  const reactorIds = Array.from(new Set(reactions.map(r => r.reactor_id)));
  console.log("Reactor IDs:", reactorIds);

  const { data: profiles, error: pError } = await supabase.from('profiles').select('user_id, full_name, profile_photo').in('user_id', reactorIds);
  console.log("Profiles:", profiles, pError);
}
testFetch();
