import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRPC() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: "ALTER TABLE stories ADD COLUMN user_id UUID" });
  console.log("RPC execute_sql:", error);
}

testRPC();
