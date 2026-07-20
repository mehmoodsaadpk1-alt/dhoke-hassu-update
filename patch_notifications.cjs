const fs = require('fs');
const pathSupabase = 'C:/Users/sys/Desktop/dhoke hassu connect/src/utils/supabaseClient.ts';
let content = fs.readFileSync(pathSupabase, 'utf8');

// Patch dbFollowUser
const followOld = `    const { error } = await supabase.from('followers').insert({ follower_id: followerId, following_id: followingId, status });
    if (error) throw error;
    
    return { success: true, status };`;

const followNew = `    const { error } = await supabase.from('followers').insert({ follower_id: followerId, following_id: followingId, status });
    if (error) throw error;
    
    // Notification logic
    const { data: existing } = await supabase.from('notifications')
      .select('id')
      .eq('user_id', followingId)
      .eq('sender_id', followerId)
      .in('type', ['new_follower', 'follow_request'])
      .maybeSingle();
      
    if (!existing) {
      if (status === 'following') {
        dbTriggerNotification(followingId, followerId, 'New Follower', 'started following you.', 'new_follower', followerId);
      } else {
        dbTriggerNotification(followingId, followerId, 'Follow Request', 'requested to follow you.', 'follow_request', followerId);
      }
    }
    
    return { success: true, status };`;

content = content.replace(followOld, followNew);

// Patch dbAcceptFollowRequest
const acceptOld = `  try {
    const { error } = await supabase.from('followers').update({ status: 'following' }).eq('follower_id', followerId).eq('following_id', followingId);
    return !error;`;

const acceptNew = `  try {
    const { error } = await supabase.from('followers').update({ status: 'following' }).eq('follower_id', followerId).eq('following_id', followingId);
    if (!error) {
      dbTriggerNotification(followerId, followingId, 'Request Accepted', 'accepted your follow request.', 'follow_accept', followingId);
    }
    return !error;`;

content = content.replace(acceptOld, acceptNew);

fs.writeFileSync(pathSupabase, content, 'utf8');
console.log('Patched supabaseClient.ts');

const pathNotifs = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/NotificationsModule.tsx';
let notifContent = fs.readFileSync(pathNotifs, 'utf8');

// Patch handleNotificationClick to support follow navigation
const clickOld = `if (notif.relatedModule === 'chat' && notif.relatedId) {
      navigate('/chat', notif.relatedId);
    } else if (notif.relatedModule === 'post' && notif.relatedId) {
      navigate('/feed', notif.relatedId);`;

const clickNew = `if (notif.type === 'new_follower' || notif.type === 'follow_request' || notif.type === 'follow_accept') {
      navigate('/profile', notif.relatedId || notif.senderId);
    } else if (notif.relatedModule === 'chat' && notif.relatedId) {
      navigate('/chat', notif.relatedId);
    } else if (notif.relatedModule === 'post' && notif.relatedId) {
      navigate('/feed', notif.relatedId);`;

notifContent = notifContent.replace(clickOld, clickNew);

// Optionally add an icon for follow notifications in getNotificationIcon
const iconOld = `case 'system':
        return <Info className={\`w-5 h-5 \${isUnread ? 'text-blue-500' : 'text-slate-500'}\`} />;`;

const iconNew = `case 'new_follower':
      case 'follow_request':
      case 'follow_accept':
        return <UserPlus className={\`w-5 h-5 \${isUnread ? 'text-indigo-500' : 'text-slate-500'}\`} />;
      case 'system':
        return <Info className={\`w-5 h-5 \${isUnread ? 'text-blue-500' : 'text-slate-500'}\`} />;`;

if (!notifContent.includes('new_follower')) {
  notifContent = notifContent.replace(iconOld, iconNew);
  
  // Make sure UserPlus is imported
  if (!notifContent.includes('UserPlus')) {
    notifContent = notifContent.replace(
      "import { Bell, Check, Trash2, Heart, MessageSquare, Info, Store, Briefcase } from 'lucide-react';",
      "import { Bell, Check, Trash2, Heart, MessageSquare, Info, Store, Briefcase, UserPlus } from 'lucide-react';"
    );
  }
}

fs.writeFileSync(pathNotifs, notifContent, 'utf8');
console.log('Patched NotificationsModule.tsx');
