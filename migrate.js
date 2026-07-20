import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const sql = `
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.ads ADD COLUMN format TEXT DEFAULT 'Feed';
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
    BEGIN
        ALTER TABLE public.ads ADD COLUMN display_frequency INTEGER DEFAULT 20;
    EXCEPTION
        WHEN duplicate_column THEN null;
    END;
END $$;
`;

  console.log("Running migration...");
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error("Migration failed:", error);
  } else {
    console.log("Migration successful:", data);
  }
}

run();
