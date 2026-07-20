import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigrate() {
  console.log("Running migration to add views and ctr columns...");
  const sql = `
    ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
    ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ctr NUMERIC DEFAULT 0;
  `;
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error("Migration error:", error);
  } else {
    console.log("Migration executed successfully!");
    
    // verify
    const { data, error: selectError } = await supabase.from('ads').select('*').limit(1);
    if (selectError) {
      console.error("Select error:", selectError);
    } else {
      console.log("Ad object keys after migration:", data.length > 0 ? Object.keys(data[0]) : "No ads.");
    }
  }
}

runMigrate();
