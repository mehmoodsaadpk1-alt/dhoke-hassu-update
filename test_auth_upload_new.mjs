import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testUpload() {
  const dummyEmail = `test_${Date.now()}@test.com`;
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: dummyEmail,
    password: 'password123'
  });

  if (authError) {
    console.error("SignUp Error:", authError);
    return;
  }
  console.log("Signed up user:", authData.user.id);

  // Try to upload a dummy file to 'posts' bucket
  const fileContent = "dummy content";
  const blob = new Blob([fileContent], { type: 'text/plain' });
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('posts')
    .upload(`avatars/${authData.user.id}/test.txt`, blob);

  console.log("Upload Data:", uploadData);
  console.log("Upload Error:", uploadError);

  // Try to get public URL
  const { data: urlData } = supabase.storage.from('posts').getPublicUrl(`avatars/${authData.user.id}/test.txt`);
  console.log("Public URL:", urlData.publicUrl);
}

testUpload();
