import { createClient } from '@supabase/supabase-js';  
const supabaseUrl = 'https://gsbasllnpbojpfrztarv.supabase.co';  
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmFzbGxucGJvanBmcnp0YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk5ODcsImV4cCI6MjA5ODMwNTk4N30.wWOUYD41MtJWSAZifBb7thJb3cSsh7fr4iXMsORVA4M';  
const supabase = createClient(supabaseUrl, supabaseKey);  
async function run() {  
  const storyId = 'test-story-' + Date.now();  
  const newStory = { id: storyId, author: 'Test User', avatar: '', image: 'https://example.com/img.jpg', type: 'photo', text: '', viewed: false, createdAt: Date.now() };  
  const { error: insertError } = await supabase.from('stories').insert(newStory);  
  if(insertError) { console.error('INSERT FAILED', insertError); return; }  
  console.log('INSERT PASS');  
  const now = new Date().toISOString();  
  const { data: storiesData, error: storiesError } = await supabase.from('stories').select('*').eq('is_archived', false).gte('expires_at', now).order('createdAt', { ascending: false });  
  if(storiesError) { console.error('FETCH FAILED', storiesError); return; }  
  const fetched = storiesData.find(s => s.id === storyId);  
  if(fetched) console.log('FETCH PASS', fetched.id, fetched.expires_at); else console.log('FETCH FAIL');  
}  
run();  
