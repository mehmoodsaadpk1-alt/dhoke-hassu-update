const fs = require('fs');
const path = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/AppShell.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import for dbUpdatePresence
content = content.replace(
  "import { supabase, dbGetUnreadNotificationsCount, dbGetNotifications, dbMarkAllNotificationsRead, dbMarkNotificationRead, isSupabaseConfigured, dbSaveUserProfile } from '../utils/supabaseClient';",
  "import { supabase, dbGetUnreadNotificationsCount, dbGetNotifications, dbMarkAllNotificationsRead, dbMarkNotificationRead, isSupabaseConfigured, dbSaveUserProfile, dbUpdatePresence } from '../utils/supabaseClient';"
);

// 2. Add heartbeat useEffect inside AppShell
const effectOld = `  // Load & subscribe to notifications for the global badge & preview dropdown
  React.useEffect(() => {
    if (!profileData?.id || !isSupabaseConfigured || !supabase) return;`;

const effectNew = `  // Online Presence Heartbeat
  React.useEffect(() => {
    if (!profileData?.id || !isSupabaseConfigured) return;

    let heartbeatInterval: any;

    const pingPresence = () => {
      if (document.visibilityState === 'visible') {
        dbUpdatePresence(profileData.id!, true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pingPresence(); // Ping immediately on return
        heartbeatInterval = setInterval(pingPresence, 60000); // 60s while visible
      } else {
        clearInterval(heartbeatInterval);
        // Mark offline or let the 90s timeout handle it on the backend, but we can do it explicitly:
        // Actually the backend 90s timeout handles hidden tabs perfectly if we just stop sending heartbeats!
      }
    };

    // Initial setup
    if (document.visibilityState === 'visible') {
      pingPresence();
      heartbeatInterval = setInterval(pingPresence, 60000);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Explicit offline on unload/logout
    const handleBeforeUnload = () => {
      dbUpdatePresence(profileData.id!, false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      dbUpdatePresence(profileData.id!, false); // Mark offline on unmount (logout)
    };
  }, [profileData?.id]);

  // Load & subscribe to notifications for the global badge & preview dropdown
  React.useEffect(() => {
    if (!profileData?.id || !isSupabaseConfigured || !supabase) return;`;

if (!content.includes('Online Presence Heartbeat')) {
  content = content.replace(effectOld, effectNew);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Patched AppShell.tsx with heartbeat');
} else {
  console.log('AppShell already patched');
}
