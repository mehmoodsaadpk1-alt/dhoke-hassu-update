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

async function testFetch() {
  const res = await supabase.from('profiles').select('*').limit(1);
  console.log('Error:', res.error);
  if (res.data && res.data.length > 0) {
    console.log('Keys in profiles table:', Object.keys(res.data[0]));
    console.log('Row:', res.data[0]);
  }
}
testFetch();
