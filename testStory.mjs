import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log("Starting test insert into 'stories' table...");
  const payload = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    author: "Test User",
    avatar: "https://example.com/avatar.png",
    type: "text",
    text: "This is a test story",
    bgColor: "bg-red-500",
    createdAt: Date.now(), // BigInt
    created_at: new Date().toISOString(), // Timestamp
    media_type: "text",
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_archived: false,
    custom_audience_ids: ["f47ac10b-58cc-4372-a567-0e02b2c3d479"]
  };

  const { data, error } = await supabase
    .from('stories')
    .upsert([payload])
    .select();

  if (error) {
    console.error("INSERT FAILED:", error);
  } else {
    console.log("INSERT SUCCESS:", data);
  }
}

testInsert();
