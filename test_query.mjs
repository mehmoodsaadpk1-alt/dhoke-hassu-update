import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path: './.env'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, privacy, group_members(count)')
    .limit(1);
  console.log('Query result:', JSON.stringify({ data, error }, null, 2));
}

check();
