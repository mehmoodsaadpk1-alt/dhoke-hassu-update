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

async function testTypes() {
  const textTest = await supabase.from('profiles').select('mobileNumber').eq('mobileNumber', 'test');
  console.log('mobileNumber text eq test error:', textTest.error);
}
testTypes().then(() => console.log('Done'));
