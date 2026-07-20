const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
  const { data: bData, error: bErr } = await supabase.from('businesses').select('*').limit(1);
  console.log("Businesses columns in live DB:", bErr ? bErr.message : Object.keys(bData[0] || {}));

  const { data: sData, error: sErr } = await supabase.from('services').select('*').limit(1);
  console.log("Services columns in live DB:", sErr ? sErr.message : Object.keys(sData[0] || {}));
}

checkColumns();
