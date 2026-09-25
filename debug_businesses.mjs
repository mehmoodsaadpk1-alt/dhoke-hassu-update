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

async function run() {
  const { data, error } = await supabase.from('businesses').select('*');
  if (error) console.error(error);
  
  let foundPosts = 0;
  data.forEach(b => {
    if (b.posts && b.posts.length > 0) {
      console.log(`Business ${b.id} has posts:`, JSON.stringify(b.posts, null, 2));
      foundPosts += b.posts.length;
    }
  });
  console.log('Total business posts found:', foundPosts);
}

run();
