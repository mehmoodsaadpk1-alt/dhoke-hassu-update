import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testUpload() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'anas@gmail.com',
    password: 'password123'
  });

  if (authError) {
    console.error("Auth Error:", authError);
    return;
  }

  const { data: buckets } = await supabase.storage.listBuckets();
  console.log("Auth Buckets:", buckets);

  // Try to upload a dummy file to 'posts' bucket
  const fileContent = "dummy content";
  const blob = new Blob([fileContent], { type: 'text/plain' });
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('posts')
    .upload(`avatars/${authData.user.id}/test.txt`, blob);

  console.log("Upload Data:", uploadData);
  console.log("Upload Error:", uploadError);
}

testUpload();
