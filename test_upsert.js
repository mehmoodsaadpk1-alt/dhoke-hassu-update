import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  const { data: users } = await supabase.from('profiles').select('socialLinks').limit(1);
  if (!users || users.length === 0) return console.log("No users found");
  
  const user = users[0];
  console.log("Type of socialLinks:", typeof user.socialLinks);
  console.log("socialLinks value:", user.socialLinks);
}

testFetch();
