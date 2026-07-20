import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function checkAnas() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', 'd18a0a9d-9096-4ea5-a8cc-ec5bab32574c')
    .single();

  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Anas Profile:");
  console.log(JSON.stringify(data, null, 2));
}

checkAnas();
