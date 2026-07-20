import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsbasllnpbojpfrztarv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmFzbGxucGJvanBmcnp0YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk5ODcsImV4cCI6MjA5ODMwNTk4N30.wWOUYD41MtJWSAZifBb7thJb3cSsh7fr4iXMsORVA4M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- 1. After dbGetAllStoryAds() ---");
  const { data: fetchedAds, error } = await supabase.from('story_ads').select('*').order('created_at', { ascending: false });
  console.log("Fetched Story Ads:", fetchedAds ? fetchedAds.length : 0, "Error:", error);
  if (fetchedAds && fetchedAds.length > 0) {
    console.log(JSON.stringify(fetchedAds[0], null, 2));
  }

  console.log("\n--- 2. Immediately after setStoryAds(mappedAds) ---");
  const mappedAds = (fetchedAds || []).filter((a) => a.active).map((a) => ({
    id: a.id,
    author: 'Sponsored',
    avatar: 'https://via.placeholder.com/150?text=Ad',
    time: 'Sponsored',
    viewed: false,
    type: a.media_type,
    image: a.media_url,
    isAd: true,
    ctaLink: a.cta_link,
    ctaText: a.cta_text,
    duration: a.duration,
    createdAt: Date.now()
  }));
  console.log("Mapped Story Ads:", mappedAds.length);
  if (mappedAds.length > 0) {
    console.log(JSON.stringify(mappedAds[0], null, 2));
  }

  console.log("\n--- 3. Inside groupedUserStories ---");
  const stories = [
    { id: 'u1-s1', userId: 'user1', author: 'User 1', createdAt: Date.now() - 1000 },
    { id: 'u2-s1', userId: 'user2', author: 'User 2', createdAt: Date.now() - 2000 },
    { id: 'u3-s1', userId: 'user3', author: 'User 3', createdAt: Date.now() - 3000 },
  ];
  
  const map = new Map();
  stories.forEach(story => {
    if (!map.has(story.userId)) map.set(story.userId, []);
    map.get(story.userId).push(story);
  });
  
  const sortedGroups = Array.from(map.values()).sort((a, b) => {
    const aLatest = Math.max(...a.map(s => new Date(s.createdAt).getTime()));
    const bLatest = Math.max(...b.map(s => new Date(s.createdAt).getTime()));
    return bLatest - aLatest;
  }).map(userStories => {
    return userStories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  const storyAds = mappedAds;
  let groupedUserStories = sortedGroups;

  if (storyAds.length > 0) {
    const result = [];
    let adIndex = 0;
    for (let i = 0; i < sortedGroups.length; i++) {
      result.push(sortedGroups[i]);
      if ((i + 1) % 3 === 0 && adIndex < storyAds.length) {
        result.push([storyAds[adIndex]]);
        adIndex++;
      }
    }
    while (adIndex < storyAds.length) {
      result.push([storyAds[adIndex]]);
      adIndex++;
    }
    groupedUserStories = result;
  }

  console.log("Stories:", stories.length);
  console.log("Story Ads:", storyAds.length);
  console.log("Grouped:", groupedUserStories.length);
  console.log("Final Timeline:", groupedUserStories.map(g => g[0].isAd ? 'AD' : g[0].userId));

  console.log("\n--- 4. Before rendering Story circles ---");
  const visibleCircles = groupedUserStories.filter(group => !group[0].isAd);
  console.log("Story Circles:", visibleCircles.map(g => g[0].userId));

  console.log("\n--- 5. Before StoryViewer opens ---");
  const flatGroupedStories = groupedUserStories.flat();
  const viewingStoryIdx = flatGroupedStories.findIndex(s => s.isAd); // Find first ad
  if (viewingStoryIdx !== -1) {
    const story = flatGroupedStories[viewingStoryIdx];
    const currentUserStories = groupedUserStories.find(group => 
      story.isAd ? group[0].id === story.id : group[0].userId === story.userId
    ) || [story];
    console.log("Opening Story:", story.id, "(isAd:", story.isAd, ")");
    console.log("Matches group with length:", currentUserStories.length);
  } else {
    console.log("No ads in flatGroupedStories!");
  }
}
run();
