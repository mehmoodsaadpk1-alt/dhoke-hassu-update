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
  console.log("=== CLEANING POSTS ===");
  
  const { data: items, error: fetchErr } = await supabase.from('posts').select('*');
  if (fetchErr) {
    console.error(fetchErr);
    return;
  }
  
  console.log(`Found ${items.length} records. Deleting them...`);
  
  let deleted = 0;
  for (const s of items) {
    const { error: delErr } = await supabase.from('posts').delete().eq('id', s.id);
    if (delErr) {
      console.error(`Error deleting post ${s.id}:`, delErr);
    } else {
      console.log(`Deleted post ${s.id}`);
      deleted++;
    }
  }

  console.log(`Deleted ${deleted} out of ${items.length} posts.`);
}

runCleanup();
