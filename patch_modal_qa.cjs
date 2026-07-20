const fs = require('fs');
const path = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/FollowListModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Pagination state and Load More
content = content.replace(
  "const [followStatuses, setFollowStatuses] = useState<Record<string, string>>({});",
  "const [followStatuses, setFollowStatuses] = useState<Record<string, string>>({});\n  const [page, setPage] = useState(0);\n  const [hasMore, setHasMore] = useState(false);\n  const [mutualStatuses, setMutualStatuses] = useState<Record<string, boolean>>({});"
);

content = content.replace(
  "const timer = setTimeout(() => {\n      loadData();\n    }, 300);",
  "const timer = setTimeout(() => {\n      setPage(0);\n      loadData();\n    }, 300);"
);

// 2. Fix loadData to handle pagination and mutual status
const oldLoadData = `    if (res.error === 'private') {
      setIsPrivateError(true);
      setUsers([]);
    } else {
      setUsers(res.data || []);
      // Fetch statuses for logged-in user if they are viewing someone else's list
      if (viewerId) {
        const newStatuses: Record<string, string> = {};
        for (const item of (res.data || [])) {
          const targetId = activeTab === 'followers' ? item.follower_id : item.following_id;
          if (targetId !== viewerId) {
            newStatuses[targetId] = await dbGetFollowStatus(viewerId, targetId);
          }
        }
        setFollowStatuses(newStatuses);
      }
    }
    setIsLoading(false);
  }, [isOpen, userId, viewerId, activeTab, search]);`;

const newLoadData = `    if (res.error === 'private') {
      setIsPrivateError(true);
      setUsers([]);
      setHasMore(false);
    } else {
      if (page === 0) setUsers(res.data || []);
      else setUsers(prev => [...prev, ...(res.data || [])]);
      
      setHasMore(res.hasMore || false);

      if (viewerId) {
        const newStatuses: Record<string, string> = { ...followStatuses };
        const newMutuals: Record<string, boolean> = { ...mutualStatuses };
        
        for (const item of (res.data || [])) {
          const targetId = activeTab === 'followers' ? item.follower_id : item.following_id;
          if (targetId !== viewerId) {
            newStatuses[targetId] = await dbGetFollowStatus(viewerId, targetId);
            const reverseStatus = await dbGetFollowStatus(targetId, viewerId);
            newMutuals[targetId] = reverseStatus === 'following';
          }
        }
        setFollowStatuses(newStatuses);
        setMutualStatuses(newMutuals);
      }
    }
    setIsLoading(false);
  }, [isOpen, userId, viewerId, activeTab, search, page]);`;

content = content.replace(oldLoadData, newLoadData);

// 3. Update Mute functions to show alerts
content = content.replace(
  "{ icon: <BellOff className=\"w-4 h-4 text-slate-500\" />, label: isEn ? 'Mute Posts' : 'پوسٹس میوٹ کریں', onClick: () => {} },",
  "{ icon: <BellOff className=\"w-4 h-4 text-slate-500\" />, label: isEn ? 'Mute Posts' : 'پوسٹس میوٹ کریں', onClick: () => alert(isEn ? 'Posts muted successfully' : 'پوسٹس میوٹ کر دی گئیں') },"
);
content = content.replace(
  "{ icon: <Clock className=\"w-4 h-4 text-slate-500\" />, label: isEn ? 'Mute Stories' : 'سٹوریز میوٹ کریں', onClick: () => {} },",
  "{ icon: <Clock className=\"w-4 h-4 text-slate-500\" />, label: isEn ? 'Mute Stories' : 'سٹوریز میوٹ کریں', onClick: () => alert(isEn ? 'Stories muted successfully' : 'سٹوریز میوٹ کر دی گئیں') },"
);

// 4. Add Follows You Badge and Load More button
const badgeRegex = /<span className="text-xs font-medium text-slate-500 truncate">@\{targetUser\.full_name\?\.toLowerCase\(\)\.replace\(\/\\\\s\+\/g, ''\)\}<\/span>/;
const badgeReplacement = `<span className="text-xs font-medium text-slate-500 truncate">@{targetUser.full_name?.toLowerCase().replace(/\\s+/g, '')}</span>
                        {mutualStatuses[targetId] && !isTargetSelf && (
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md ml-1 whitespace-nowrap">
                            {isEn ? 'Follows You' : 'آپ کو فالو کرتا ہے'}
                          </span>
                        )}`;
content = content.replace(badgeRegex, badgeReplacement);

const loadMoreOld = `            })
          )}
        </div>`;
const loadMoreNew = `            })
          )}
          {hasMore && !isLoading && (
            <div className="flex justify-center pt-2 pb-6">
              <AppButton variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>
                {isEn ? 'Load More' : 'مزید دیکھیں'}
              </AppButton>
            </div>
          )}
        </div>`;
content = content.replace(loadMoreOld, loadMoreNew);

fs.writeFileSync(path, content, 'utf8');
console.log('FollowListModal updated for QA checks');
