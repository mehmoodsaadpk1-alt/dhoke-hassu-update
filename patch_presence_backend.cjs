const fs = require('fs');
const path = 'C:/Users/sys/Desktop/dhoke hassu connect/src/utils/supabaseClient.ts';
let content = fs.readFileSync(path, 'utf8');

const newFunctions = `
// ==========================================
// ONLINE PRESENCE SYSTEM
// ==========================================

export async function dbUpdatePresence(userId: string, isOnline: boolean): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    // Only update to prevent spam if needed, but since it's a heartbeat we just fire it.
    // The UI handles rate limiting (60s).
    await supabase.from('profiles').update({
      is_online: isOnline,
      last_seen: new Date().toISOString()
    }).eq('user_id', userId);
  } catch (err) {
    console.error('[dbUpdatePresence] Error:', err);
  }
}

export async function dbGetOnlineStatus(viewerId: string, targetId: string): Promise<{ isOnline: boolean, lastSeenText: string | null }> {
  if (!supabase || !isSupabaseConfigured) return { isOnline: false, lastSeenText: null };
  try {
    const { data: profile } = await supabase.from('profiles').select('is_online, last_seen, online_privacy').eq('user_id', targetId).single();
    if (!profile) return { isOnline: false, lastSeenText: null };

    // Privacy Check
    const privacy = profile.online_privacy || 'everyone';
    if (privacy === 'nobody') return { isOnline: false, lastSeenText: null };
    if (privacy === 'followers') {
      if (viewerId !== targetId) {
         const followStatus = await dbGetFollowStatus(viewerId, targetId);
         if (followStatus !== 'following') return { isOnline: false, lastSeenText: null };
      }
    }

    // Determine actual online state based on 90 second timeout threshold
    let isActuallyOnline = profile.is_online;
    const lastSeenDate = new Date(profile.last_seen);
    const now = new Date();
    const diffSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000;
    
    if (isActuallyOnline && diffSeconds > 90) {
       isActuallyOnline = false;
    }

    if (isActuallyOnline) return { isOnline: true, lastSeenText: null };

    // Generate last seen text
    if (!profile.last_seen) return { isOnline: false, lastSeenText: null };
    
    if (diffSeconds < 60) return { isOnline: false, lastSeenText: 'Last seen just now' };
    if (diffSeconds < 3600) return { isOnline: false, lastSeenText: \`Last seen \${Math.floor(diffSeconds / 60)} minutes ago\` };
    
    const isToday = lastSeenDate.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = lastSeenDate.toDateString() === yesterday.toDateString();
    
    const timeStr = lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return { isOnline: false, lastSeenText: \`Last seen today at \${timeStr}\` };
    if (isYesterday) return { isOnline: false, lastSeenText: \`Last seen yesterday at \${timeStr}\` };
    
    return { isOnline: false, lastSeenText: \`Last seen on \${lastSeenDate.toLocaleDateString()}\` };
  } catch (err) {
    return { isOnline: false, lastSeenText: null };
  }
}

// ==========================================
// ADVANCED NOTIFICATIONS BULK ACTIONS
// ==========================================

export async function dbDeleteNotificationsByCategory(userId: string, category: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('type', category);
    return !error;
  } catch (err) {
    return false;
  }
}

export async function dbClearAllNotifications(userId: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('notifications')
      .delete()
      .eq('user_id', userId);
    return !error;
  } catch (err) {
    return false;
  }
}
`;

if (!content.includes('dbUpdatePresence')) {
  fs.writeFileSync(path, content + newFunctions, 'utf8');
  console.log('Appended presence and notification functions to supabaseClient.ts');
} else {
  console.log('Functions already exist.');
}
