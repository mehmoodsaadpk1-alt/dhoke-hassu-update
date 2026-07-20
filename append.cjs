const fs = require('fs');

const code = `

/**
 * ============================================================================
 * FOLLOW & PRIVACY SYSTEM
 * ============================================================================
 */

export async function dbFollowUser(followerId: string, followingId: string): Promise<{ success: boolean; status?: 'following' | 'requested' }> {
  if (!supabase) return { success: false };
  try {
    // Check if block exists
    const { data: block } = await supabase.from('user_blocks').select('id').or(\`and(blocker_id.eq.\${followerId},blocked_id.eq.\${followingId}),and(blocker_id.eq.\${followingId},blocked_id.eq.\${followerId})\`).maybeSingle();
    if (block) return { success: false };

    // Get following user privacy
    const { data: profile } = await supabase.from('profiles').select('privacy_type').eq('user_id', followingId).single();
    const status = profile?.privacy_type === 'private' ? 'requested' : 'following';

    const { error } = await supabase.from('followers').insert({ follower_id: followerId, following_id: followingId, status });
    if (error) throw error;
    
    return { success: true, status };
  } catch (err) {
    console.error('dbFollowUser Error:', err);
    return { success: false };
  }
}

export async function dbAcceptFollowRequest(followerId: string, followingId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('followers').update({ status: 'following' }).eq('follower_id', followerId).eq('following_id', followingId);
    return !error;
  } catch (err) { return false; }
}

export async function dbRejectFollowRequest(followerId: string, followingId: string): Promise<boolean> {
  return dbUnfollowUser(followerId, followingId);
}

export async function dbUnfollowUser(followerId: string, followingId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('followers').delete().eq('follower_id', followerId).eq('following_id', followingId);
    return !error;
  } catch (err) { return false; }
}

export async function dbRemoveFollower(followerId: string, followingId: string): Promise<boolean> {
  return dbUnfollowUser(followerId, followingId); // reversed order passed from UI
}

export async function dbBlockUser(blockerId: string, blockedId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('user_blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
    return !error;
  } catch (err) { return false; }
}

export async function dbUnblockUser(blockerId: string, blockedId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('user_blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
    return !error;
  } catch (err) { return false; }
}

export async function dbGetFollowStatus(viewerId: string, targetId: string): Promise<'following' | 'requested' | 'none' | 'blocked'> {
  if (!supabase) return 'none';
  if (viewerId === targetId) return 'none';
  try {
    const { data: block } = await supabase.from('user_blocks').select('id').or(\`and(blocker_id.eq.\${viewerId},blocked_id.eq.\${targetId}),and(blocker_id.eq.\${targetId},blocked_id.eq.\${viewerId})\`).maybeSingle();
    if (block) return 'blocked';

    const { data } = await supabase.from('followers').select('status').eq('follower_id', viewerId).eq('following_id', targetId).maybeSingle();
    return data ? (data.status as 'following' | 'requested') : 'none';
  } catch (err) { return 'none'; }
}

export async function dbGetFollowRequests(userId: string) {
  if (!supabase) return [];
  try {
    const { data } = await supabase.from('followers')
      .select(\`
        id, follower_id, created_at,
        profiles!followers_follower_id_fkey(user_id, full_name, profile_photo)
      \`)
      .eq('following_id', userId)
      .eq('status', 'requested');
    return data || [];
  } catch(e) { return []; }
}
`;

fs.appendFileSync('C:/Users/sys/Desktop/dhoke hassu connect/src/utils/supabaseClient.ts', code);
console.log('Appended follow logic to supabaseClient.ts');
