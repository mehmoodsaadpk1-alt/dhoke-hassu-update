import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching profiles:", error);
  } else if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("Table is empty but columns might be inferred by inserting a dummy record.");
    // Try to insert a dummy record with wrong column to get error
    const { error: err2 } = await supabase.from('profiles').upsert({ user_id: '00000000-0000-0000-0000-000000000000', fake_col: 1 });
    console.log("Error from fake_col insert:", err2);
  }
}

checkSchema();
