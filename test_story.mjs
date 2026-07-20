import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsbasllnpbojpfrztarv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmFzbGxucGJvanBmcnp0YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk5ODcsImV4cCI6MjA5ODMwNTk4N30.wWOUYD41MtJWSAZifBb7thJb3cSsh7fr4iXMsORVA4M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: dbData } = await supabase.from('story_ads').select('*');

  console.log("\nStory Ads in DB:");
  console.log(JSON.stringify(dbData, null, 2));
}
run();
