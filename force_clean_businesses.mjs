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
  console.log("=== CLEANING SPAM BUSINESS RECORDS ===");
  
  const { data: businesses, error: fetchErr } = await supabase.from('businesses').select('id, name');
  if (fetchErr) {
    console.error(fetchErr);
    return;
  }
  
  // The records are clearly spam (e.g. sdafds, clickyasset)
  console.log(`Found ${businesses.length} records. Deleting them...`);
  
  const { error: delErr } = await supabase.from('businesses').delete().neq('id', 'non_existent_id');
  if (delErr) {
    console.error("Error deleting businesses:", delErr);
  } else {
    console.log("Deleted spam businesses.");
  }

  const { count } = await supabase.from('businesses').select('*', { count: 'exact', head: true });
  console.log(`Remaining businesses count: ${count}`);
}

runCleanup();
