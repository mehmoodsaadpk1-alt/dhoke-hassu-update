import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function checkAmal() {
  const { data, error } = await supabase
    .from('profiles')
    .select('socialLinks')
    .eq('user_id', 'a8c7dbab-b0be-457f-be9f-fc52a65d027b') // Amal
    .single();

  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Amal socialLinks type:", typeof data.socialLinks);
  console.log("Is object?", typeof data.socialLinks === 'object');
  console.log("Amal socialLinks.gender:", data.socialLinks?.gender);
}

checkAmal();
