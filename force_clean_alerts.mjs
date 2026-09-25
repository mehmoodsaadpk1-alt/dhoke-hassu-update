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
  console.log("=== CLEANING SPAM ALERTS ===");
  
  const { data: alerts, error: fetchErr } = await supabase.from('alerts').select('id, title');
  if (fetchErr) {
    console.error(fetchErr);
    return;
  }
  
  console.log(`Found ${alerts.length} records. Deleting them...`);
  
  const { error: delErr } = await supabase.from('alerts').delete().neq('id', 'non_existent_id');
  if (delErr) {
    console.error("Error deleting alerts:", delErr);
  } else {
    console.log("Deleted all alerts.");
  }

  const { count } = await supabase.from('alerts').select('*', { count: 'exact', head: true });
  console.log(`Remaining alerts count: ${count}`);
}

runCleanup();
