import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'admin@dhokehassu.com', // Let's try this or create a new user
    password: 'password123'
  });
  
  if (signInError) {
    console.log("Sign in failed:", signInError.message);
    // Let's sign up a new admin user to test
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin_test@dhokehassu.com',
      password: 'password123',
    });
    console.log("Sign up result:", signUpData, signUpError);
  }

  const { data, error } = await supabase.from('story_ads').insert([{
    id: '223e4567-e89b-12d3-a456-426614174001',
    admin_id: '00000000-0000-0000-0000-000000000000',
    media_url: 'https://example.com/image.jpg',
    media_type: 'photo',
    cta_link: '',
    cta_type: 'WhatsApp',
    cta_value: '03001234567',
    cta_text: 'call',
    duration: 5,
    frequency_cap: 3,
    active: true
  }]);
  console.log("Insert WhatsApp Result:", { data, error });
  
  const { data: data2, error: error2 } = await supabase.from('story_ads').insert([{
    id: '333e4567-e89b-12d3-a456-426614174002',
    admin_id: '00000000-0000-0000-0000-000000000000',
    media_url: 'https://example.com/image.jpg',
    media_type: 'photo',
    cta_link: 'https://example.com',
    cta_type: 'Website',
    cta_value: 'https://example.com',
    cta_text: 'visit',
    duration: 5,
    frequency_cap: 3,
    active: true
  }]);
  console.log("Insert Website Result:", { data: data2, error: error2 });
}
test();
