require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('stories').select('*').limit(1);
  if (data && data.length > 0) console.log(Object.keys(data[0]));
  else console.log("error", error);
}
test();
