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
  console.log("=== CLEANING EVENTS ===");
  
  const { data: events, error: fetchErr } = await supabase.from('events').select('id, title');
  if (fetchErr) {
    console.error(fetchErr);
    return;
  }
  
  console.log(`Found ${events.length} records. Deleting them...`);
  
  const { error: delErr } = await supabase.from('events').delete().neq('id', 'non_existent_id');
  if (delErr) {
    console.error("Error deleting events:", delErr);
  } else {
    console.log("Deleted all events.");
  }

  const { count } = await supabase.from('events').select('*', { count: 'exact', head: true });
  console.log(`Remaining events count: ${count}`);
}

runCleanup();
