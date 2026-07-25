import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path: './.env'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const payload = {
    user_id: '3957ab02-1ed5-4817-9b50-f96d1832110a',
    text_content: 'test',
  };
  const { data, error } = await supabase.from('posts').upsert(payload, { onConflict: 'id' }).select();
  console.log('Upsert result:', data, error);
}

check();
