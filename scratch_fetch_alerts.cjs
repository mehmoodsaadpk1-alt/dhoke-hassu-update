const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
  const result = await supabase
    .from('alerts')
    .select('*')
    .order('postedTime', { ascending: false });
  console.log("Fetch Alerts result:", JSON.stringify(result));
}

testFetch();
