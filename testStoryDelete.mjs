import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDelete() {
  console.log("Starting test delete...");
  const newStoryId = "test-delete-" + Date.now();
  
  // 1. Insert a mock story
  const payload = {
    id: newStoryId,
    author: "Test Deleter",
    createdAt: Date.now(),
    created_at: new Date().toISOString(),
    media_type: "text",
    text: "Will be deleted",
  };
  
  console.log("Inserting story...");
  const { error: insertError } = await supabase.from('stories').upsert([payload]);
  if (insertError) {
    console.error("Insert failed:", insertError);
    return;
  }
  
  console.log("Deleting story...");
  const { data, error, status, statusText } = await supabase.from('stories').delete().eq('id', newStoryId).select();
  
  if (error) {
    console.error("DELETE FAILED:", error);
  } else {
    console.log(`DELETE SUCCESS! Status: ${status} ${statusText}`);
    console.log("Returned data:", data);
  }
}

testDelete();
