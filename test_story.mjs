import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsbasllnpbojpfrztarv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmFzbGxucGJvanBmcnp0YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk5ODcsImV4cCI6MjA5ODMwNTk4N30.wWOUYD41MtJWSAZifBb7thJb3cSsh7fr4iXMsORVA4M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("1. Authenticating...");
  // Use a dummy user ID or random ID
  const userId = 'test-user-id';
  const mediaContent = "dummy image data";
  const fileName = `stories/${userId}/${Date.now()}_test.jpg`;
  
  console.log("2. Uploading to 'posts' bucket...");
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('posts')
    .upload(fileName, mediaContent, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (uploadError) {
    console.error("UPLOAD FAILED:", uploadError);
    return;
  }
  console.log("UPLOAD PASS:", uploadData);
  
  const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);
  console.log("URL GENERATION PASS:", urlData.publicUrl);
  
  const storyId = `test-story-${Date.now()}`;
  const newStory = {
    id: storyId,
    author: 'Test User',
    avatar: '',
    image: urlData.publicUrl,
    type: 'photo',
    text: '',
    viewed: false,
    createdAt: Date.now()
    // We intentionally omit expires_at to test if DB sets it properly based on DEFAULT
  };
  
  console.log("3. Inserting story into 'stories' table...");
  const { data: insertData, error: insertError } = await supabase
    .from('stories')
    .insert(newStory);
    
  if (insertError) {
    console.error("DB INSERT FAILED:", insertError);
    return;
  }
  console.log("DB INSERT PASS");
  
  console.log("4. Fetching stories to verify retrieval...");
  const now = new Date().toISOString();
  const { data: storiesData, error: storiesError } = await supabase
    .from('stories')
    .select('*')
    .eq('is_archived', false)
    .gte('expires_at', now)
    .order('createdAt', { ascending: false });
    
  if (storiesError) {
    console.error("STORY RETRIEVAL FAILED:", storiesError);
    return;
  }
  
  const fetchedStory = storiesData.find(s => s.id === storyId);
  if (fetchedStory) {
    console.log("STORY RETRIEVAL PASS, found story:", fetchedStory.id, "expires_at:", fetchedStory.expires_at);
  } else {
    console.error("STORY RETRIEVAL FAIL, story not found in active list. Data length:", storiesData.length);
  }
}

run();
