require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testRPC() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: "SELECT 1;" });
  console.log("exec_sql:", data, error);
}
testRPC();
