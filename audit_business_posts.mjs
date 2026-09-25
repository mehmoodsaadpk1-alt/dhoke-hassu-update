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

async function runAudit() {
  console.log("=== BUSINESS POSTS AUDIT ===");

  const { data: businesses, error } = await supabase.from('businesses').select('id, name, posts');
  if (error) {
    console.error("Error fetching businesses:", error);
    process.exit(1);
  }

  let totalPosts = 0;
  let businessIdsWithPosts = [];
  
  businesses.forEach(b => {
    if (b.posts && Array.isArray(b.posts) && b.posts.length > 0) {
      totalPosts += b.posts.length;
      businessIdsWithPosts.push(b.id);
    }
  });

  console.log(`Total Businesses: ${businesses.length}`);
  console.log(`Total Business Posts: ${totalPosts}`);
  console.log(`Businesses containing posts: ${businessIdsWithPosts.join(', ')}`);
  
  console.log("=== AUDIT COMPLETE ===");
}

runAudit();
