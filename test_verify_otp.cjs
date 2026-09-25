require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gsbasllnpbojpfrztarv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmFzbGxucGJvanBmcnp0YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk5ODcsImV4cCI6MjA5ODMwNTk4N30.wWOUYD41MtJWSAZifBb7thJb3cSsh7fr4iXMsORVA4M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: 'dummy', type: 'magiclink' });
  console.log("verifyOtp Error:", JSON.stringify(error, null, 2));
}

test();
