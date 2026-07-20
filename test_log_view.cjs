require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing supabase credentials in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInsert() {
  // First, find a valid story ID and user ID
  const { data: storyRows } = await supabase.from('stories').select('*').limit(10);
  if (!storyRows || storyRows.length === 0) {
    console.error("No stories found");
    return;
  }
  
  // Find a UUID story
  const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(str));
  let story = storyRows.find(s => isUUID(s.id));
  
  if (!story) {
    console.log("No UUID story found. Creating one...");
    const crypto = require('crypto');
    const newId = crypto.randomUUID();
    const { data: profileRows } = await supabase.from('profiles').select('user_id').limit(1);
    const userId = profileRows[0]?.user_id;
    
    await supabase.from('stories').insert({
      id: newId,
      author: 'Test User',
      type: 'text',
      text: 'Hello test',
      custom_audience_ids: [userId]
    });
    
    const { data: newStoryRows } = await supabase.from('stories').select('*').eq('id', newId);
    story = newStoryRows[0];
  }
  
  console.log("Using story:", story.id);
  
  // Find a user ID to use as viewer
  const { data: profiles } = await supabase.from('profiles').select('user_id').limit(2);
  let viewerId = profiles.find(p => p.user_id !== story.user_id)?.user_id || profiles[0].user_id;
  
  console.log("Using viewer:", viewerId);

  console.log("Signing up as test user...");
  const { data: authData, error: signInError } = await supabase.auth.signUp({
    email: `test_${Date.now()}@example.com`,
    password: 'Password123'
  });
  
  if (signInError) {
    console.log("Could not sign up. Error:", signInError.message);
  } else {
    console.log("Signed up successfully!", authData.user?.id);
    viewerId = authData.user?.id || viewerId;
  }

  // Now try inserting a view
  console.log("Inserting view...");
  const { data, error } = await supabase.from('story_views').insert({ story_id: story.id, viewer_id: viewerId });
  
  console.log("Insert Response Data:", data);
  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Success!");
  }
}

testInsert();
