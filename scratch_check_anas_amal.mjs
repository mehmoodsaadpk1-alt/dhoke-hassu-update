import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function checkUsers() {
  console.log("Fetching profiles for Anas and Amal...");
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .or('full_name.ilike.%anas%,full_name.ilike.%amal%');

  if (pErr) {
    console.error("Error fetching profiles:", pErr);
    return;
  }
  
  console.log(`Found ${profiles.length} profiles.`);
  for (const p of profiles) {
    console.log(`\n--- PROFILE: ${p.full_name} (${p.user_id}) ---`);
    console.log(JSON.stringify(p, null, 2));

    console.log("Fetching auth.users metadata for", p.user_id, "...");
    // Attempt to get user from admin api using service role key
    const { data: userData, error: uErr } = await supabase.auth.admin.getUserById(p.user_id);
    if (uErr) {
      console.log("Error fetching auth user:", uErr.message);
    } else {
      console.log("auth.users raw_user_meta_data:");
      console.log(JSON.stringify(userData.user.user_metadata, null, 2));
    }
  }
}

checkUsers();
