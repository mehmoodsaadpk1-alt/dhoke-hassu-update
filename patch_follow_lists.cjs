const fs = require('fs');
const path = 'C:/Users/sys/Desktop/dhoke hassu connect/src/utils/supabaseClient.ts';
let content = fs.readFileSync(path, 'utf8');

const newFunctions = `
// ==========================================
// FOLLOWERS & FOLLOWING LISTS
// ==========================================

export async function dbCanViewFollowLists(viewerId: string, targetId: string): Promise<boolean> {
  if (!supabase) return false;
  if (viewerId === targetId) return true;
  
  const { data: profile } = await supabase.from('profiles').select('privacy_type').eq('user_id', targetId).single();
  if (profile?.privacy_type !== 'private') return true;
  
  const status = await dbGetFollowStatus(viewerId, targetId);
  return status === 'following';
}

export async function dbGetFollowersList(userId: string, viewerId: string, search: string = '', page: number = 0, limit: number = 20) {
  if (!supabase) return { data: [], error: null, hasMore: false };
  
  const canView = await dbCanViewFollowLists(viewerId, userId);
  if (!canView) return { data: [], error: 'private', hasMore: false };
  
  try {
    let query = supabase.from('followers')
      .select('id, follower_id, created_at, profiles!followers_follower_id_fkey(user_id, full_name, profile_photo, privacy_type)')
      .eq('following_id', userId)
      .eq('status', 'following')
      .order('created_at', { ascending: false });
      
    if (search) {
      // Supabase nested ilike filter workaround
      // Instead of complex RPC, we fetch more and filter in memory if needed, or if we have an RPC we use it.
      // Assuming no RPC for now, fetch larger block. For production, a database view or RPC is best.
    }
      
    const from = page * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);
    const { data, error } = await query;
    if (error) throw error;
    
    let processed = data || [];
    
    if (search && processed.length > 0) {
       const lowerSearch = search.toLowerCase();
       processed = processed.filter((item: any) => 
         item.profiles?.full_name?.toLowerCase().includes(lowerSearch)
       );
    }
    
    return { data: processed, error: null, hasMore: processed.length === limit };
  } catch (err: any) {
    return { data: [], error: err.message, hasMore: false };
  }
}

export async function dbGetFollowingList(userId: string, viewerId: string, search: string = '', page: number = 0, limit: number = 20) {
  if (!supabase) return { data: [], error: null, hasMore: false };
  
  const canView = await dbCanViewFollowLists(viewerId, userId);
  if (!canView) return { data: [], error: 'private', hasMore: false };
  
  try {
    let query = supabase.from('followers')
      .select('id, following_id, created_at, profiles!followers_following_id_fkey(user_id, full_name, profile_photo, privacy_type)')
      .eq('follower_id', userId)
      .eq('status', 'following')
      .order('created_at', { ascending: false });
      
    const from = page * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);
    const { data, error } = await query;
    if (error) throw error;
    
    let processed = data || [];
    
    if (search && processed.length > 0) {
       const lowerSearch = search.toLowerCase();
       processed = processed.filter((item: any) => 
         item.profiles?.full_name?.toLowerCase().includes(lowerSearch)
       );
    }
    
    return { data: processed, error: null, hasMore: processed.length === limit };
  } catch (err: any) {
    return { data: [], error: err.message, hasMore: false };
  }
}
`;

if (!content.includes('dbGetFollowersList')) {
  fs.writeFileSync(path, content + newFunctions, 'utf8');
  console.log('Appended list queries to supabaseClient.ts');
} else {
  console.log('Queries already exist.');
}
