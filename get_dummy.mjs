import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function findDummy() {
  const { data, error } = await supabase.from('users').select('id, email, fullName').eq('id', '92c5e5f8-fa18-460e-89c7-a29fd183e8ee');
  console.log("Dummy User Details:", data, error);
}

findDummy().catch(console.error);
