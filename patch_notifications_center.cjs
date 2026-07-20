const fs = require('fs');
const path = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/NotificationsModule.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update Imports
content = content.replace(
  "dbSaveNotificationPreferences,\n  dbGetUnreadNotificationsCount\n} from '../utils/supabaseClient';",
  "dbSaveNotificationPreferences,\n  dbGetUnreadNotificationsCount,\n  dbDeleteNotificationsByCategory,\n  dbClearAllNotifications\n} from '../utils/supabaseClient';"
);

// 2. Update categoryFilter state
content = content.replace(
  "const [categoryFilter, setCategoryFilter] = useState<'all' | 'chat' | 'community' | 'jobs' | 'marketplace' | 'businesses' | 'property' | 'emergency' | 'system'>('all');",
  "const [categoryFilter, setCategoryFilter] = useState<'all' | 'unread' | 'followers' | 'messages' | 'stories' | 'marketplace' | 'community' | 'system'>('all');"
);

// 3. Update the category tabs UI
const tabsOldRegex = /const filterTabs = \[.*?\];/s;
const tabsNew = `const filterTabs = [
    { id: 'all', labelEn: 'All', labelUr: 'سب' },
    { id: 'unread', labelEn: 'Unread', labelUr: 'ان پڑھے' },
    { id: 'followers', labelEn: 'Followers', labelUr: 'فالوورز' },
    { id: 'messages', labelEn: 'Messages', labelUr: 'پیغامات' },
    { id: 'stories', labelEn: 'Stories', labelUr: 'سٹوریز' },
    { id: 'marketplace', labelEn: 'Marketplace', labelUr: 'مارکیٹ' },
    { id: 'community', labelEn: 'Community', labelUr: 'کمیونٹی' },
    { id: 'system', labelEn: 'System', labelUr: 'سسٹم' }
  ];`;

content = content.replace(tabsOldRegex, tabsNew);

// 4. Update the logic for filtering (which uses categoryFilter)
// The original filter logic probably looks like this:
// const filteredNotifications = notifications.filter(n => {
//   ...
// });
// We will replace it with our own logic.
const filterLogicOld = `  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Base active filter
      if (activeFilter === 'unread' && n.isRead) return false;
      if (activeFilter === 'read' && !n.isRead) return false;
      
      // Category filter
      if (categoryFilter !== 'all') {
        if (n.type !== categoryFilter) return false;
      }
      return true;
    });
  }, [notifications, activeFilter, categoryFilter]);`;

const filterLogicNew = `  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (categoryFilter === 'unread' && n.isRead) return false;
      
      if (categoryFilter === 'followers' && !['follow_request', 'new_follower', 'follow_accepted'].includes(n.type)) return false;
      if (categoryFilter === 'messages' && !['chat', 'message'].includes(n.type)) return false;
      if (categoryFilter === 'stories' && !['story_view', 'story_reaction', 'story_reply'].includes(n.type)) return false;
      if (categoryFilter === 'marketplace' && n.type !== 'marketplace') return false;
      if (categoryFilter === 'community' && !['community', 'event', 'poll'].includes(n.type)) return false;
      if (categoryFilter === 'system' && !['system', 'report', 'verification', 'admin'].includes(n.type)) return false;
      
      return true;
    });
  }, [notifications, categoryFilter]);`;

if (content.includes("const filteredNotifications = useMemo(() => {")) {
  content = content.replace(filterLogicOld, filterLogicNew);
} else {
  // Try finding it broadly
  content = content.replace(
    /const filteredNotifications = useMemo\(\(\) => \{.*?\}, \[notifications, activeFilter, categoryFilter\]\);/s,
    filterLogicNew
  );
}

// 5. Add Clear Actions
// The old Mark All As Read button looks like:
// <button onClick={handleMarkAllRead} ...> Mark all as read </button>
// We'll replace it with a dropdown or just add buttons next to it.
const markAllOld = `<button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || isLoading}
            className={\`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all \${
              unreadCount > 0 
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                : 'bg-slate-50 text-slate-400 cursor-not-allowed'
            }\`}
          >
            <CheckCheck className="w-4 h-4" />
            <span className="hidden sm:inline">{isEn ? 'Mark all as read' : 'سب پڑھ لیا'}</span>
          </button>`;

const markAllNew = `<div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setIsLoading(true);
              const success = await dbClearAllNotifications(currentUser.id);
              if (success) {
                setNotifications([]);
                setToastMessage(isEn ? 'All notifications cleared' : 'تمام پیغامات صاف ہو گئے');
              }
              setIsLoading(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-red-50 text-red-600 hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{isEn ? 'Clear All' : 'سب صاف کریں'}</span>
          </button>
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || isLoading}
            className={\`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all \${
              unreadCount > 0 
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                : 'bg-slate-50 text-slate-400 cursor-not-allowed'
            }\`}
          >
            <CheckCheck className="w-4 h-4" />
            <span className="hidden sm:inline">{isEn ? 'Mark all as read' : 'سب پڑھ لیا'}</span>
          </button>
        </div>`;

content = content.replace(markAllOld, markAllNew);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched NotificationsModule.tsx');
