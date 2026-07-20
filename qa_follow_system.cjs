const fs = require('fs');
require('dotenv').config({ path: 'C:/Users/sys/Desktop/dhoke hassu connect/.env' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase1 = createClient(url, key);
const supabase2 = createClient(url, key);

let results = { passed: [], failed: [], bugs: [] };

function pass(name) { results.passed.push(name); console.log('✓ ' + name); }
function fail(name, error) { results.failed.push(name); results.bugs.push(error); console.log('✗ ' + name + ' - ' + error); }

async function runTests() {
  console.log('Starting E2E QA...');
  
  // Login
  const { data: d1, error: e1 } = await supabase1.auth.signInWithPassword({ email: 'testqa1@example.com', password: 'password123' });
  const { data: d2, error: e2 } = await supabase2.auth.signInWithPassword({ email: 'testqa2@example.com', password: 'password123' });
  
  if (e1 || e2) {
    console.error('Login failed', e1 || e2);
    return;
  }
  
  const u1 = d1.user.id;
  const u2 = d2.user.id;
  
  // Setup profiles
  await supabase1.from('profiles').upsert({ user_id: u1, full_name: 'Test 1', privacy_type: 'public' });
  await supabase2.from('profiles').upsert({ user_id: u2, full_name: 'Test 2', privacy_type: 'private' });
  
  // Clear any existing follows/blocks
  await supabase1.from('followers').delete().or(`follower_id.eq.${u1},following_id.eq.${u1}`);
  await supabase1.from('user_blocks').delete().or(`blocker_id.eq.${u1},blocked_id.eq.${u1}`);
  
  try {
    // S1: Public Follow (u2 follows u1)
    const { error: f1 } = await supabase2.from('followers').insert({ follower_id: u2, following_id: u1, status: 'following' });
    if (f1) fail('Scenario 1: Public follow', f1.message); else pass('Scenario 1: Public follow');
    
    // Check realtime counts (trigger logic)
    const { data: p1 } = await supabase1.from('profiles').select('followers_count').eq('user_id', u1).single();
    if (p1.followers_count === 1) pass('Scenario 12: Realtime follower count'); else fail('Scenario 12: Realtime follower count', 'Count did not increment');
    
    // S2: Private Follow Request (u1 follows u2)
    const { error: f2 } = await supabase1.from('followers').insert({ follower_id: u1, following_id: u2, status: 'requested' });
    if (f2) fail('Scenario 2: Private follow request', f2.message); else pass('Scenario 2: Private follow request');
    
    // S3: Accept Request
    const { error: f3 } = await supabase2.from('followers').update({ status: 'following' }).eq('follower_id', u1).eq('following_id', u2);
    if (f3) fail('Scenario 3: Accept request', f3.message); else pass('Scenario 3: Accept request');
    
    // S6: Unfollow (u2 unfollows u1)
    const { error: f6 } = await supabase2.from('followers').delete().eq('follower_id', u2).eq('following_id', u1);
    if (f6) fail('Scenario 6: Unfollow', f6.message); else pass('Scenario 6: Unfollow');
    
    // S7: Remove follower (u2 removes u1)
    const { error: f7 } = await supabase2.from('followers').delete().eq('follower_id', u1).eq('following_id', u2);
    if (f7) fail('Scenario 7: Remove follower', f7.message); else pass('Scenario 7: Remove follower');
    
    // S4: Reject request (recreate and reject)
    await supabase1.from('followers').insert({ follower_id: u1, following_id: u2, status: 'requested' });
    const { error: f4 } = await supabase2.from('followers').delete().eq('follower_id', u1).eq('following_id', u2);
    if (f4) fail('Scenario 4: Reject request', f4.message); else pass('Scenario 4: Reject request');
    
    // S5: Cancel request
    await supabase1.from('followers').insert({ follower_id: u1, following_id: u2, status: 'requested' });
    const { error: f5 } = await supabase1.from('followers').delete().eq('follower_id', u1).eq('following_id', u2);
    if (f5) fail('Scenario 5: Cancel request', f5.message); else pass('Scenario 5: Cancel request');
    
    // S8: Block user (u1 blocks u2)
    // Setup follow first
    await supabase2.from('followers').insert({ follower_id: u2, following_id: u1, status: 'following' });
    const { error: f8 } = await supabase1.from('user_blocks').insert({ blocker_id: u1, blocked_id: u2 });
    if (f8) fail('Scenario 8: Block user', f8.message); else pass('Scenario 8: Block user');
    
    // Check trigger: did block remove the follow?
    const { data: followCheck } = await supabase1.from('followers').select('*').eq('follower_id', u2).eq('following_id', u1);
    if (followCheck.length === 0) pass('Scenario 8: Block automatically removes follow'); else fail('Scenario 8: Block automatically removes follow', 'Trigger did not remove follow');
    
    // S16: Blocked user attempting to follow
    const { error: f16 } = await supabase2.from('followers').insert({ follower_id: u2, following_id: u1, status: 'following' });
    if (f16) pass('Scenario 16: Blocked user attempting to follow (prevented by block logic in UI/API)'); else fail('Scenario 16: Blocked user attempting to follow', 'Allowed to follow directly via API! Needs RLS/Trigger check.');
    // Note: Our DB schema doesn't inherently have a trigger preventing insert if blocked, we rely on the API check. Let's see if RLS catches it.
    
    // S9: Unblock user
    const { error: f9 } = await supabase1.from('user_blocks').delete().eq('blocker_id', u1).eq('blocked_id', u2);
    if (f9) fail('Scenario 9: Unblock user', f9.message); else pass('Scenario 9: Unblock user');
    
    // S14: Duplicate follow prevention
    await supabase1.from('followers').insert({ follower_id: u1, following_id: u2, status: 'requested' });
    const { error: f14 } = await supabase1.from('followers').insert({ follower_id: u1, following_id: u2, status: 'requested' });
    if (f14 && f14.code === '23505') pass('Scenario 14: Duplicate follow prevention'); else fail('Scenario 14: Duplicate follow prevention', 'Allowed duplicate');
    
    // S15: Attempt self-follow
    const { error: f15 } = await supabase1.from('followers').insert({ follower_id: u1, following_id: u1, status: 'following' });
    if (f15 && f15.code === '23514') pass('Scenario 15: Attempt self-follow'); else fail('Scenario 15: Attempt self-follow', 'Allowed self-follow');
    
    // S18: Verify RLS prevents unauthorized access
    const { error: f18 } = await supabase1.from('followers').insert({ follower_id: u2, following_id: u1, status: 'following' });
    if (f18 && f18.message.includes('row violates row-level security policy')) pass('Scenario 18: Verify RLS (prevent forging follower_id)'); else fail('Scenario 18: Verify RLS', 'Allowed forging follower_id');
    
    console.log('\\nQA COMPLETE. Failed:', results.failed.length);
    fs.writeFileSync('C:/Users/sys/Desktop/dhoke hassu connect/qa_report.json', JSON.stringify(results));
  } catch (err) {
    console.error('Fatal error during tests', err);
  }
}

runTests();
