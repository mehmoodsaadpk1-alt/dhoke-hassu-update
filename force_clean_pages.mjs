import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runCleanup() {
  console.log("=== CHECKING PAGES ===");
  
  const { data: pages, error: fetchErr } = await supabase.from('pages').select('*');
  if (fetchErr) {
    console.error(fetchErr);
    return;
  }
  
  console.log(`Found ${pages.length} records.`, pages);

  const { count } = await supabase.from('pages').select('*', { count: 'exact', head: true });
  console.log(`Remaining pages count: ${count}`);
}

runCleanup();
