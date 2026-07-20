import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testOrSpace() {
  const query = 'Ali King';
  const res1 = await supabase.from('profiles').select('*').or(`full_name.ilike.%${query}%`);
  console.log('Without quotes error:', res1.error?.message);

  const res2 = await supabase.from('profiles').select('*').or(`full_name.ilike."%${query}%"`);
  console.log('With quotes error:', res2.error?.message);
}
testOrSpace().then(() => console.log('Done'));
