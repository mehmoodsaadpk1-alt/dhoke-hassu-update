const fs = require('fs');
const path = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/UserProfileView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace(
  "import { useLanguage } from '../context/LanguageContext';",
  "import { useLanguage } from '../context/LanguageContext';\nimport { dbGetFollowStatus, dbFollowUser, dbUnfollowUser, dbRemoveFollower, dbBlockUser } from '../utils/supabaseClient';"
);
content = content.replace(
  "import { AppAvatar, AppButton, AppBadge, AppTabs } from './ui';",
  "import { AppAvatar, AppButton, AppBadge, AppTabs, AppDropdown } from './ui';\nimport { UserPlus, UserCheck, Clock, MoreVertical, ShieldAlert } from 'lucide-react';"
);

// 2. Add state inside UserProfileView
content = content.replace(
  "const [showHighlightCreator, setShowHighlightCreator] = useState(false);",
  "const [showHighlightCreator, setShowHighlightCreator] = useState(false);\n  const [followStatus, setFollowStatus] = useState<'following' | 'requested' | 'none' | 'blocked'>('none');\n  const [followersCount, setFollowersCount] = useState(0);\n  const [followingCount, setFollowingCount] = useState(0);\n  const [isFollowLoading, setIsFollowLoading] = useState(false);"
);

// 3. Add handleFollow
content = content.replace(
  "// Is this the logged-in user's own profile?",
  `
  const handleFollowToggle = async () => {
    if (!profile?.id || isSelf) return;
    setIsFollowLoading(true);
    if (followStatus === 'following' || followStatus === 'requested') {
      const success = await dbUnfollowUser(currentUser.id, profile.id);
      if (success) {
        setFollowStatus('none');
        if (followStatus === 'following') setFollowersCount(c => Math.max(0, c - 1));
      }
    } else {
      const res = await dbFollowUser(currentUser.id, profile.id);
      if (res.success) {
        setFollowStatus(res.status || 'requested');
        if (res.status === 'following') setFollowersCount(c => c + 1);
      }
    }
    setIsFollowLoading(false);
  };

  const handleBlock = async () => {
    if (!profile?.id || isSelf) return;
    if (window.confirm(isEn ? 'Block this user? They will not be able to interact with you.' : 'اس صارف کو بلاک کریں؟')) {
      await dbBlockUser(currentUser.id, profile.id);
      setFollowStatus('blocked');
    }
  };

  // Is this the logged-in user's own profile?`
);

// 4. Update fetchProfile to get status
content = content.replace(
  "badges: dbProf.badges || []\n          });",
  "badges: dbProf.badges || []\n          });\n          setFollowersCount(dbProf.followers_count || 0);\n          setFollowingCount(dbProf.following_count || 0);\n          if (currentUser?.id && currentUser.id !== dbProf.user_id) {\n            dbGetFollowStatus(currentUser.id, dbProf.user_id).then(setFollowStatus);\n          }"
);

// 5. Add follow button to UI
const buttonsOld = `{!isSelf && (
                  <AppButton
                    onClick={handleMessage}`;
const buttonsNew = `{!isSelf && followStatus === 'blocked' ? (
                  <AppButton disabled variant="outline" size="sm" className="text-red-500 border-red-500">
                    <ShieldAlert className="w-4 h-4 mr-1" /> {isEn ? 'Blocked' : 'بلاک شدہ'}
                  </AppButton>
                ) : !isSelf ? (
                  <>
                    <AppButton
                      onClick={handleFollowToggle}
                      loading={isFollowLoading}
                      variant={followStatus === 'none' ? 'primary' : 'outline'}
                      size="sm"
                      className={followStatus !== 'none' ? 'border-slate-300 text-slate-700' : ''}
                      leftIcon={
                        followStatus === 'following' ? <UserCheck className="w-3.5 h-3.5" /> :
                        followStatus === 'requested' ? <Clock className="w-3.5 h-3.5" /> :
                        <UserPlus className="w-3.5 h-3.5" />
                      }
                    >
                      {followStatus === 'following' ? (isEn ? 'Following' : 'فالو کر رہے ہیں') :
                       followStatus === 'requested' ? (isEn ? 'Requested' : 'درخواست بھیجی') :
                       (isEn ? 'Follow' : 'فالو کریں')}
                    </AppButton>
                    <AppButton
                      onClick={handleMessage}
                      size="sm"
                      variant="outline"
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                    >
                      {isEn ? 'Message' : 'پیغام'}
                    </AppButton>
                    <button onClick={handleBlock} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </>
                ) : null}
                {isSelf && (`;
content = content.replace(buttonsOld, buttonsNew);

// 6. Fix the "Message" button that was removed in the replace
content = content.replace(
  `{isEn ? 'Message' : 'U_UOOO U. O"U_UOOUOU'}\n                  </AppButton>\n                )}`,
  `` // remove the old message button since we injected it in the block above
);

// 7. Update Stats Bar to show Followers/Following
const statsOld = `{[
          { labelEn: 'Posts', labelUr: 'U_U^O3U1O3', value: userPosts.length },
          { labelEn: 'Reputation', labelUr: 'O3O UcU_', value: profileReputation },`;
const statsNew = `{[
          { labelEn: 'Posts', labelUr: 'پوسٹس', value: userPosts.length },
          { labelEn: 'Followers', labelUr: 'فالوورز', value: followersCount },
          { labelEn: 'Following', labelUr: 'فالو کر رہے ہیں', value: followingCount },`;
content = content.replace(statsOld, statsNew);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched UserProfileView.tsx');
