import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testColumn(colName, val) {
  const payload = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    [colName]: val
  };
  const { error } = await supabase.from('stories').upsert([payload]);
  if (error && error.message.includes("invalid input syntax for type bigint")) {
    console.log(`BINGO! Column ${colName} expects BIGINT.`);
  } else if (error) {
    console.log(`Column ${colName} error: ${error.message}`);
  } else {
    console.log(`Column ${colName} accepted the value!`);
  }
}

async function run() {
  await testColumn('createdAt', new Date().toISOString());
  await testColumn('created_at', new Date().toISOString());
  await testColumn('time', new Date().toISOString());
  await testColumn('expires_at', new Date().toISOString());
}

run();
