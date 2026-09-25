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
  console.log("=== CLEANING GROUPS ===");
  
  const { data: groups, error: fetchErr } = await supabase.from('groups').select('*');
  if (fetchErr) {
    console.error(fetchErr);
    return;
  }
  
  console.log(`Found ${groups.length} records. Deleting them...`);
  
  for (const p of groups) {
    const { error: delErr } = await supabase.from('groups').delete().eq('id', p.id);
    if (delErr) {
      console.error(`Error deleting group ${p.id}:`, delErr);
    } else {
      console.log(`Deleted group ${p.id}`);
    }
  }

  const { count } = await supabase.from('groups').select('*', { count: 'exact', head: true });
  console.log(`Remaining groups count: ${count}`);
}

runCleanup();
