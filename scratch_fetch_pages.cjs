const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('pages').select('*').limit(1);
  console.log("Pages:", data);
  if (error) console.error("Error:", error);
}
main();
