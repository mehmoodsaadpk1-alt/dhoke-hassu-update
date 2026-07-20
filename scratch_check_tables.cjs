const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTables() {
  console.log("Checking polls...");
  const polls = await supabase.from('polls').select('*').order('created_at', { ascending: false });
  console.log("polls error:", polls.error ? polls.error.message : "None");

  console.log("Checking ads...");
  const ads = await supabase.from('ads').select('*').order('created_at', { ascending: false });
  console.log("ads error:", ads.error ? ads.error.message : "None");

  console.log("Checking profiles...");
  const profiles = await supabase.from('profiles').select('*');
  console.log("profiles error:", profiles.error ? profiles.error.message : "None");
}

checkTables();
