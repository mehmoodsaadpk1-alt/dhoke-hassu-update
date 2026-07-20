import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log("Session:", session ? "Active" : "None");
  if (session) {
    console.log("User ID:", session.user.id);
    console.log("Email:", session.user.email);
    console.log("App Metadata:", session.user.app_metadata);
    console.log("User Metadata:", session.user.user_metadata);
  } else {
    // try signing in as admin
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@dhokehassu.com',
      password: 'password123'
    });
    if (signInError) {
      console.log("Admin sign in failed:", signInError);
    } else {
      console.log("User ID:", signInData.user.id);
      console.log("Email:", signInData.user.email);
      console.log("App Metadata:", signInData.user.app_metadata);
      console.log("User Metadata:", signInData.user.user_metadata);
    }
  }
}
check();
