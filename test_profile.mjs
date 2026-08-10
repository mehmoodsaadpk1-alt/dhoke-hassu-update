import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', 'd18a0a9d-9096-4ea5-a8cc-ec5bab32574c').single();
  console.log("Anas Data:", data);
  console.log("Anas Error:", error);
}

check();
