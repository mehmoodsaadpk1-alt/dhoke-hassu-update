require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testUpdate() {
  console.log("Signing up as test user...");
  const { data: authData } = await supabase.auth.signUp({
    email: `test_update_${Date.now()}@example.com`,
    password: 'Password123'
  });
  const viewerId = authData.user?.id;
  console.log("Signed up", viewerId);

  const { data: stories } = await supabase.from('stories').select('id, views_count').limit(1);
  if (!stories || stories.length === 0) return;

  const storyId = stories[0].id;
  const currentCount = stories[0].views_count || 0;

  // Let's try to update without auth first!
  console.log(`Updating story ${storyId} views from ${currentCount} to ${currentCount + 1}`);
  const { data, error } = await supabase.from('stories').update({ views_count: currentCount + 1 }).eq('id', storyId);
  
  if (error) {
    console.error("Update failed:", error);
  } else {
    console.log("Update success:", data);
  }
}
testUpdate();
