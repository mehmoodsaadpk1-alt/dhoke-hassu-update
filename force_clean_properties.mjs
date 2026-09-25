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
  console.log("=== FORCE CLEANING ALL PROPERTIES ===");

  const { error: delPropsErr } = await supabase.from('properties').delete().neq('id', 'non_existent_id');
  if (delPropsErr) {
    console.error("Error deleting properties:", delPropsErr);
  } else {
    console.log("Deleted properties.");
  }

  const { count: propsAfter } = await supabase.from('properties').select('*', { count: 'exact', head: true });
  console.log(`Remaining properties count: ${propsAfter}`);
}

runCleanup();
