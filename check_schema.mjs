import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({path: './.env'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_columns', { table_name: 'posts' });
  console.log('RPC columns:', data);

  // If rpc doesn't work, just fetch one row and get keys
  const { data: row } = await supabase.from('posts').select('*').limit(1);
  if (row && row.length > 0) {
    console.log('Columns from row:', Object.keys(row[0]));
  }
}

check();
