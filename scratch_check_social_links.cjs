const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProfiles() {
  const { data, error } = await supabase.from('profiles').select('user_id, full_name, socialLinks');
  if (error) {
    console.error(error);
    return;
  }
  console.log("Profiles data:", JSON.stringify(data, null, 2));
}

checkProfiles();
