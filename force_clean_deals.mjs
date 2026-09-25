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
  console.log("=== CLEANING DEALS ===");
  
  const { data: deals, error: fetchErr } = await supabase.from('deals').select('id, title');
  if (fetchErr) {
    console.error(fetchErr);
    return;
  }
  
  console.log(`Found ${deals.length} records. Deleting them...`);
  
  const { error: delErr } = await supabase.from('deals').delete().neq('id', 'non_existent_id');
  if (delErr) {
    console.error("Error deleting deals:", delErr);
  } else {
    console.log("Deleted all deals.");
  }

  const { count } = await supabase.from('deals').select('*', { count: 'exact', head: true });
  console.log(`Remaining deals count: ${count}`);
}

runCleanup();
