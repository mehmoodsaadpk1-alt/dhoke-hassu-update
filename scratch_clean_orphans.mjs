import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cleanOrphans() {
  console.log("Starting orphan story cleanup...");

  // 1. Get all valid users from profiles
  const { data: profiles, error: pError } = await supabase.from('profiles').select('user_id');
  if (pError) {
    console.error("Failed to fetch profiles", pError);
    return;
  }
  const validUserIds = new Set(profiles.map(p => p.user_id));
  console.log(`Found ${validUserIds.size} valid users in profiles.`);

  // 2. Get all stories
  const { data: stories, error: sError } = await supabase.from('stories').select('id, custom_audience_ids');
  if (sError) {
    console.error("Failed to fetch stories", sError);
    return;
  }
  console.log(`Found ${stories.length} stories in database.`);

  let deletedCount = 0;

  // 3. Find and delete orphans
  for (const story of stories) {
    const storyUserId = story.custom_audience_ids?.[0];
    
    // If there is no user_id, or the user_id is not in the profiles table -> ORPHAN
    if (!storyUserId || !validUserIds.has(storyUserId)) {
      console.log(`Deleting orphan story ID: ${story.id} (Owner: ${storyUserId || 'Unknown'})`);
      const { error: dError } = await supabase.from('stories').delete().eq('id', story.id);
      if (dError) {
        console.error(`Failed to delete story ${story.id}:`, dError);
      } else {
        deletedCount++;
      }
    }
  }

  console.log(`Cleanup complete! Deleted ${deletedCount} orphan stories.`);
}

cleanOrphans();
