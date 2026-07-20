const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function addStatusColumns() {
  const sql = `
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
    ALTER TABLE public.services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
  `;
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error("SQL EXECUTION ERROR:", error.message);
  } else {
    console.log("SQL EXECUTION SUCCESS:", data);
  }
}

addStatusColumns();
