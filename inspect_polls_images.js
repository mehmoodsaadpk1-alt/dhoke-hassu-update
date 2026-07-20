import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPolls() {
  console.log("Fetching polls from database...");
  const { data, error } = await supabase.from('polls').select('*');
  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${data.length} polls:`);
  data.forEach((p, idx) => {
    console.log(`\n--- Poll #${idx + 1} ---`);
    console.log("ID:", p.id);
    console.log("Question:", p.question);
    console.log("Category:", p.category);
    console.log("Cover Image Field:", p.cover_image);
    console.log("Options Field:", p.options);
  });
}

checkPolls();
