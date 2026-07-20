import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testSearch(searchQuery) {
  console.log(`\nTesting search for: ${searchQuery}`);
  const escapedQuery = searchQuery.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  // Test full_name
  console.log('\n--- Testing full_name ---');
  let res = await supabase.from('profiles').select('*').or(`full_name.ilike."%${escapedQuery}%"`);
  console.log('Error:', res.error?.message);
  console.log('Data length:', res.data?.length);

  // Test username
  console.log('\n--- Testing username ---');
  res = await supabase.from('profiles').select('*').or(`username.ilike."%${escapedQuery}%"`);
  console.log('Error:', res.error?.message);
  console.log('Data length:', res.data?.length);

  // Test mobileNumber
  console.log('\n--- Testing mobileNumber ---');
  res = await supabase.from('profiles').select('*').or(`mobileNumber.ilike."%${escapedQuery}%"`);
  console.log('Error:', res.error?.message);
  console.log('Data length:', res.data?.length);
  
  // Test contactNumber
  console.log('\n--- Testing contactNumber ---');
  res = await supabase.from('profiles').select('*').or(`contactNumber.ilike."%${escapedQuery}%"`);
  console.log('Error:', res.error?.message);
  console.log('Data length:', res.data?.length);

  // Test combined
  console.log('\n--- Testing combined .or() ---');
  res = await supabase.from('profiles').select('*').or(`full_name.ilike."%${escapedQuery}%",username.ilike."%${escapedQuery}%",mobileNumber.ilike."%${escapedQuery}%",contactNumber.ilike."%${escapedQuery}%"`);
  console.log('Error:', res.error?.message);
  console.log('Data length:', res.data?.length);
}

testSearch('maan').then(() => console.log('Done'));
