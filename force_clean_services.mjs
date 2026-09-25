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
  console.log("=== CLEANING SERVICES ===");
  
  const { data: services, error: fetchErr } = await supabase.from('services').select('*');
  if (fetchErr) {
    console.error(fetchErr);
    return;
  }
  
  console.log(`Found ${services.length} records. Deleting them...`);
  
  for (const s of services) {
    const { error: delErr } = await supabase.from('services').delete().eq('id', s.id);
    if (delErr) {
      console.error(`Error deleting service ${s.id}:`, delErr);
    } else {
      console.log(`Deleted service ${s.id}`);
    }
  }

  const { count } = await supabase.from('services').select('*', { count: 'exact', head: true });
  console.log(`Remaining services count: ${count}`);
}

runCleanup();
