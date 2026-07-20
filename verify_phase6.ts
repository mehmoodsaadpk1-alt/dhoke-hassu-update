import { supabase } from './src/utils/supabaseClient';
import { 
  dbSaveStoryAd, 
  dbGetAllStoryAds, 
  dbLogStoryAdAnalytics, 
  dbDeleteStoryAd,
  dbHideStory,
  dbFeatureStory
} from './src/utils/supabaseClient';

async function runTests() {
  console.log("=== Phase 6 Backend Verification ===");
  
  // 1. Story Ads Creation
  const testAdId = 'test-ad-' + Date.now();
  console.log("\\n1. Creating Test Story Ad...");
  const saveSuccess = await dbSaveStoryAd({
    id: testAdId,
    admin_id: 'admin',
    media_url: 'https://test.com/ad.jpg',
    media_type: 'photo',
    cta_link: 'https://google.com',
    cta_text: 'Buy Now',
    duration: 5,
    impressions: 0,
    clicks: 0,
    completions: 0,
    skips: 0,
    exits: 0,
    active: true,
    frequency_cap: 3,
    target_audience: 'All'
  });
  console.log("Ad Creation Success:", saveSuccess);

  // 2. Telemetry
  console.log("\\n2. Testing Analytics Telemetry...");
  await dbLogStoryAdAnalytics(testAdId, 'impression');
  await dbLogStoryAdAnalytics(testAdId, 'click');
  await dbLogStoryAdAnalytics(testAdId, 'skip');
  await dbLogStoryAdAnalytics(testAdId, 'completion');
  await dbLogStoryAdAnalytics(testAdId, 'exit');
  
  // Fetch to verify counts
  const { data: ads } = await dbGetAllStoryAds();
  const testAd = ads?.find(a => a.id === testAdId);
  console.log("Telemetry Results for Ad:", testAdId);
  console.log("- Impressions (Expected: 1):", testAd?.impressions);
  console.log("- Clicks (Expected: 1):", testAd?.clicks);
  console.log("- Skips (Expected: 1):", testAd?.skips);
  console.log("- Completions (Expected: 1):", testAd?.completions);
  console.log("- Exits (Expected: 1):", testAd?.exits);

  // Cleanup Ad
  await dbDeleteStoryAd(testAdId);
  console.log("Cleanup: Deleted test ad.");

  // 3. Moderation Setup
  console.log("\\n3. Testing Moderation Endpoints...");
  // Find a story to hide/feature
  const { data: stories } = await supabase.from('stories').select('id, is_archived, is_featured').limit(1);
  if (stories && stories.length > 0) {
    const storyId = stories[0].id;
    console.log("Testing on Story ID:", storyId);
    
    const hideSuccess = await dbHideStory(storyId);
    console.log("Hide Story Success:", hideSuccess);
    
    const featureSuccess = await dbFeatureStory(storyId);
    console.log("Feature Story Success:", featureSuccess);

    // Verify
    const { data: verifyStory } = await supabase.from('stories').select('is_archived, is_featured').eq('id', storyId).single();
    console.log("Story is_archived state (Expected: true):", verifyStory?.is_archived);
    console.log("Story is_featured state (Expected: true):", verifyStory?.is_featured);
  } else {
    console.log("No stories found in DB to test moderation hooks on.");
  }

  console.log("\\n=== Verification Complete ===");
}

runTests();
