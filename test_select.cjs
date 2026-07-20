require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testSelect() {
  const { data, error } = await supabase.from('story_views').select('*').limit(1);
  console.log("SELECT:", data, error);
}
testSelect();
