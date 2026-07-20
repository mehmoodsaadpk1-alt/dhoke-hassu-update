import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
  console.log("Fetching a row to inspect columns...");
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .limit(1);

  if (error) {
    console.error("FETCH FAILED:", error);
  } else {
    console.log("COLUMNS:", data.length > 0 ? Object.keys(data[0]) : "No rows found, cannot infer columns.");
  }
}

testFetch();
